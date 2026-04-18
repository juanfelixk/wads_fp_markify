"use server";

import { prisma } from "@/lib/prisma";
import { RubricCriterion } from "@/services/assignments/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@/generated/prisma";
import { getPresignedUrl } from "@/lib/storage";
import { GradingResult } from "./types";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const GOOGLE_MODEL = "gemini-3.1-flash-lite-preview";
const MAX_RETRIES = 3;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// prompt
function buildPrompt(rubric: RubricCriterion[], maxPoints: number, assignmentTitle: string, instructions: string | null): string {
  const rubricText = rubric.length ? rubric.map((c) => `- ${c.name} (${c.maxPoints} pts): ${c.description}`).join("\n") : `- Overall quality (${maxPoints} pts): General quality, argument, and writing.`;
  const instructionsBlock = instructions?.trim() ? `Assignment Instructions:\n${instructions.trim()}` : "No specific instructions provided.";

  return `
    You are an academic grading assistant. Analyse the attached PDF submission and return ONLY a single valid JSON object, no markdown fences, no explanation, no preamble.
    Assignment: "${assignmentTitle}"
    Instructions: ${instructionsBlock}
    Total max points: ${maxPoints}
    Rubric criteria: ${rubricText}

    FIRST, decide if the submission is relevant to this assignment based on the INSTRUCTIONS given.
    A submission is IRRELEVANT if it is entirely off-topic, blank, lorem ipsum, or clearly for a different course.
    A weak or incomplete attempt that addresses the topic and instructions is still RELEVANT.

    If NOT RELEVANT, return ONLY this, do not generate scores, feedback, or annotations:
    {
      "isIrrelevant": true,
      "aiScore": 0,
      "rubricBreakdown": [],
      "aiGrammarFeedback": null,
      "aiStructureFeedback": null,
      "annotations": []
    }

    If RELEVANT, return exactly this JSON shape with "isIrrelevant": false:
    {
      "isIrrelevant": false,
      "aiScore": <integer - total points awarded, capped at ${maxPoints}>,
      "rubricBreakdown": [
        {
          "criterionName": "<exact criterion name from rubric>",
          "pointsAwarded": <integer>,
          "pointsMax": <integer>,
          "rationale": "<1-2 sentences explaining the score>"
        }
      ],
      "aiGrammarFeedback": {
        "summary": "<1-2 sentence overview of grammar quality>",
        "issues": [
          {
            "type": "<e.g. Subject-Verb Agreement | Comma Splice | Spelling | Word Choice>",
            "severity": "<LOW|MEDIUM|HIGH>",
            "original": "<quoted text from submission, max 20 words>",
            "suggestion": "<corrected version>",
            "explanation": "<brief explanation>"
          }
        ]
      },
      "aiStructureFeedback": {
        "overview": "<1-2 sentence overview of document structure>",
        "sections": [
          {
            "name": "<section name e.g. Introduction | Argument | Evidence | Conclusion>",
            "score": <integer 0-10>,
            "maxScore": 10,
            "feedback": "<specific actionable feedback>"
          }
        ]
      },
      "annotations": [
        {
          "page": <1-based integer>,
          "x": <float — left edge of the highlighted text as % of page width, 0-90>,
          "y": <float — top edge of the highlighted text as % of page height, 0-90>,
          "width":  <float — width of the text span as % of page width, typically 10-60>,
          "height": <float — height of one or two lines of text as % of page height, typically 2-6>,
          "type": "<PRAISE|ISSUE|SUGGESTION>",
          "content": "<your comment, 1-3 sentences>",
          "quote": "<exact short text this annotation covers, max 25 words>"
        }
      ]
    }

    Rules (RELEVANT only):
    - Provide 5-10 annotations spread across different pages.
    - Every annotation MUST include width and height, never null.
    - x/y mark the TOP-LEFT corner of the text run being annotated.
    - width/height should tightly wrap the quoted text, not the whole page.
    - Score strictly per rubric. Award 0 for any criterion not addressed.
    - aiScore must equal the sum of all pointsAwarded values.
    - List up to 8 grammar issues, most impactful only.
    - Structure sections should reflect sections actually present in the document.
    - Deduct the grade if the text does not follow the instructions.
  `;
}

// fetch pdf (for models supporting pdf file input)
async function fetchPdfBuffer(key: string): Promise<Buffer> {
  const presignedUrl = await getPresignedUrl(key);
  const res = await fetch(presignedUrl);
  if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}


