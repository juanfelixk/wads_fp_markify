"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/services/auth/server";
import { RubricCriterion } from "@/services/assignments/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GrammarFeedback, StructureFeedback } from "../feedback/types";
import { Prisma } from "@/generated/prisma";
import { getPresignedUrl } from "@/lib/storage";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-3.1-flash-lite-preview";
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Internal types (not exposed to client)
// ---------------------------------------------------------------------------

interface RubricBreakdownItem {
  criterionName: string;
  pointsAwarded: number;
  pointsMax: number;
  rationale: string;
}

interface GradingAnnotation {
  page: number;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  type: "PRAISE" | "ISSUE" | "SUGGESTION";
  content: string;
  quote: string | null;
}

interface GradingResult {
  aiScore: number;
  rubricBreakdown: RubricBreakdownItem[];
  aiGrammarFeedback: GrammarFeedback;
  aiStructureFeedback: StructureFeedback;
  annotations: GradingAnnotation[];
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(
  rubric: RubricCriterion[],
  maxPoints: number,
  assignmentTitle: string
): string {
  const rubricText = rubric.length
    // FIX 1: was c.points — correct field is c.maxPoints per RubricCriterion type
    ? rubric.map((c) => `- ${c.name} (${c.maxPoints} pts): ${c.description}`).join("\n")
    : `- Overall quality (${maxPoints} pts): General quality, argument, and writing.`;

  return `You are an academic grading assistant. Analyse the attached PDF submission and return ONLY a single valid JSON object — no markdown fences, no explanation, no preamble.

Assignment: "${assignmentTitle}"
Total max points: ${maxPoints}

Rubric criteria:
${rubricText}

Return exactly this JSON shape:
{
  "aiScore": <integer — total points awarded, capped at ${maxPoints}>,
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
        "type": "<e.g. subject-verb agreement | comma splice | spelling | word choice>",
        "severity": "<low|medium|high>",
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
      "x": <float 0.05-0.85>,
      "y": <float 0.05-0.85>,
      "width": <float 0.1-0.5 or null>,
      "height": <float 0.03-0.15 or null>,
      "type": "<PRAISE|ISSUE|SUGGESTION>",
      "content": "<your comment, 1-3 sentences>",
      "quote": "<exact short text this refers to, max 25 words, or null>"
    }
  ]
}

Rules:
- Provide 5-10 annotations spread across different pages.
- Score strictly per rubric. Award 0 for any criterion not addressed.
- aiScore must equal the sum of all pointsAwarded values.
- List up to 8 grammar issues — most impactful only.
- Structure sections should reflect sections actually present in the document.`;
}

// ---------------------------------------------------------------------------
// Fetch PDF as base64
// ---------------------------------------------------------------------------

async function fetchPdfBase64(key: string): Promise<string> {
  // key is the raw B2 storage key — generate a presigned URL first
  const presignedUrl = await getPresignedUrl(key); // 5 min is enough
  const res = await fetch(presignedUrl);
  if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// ---------------------------------------------------------------------------
// Call Gemini with exponential backoff retry
// ---------------------------------------------------------------------------

async function callGemini(
  pdfBase64: string,
  prompt: string,
  attempt = 1
): Promise<GradingResult> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

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
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    return JSON.parse(clean) as GradingResult;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      return callGemini(pdfBase64, prompt, attempt + 1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// gradeSubmission — called from recordSubmissionUpload after file is saved
// ---------------------------------------------------------------------------

export async function gradeSubmission(
  assignmentId: string,
  studentId: string,
  pdfUrl: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { title: true, maxPoints: true, rubric: true },
    });
    if (!assignment) return { success: false, error: "Assignment not found" };

    const rubric = (assignment.rubric as RubricCriterion[] | null) ?? [];
    const maxPoints = assignment.maxPoints ?? 100;

    const pdfBase64 = await fetchPdfBase64(pdfUrl);
    const prompt = buildPrompt(rubric, maxPoints, assignment.title);
    const result = await callGemini(pdfBase64, prompt);

    const aiScore = Math.max(0, Math.min(maxPoints, Math.round(result.aiScore)));

    await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        select: { id: true },
      });
      if (!submission) throw new Error("Submission not found");

      const submissionId = submission.id;

      // FIX 2 & 3: Prisma's Json field requires plain object — cast through
      // unknown to satisfy the index signature Prisma expects on InputJsonValue
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          aiScore,
          aiGrammarFeedback: result.aiGrammarFeedback as unknown as Prisma.InputJsonValue,
          aiStructureFeedback: result.aiStructureFeedback as unknown as Prisma.InputJsonValue,
          status: "GRADED",
        },
      });

      // Upsert per-criterion scores
      for (const c of result.rubricBreakdown) {
        await tx.submissionCriterionScore.upsert({
          where: {
            submissionId_criterionName: { submissionId, criterionName: c.criterionName },
          },
          create: {
            submissionId,
            criterionName: c.criterionName,
            pointsAwarded: Math.max(0, c.pointsAwarded),
            pointsMax: c.pointsMax,
            rationale: c.rationale,
          },
          update: {
            pointsAwarded: Math.max(0, c.pointsAwarded),
            pointsMax: c.pointsMax,
            rationale: c.rationale,
          },
        });
      }

      // Replace AI annotations
      await tx.submissionAnnotation.deleteMany({
        where: { submissionId, source: "AI" },
      });

      if (result.annotations?.length) {
        await tx.submissionAnnotation.createMany({
          data: result.annotations.map((ann) => ({
            submissionId,
            page: ann.page,
            x: ann.x,
            y: ann.y,
            width: ann.width ?? null,
            height: ann.height ?? null,
            type: ann.type,
            content: ann.content,
            quote: ann.quote ?? null,
            source: "AI" as const,
          })),
        });
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

// ---------------------------------------------------------------------------
// reGradeSubmission — instructor-only, verifies they own the class
// ---------------------------------------------------------------------------

export async function reGradeSubmission(
  assignmentId: string,
  studentId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { classId: true },
  });
  if (!assignment) return { success: false, error: "Assignment not found" };

  const cls = await prisma.class.findFirst({
    where: { id: assignment.classId, lecturerId: session.user.id },
  });
  if (!cls) return { success: false, error: "Forbidden" };

  const submission = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    select: { fileUrl: true },
  });
  if (!submission?.fileUrl) return { success: false, error: "No file found" };

  return gradeSubmission(assignmentId, studentId, submission.fileUrl);
}