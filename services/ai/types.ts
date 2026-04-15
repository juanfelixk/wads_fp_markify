import type { GrammarFeedback, StructureFeedback } from "../feedback/types";

export interface GradingResult {
  aiScore: number;
  rubricBreakdown: RubricBreakdownItem[];
  aiGrammarFeedback: GrammarFeedback;
  aiStructureFeedback: StructureFeedback;
  annotations: GradingAnnotation[];
}

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