// extract text from pdf (for models not supporting pdf file input)
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    // disable worker in node.js server context
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    text += pageText + "\n";
  }
  return text.slice(0, 15000);
}

// call gemini with limited retry
async function callGemini(pdfBase64: string, prompt: string, attempt = 1): Promise<GradingResult> {
  try {
    const model = genAI.getGenerativeModel({ model: GOOGLE_MODEL });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    });
    const raw = result.response.text();
    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    console.log("Grading successful using Gemini.");
    return JSON.parse(clean) as GradingResult;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      return callGemini(pdfBase64, prompt, attempt + 1);
    }
    throw err;
  }
}

// call llama
async function callLlama(text: string, prompt: string, attempt = 1): Promise<GradingResult> {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a strict grading assistant. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `${prompt}\n\n--- STUDENT SUBMISSION ---\n${text}`,
        },
      ],
      temperature: 0.2,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    console.log("Grading successful using Llama.");
    return JSON.parse(clean) as GradingResult;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      return callLlama(text, prompt, attempt + 1);
    }
    throw err;
  }
}

async function callAI(pdfBuffer: Buffer, prompt: string): Promise<GradingResult> {
  try {
    const base64 = pdfBuffer.toString("base64");
    return await callGemini(base64, prompt);
  } catch (err: any) {
    if (err?.status === 503 || err?.status === 429) {
      console.warn("Gemini failed -> fallback to Llama");
      const text = await extractPdfText(pdfBuffer);
      return await callLlama(text, prompt);
    }
    throw err;
  }
}

// grade
export async function gradeSubmission(assignmentId: string, studentId: string, pdfUrl: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { title: true, maxPoints: true, rubric: true, instructions: true },
    });
    if (!assignment) return { success: false, error: "Assignment not found" };

    const rubric = (assignment.rubric as RubricCriterion[] | null) ?? [];
    const maxPoints = assignment.maxPoints ?? 100;
    const pdfBuffer = await fetchPdfBuffer(pdfUrl);
    const prompt = buildPrompt(rubric, maxPoints, assignment.title, assignment.instructions);
    const result = await callAI(pdfBuffer, prompt);
    const isIrrelevant = result.isIrrelevant === true;
    const aiScore = isIrrelevant ? null : Math.max(0, Math.min(maxPoints, Math.round(result.aiScore)));

    await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        select: { id: true },
      });
      if (!submission) throw new Error("Submission not found");

      const submissionId = submission.id;

      await tx.submission.update({
        where: { id: submissionId },
        data: {
          isIrrelevant,
          aiScore,
          aiGrammarFeedback: isIrrelevant ? Prisma.JsonNull : result.aiGrammarFeedback as unknown as Prisma.InputJsonValue,
          aiStructureFeedback: isIrrelevant ? Prisma.JsonNull : result.aiStructureFeedback as unknown as Prisma.InputJsonValue,
          status: "TO_BE_REVIEWED",
        },
      });

      // delete existing
      await tx.submissionAnnotation.deleteMany({ where: { submissionId, source: "AI" } });
      await tx.submissionCriterionScore.deleteMany({ where: { submissionId } });

      if (!isIrrelevant) {
        for (const c of result.rubricBreakdown) {
          // upsert per criterion scores
          await tx.submissionCriterionScore.upsert({
            where: { submissionId_criterionName: { submissionId, criterionName: c.criterionName } },
            create: { submissionId, criterionName: c.criterionName, pointsAwarded: Math.max(0, c.pointsAwarded), pointsMax: c.pointsMax, rationale: c.rationale },
            update: { pointsAwarded: Math.max(0, c.pointsAwarded), pointsMax: c.pointsMax, rationale: c.rationale },
          });
        }

        // create inline annotations
        if (result.annotations?.length) {
          await tx.submissionAnnotation.createMany({
            data: result.annotations.map((ann) => ({
              submissionId, page: ann.page, x: ann.x, y: ann.y,
              width: ann.width ?? null, height: ann.height ?? null,
              type: ann.type, content: ann.content, quote: ann.quote ?? null,
              source: "AI" as const,
            })),
          });
        }
      }
    });
    
    return { success: true };
  } catch (err) {
    console.error("[gradeSubmission] error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Grading failed",
    };
  }
}