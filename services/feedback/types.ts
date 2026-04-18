import { RubricCriterion } from "../assignments/types";
import type { SubmissionCriterionScore } from "@/generated/prisma";

export interface FeedbackPageData {
    courseCode: string;
    courseName: string;
    classCode: string;
    assignmentTitle: string;
    status: "NOT_SUBMITTED" | "SUBMITTED" | "SUBMITTED_LATE" | "REVISED" | "GRADED" | "TO_BE_REVIEWED";
    fileName: string | null;
    aiScore: number | null;
    finalScore: number | null;
    comment: string | null;
    maxPoints: number | null;
    aiGrammarFeedback: unknown | null;
    aiStructureFeedback: unknown | null;
    annotations: Annotation[];
    rubric: RubricCriterion[] | null;
    criterionScores: SubmissionCriterionScore[] | null;
    role: "STUDENT" | "LECTURER";
    isIrrelevant: boolean;
    submittedAt: string | null;
}

export type AnnotationType = "PRAISE" | "ISSUE" | "SUGGESTION";
export type AnnotationSource = "AI" | "LECTURER";
export interface Annotation {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  content: string;
  quote: string | null;
  type: AnnotationType;
  source: AnnotationSource;
}

export interface GrammarFeedback {
    summary?: string;
    issues: {
        type: string;
        severity: "low" | "medium" | "high";
        original?: string;
        suggestion?: string;
        explanation: string
    }[];
}

export interface StructureFeedback {
    overview?: string;
    sections: {
        name: string; 
        score: number;
        maxScore: number;
        feedback: string
    }[];
}