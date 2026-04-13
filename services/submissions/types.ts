import { SubmissionStatus } from "@/generated/prisma";
import { SubmissionCriterionScore } from "@/generated/prisma";
 
export type { SubmissionStatus };

export interface SubmissionData {
    id: string;
    status: SubmissionStatus;
    finalScore: number | null;
    aiScore: number | null;
    comment: string | null;
    submittedAt: string | null;
    currentFile: SubmissionVersionData | null;
    revisionHistory: SubmissionVersionData[];
    criterionScores: SubmissionCriterionScore[];
}

export interface SubmissionVersionData {
    id: string;
    version: number;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: string;
}

export interface UploadResult {
    submissionId: string;
    version: SubmissionVersionData;
    status: SubmissionStatus;
}