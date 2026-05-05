import { FeedbackPageData } from "../feedback/types";

export interface CourseSummary {
    id: string;
    code: string;
    name: string;
    institution: string;
    createdAt: string;
    _count: { classes: number };
}

export interface CreateClassPayload {
    courseId: string;
    code: string;
    academicYear: string;
}

export interface GradingPageData extends FeedbackPageData {
    studentName: string;
    studentId: string;
    gradesPublishedAt: string | null;
}

export interface SaveGradePayload {
    finalScore: number;
    comment: string;
    criterionOverrides: { 
        criterionName: string; 
        pointsAwarded: number 
    }[];
}

export interface PublishGradesResult {
    publishedCount: number;
}