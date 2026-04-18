import { SubmissionData } from "../submissions/types";

export type AssignmentStatus =
    | "NOT_SUBMITTED"
    | "SUBMITTED"
    | "REVISED"
    | "GRADED"
    | "SUBMITTED_LATE"
    | "TO_BE_REVIEWED";

export interface Assignment {
    id: string;
    title: string;
    instructions: string | null;
    maxPoints: number | null;
    startDate: string;
    endDate: string;
    status: AssignmentStatus;
    lateAllowed: boolean | null;
}

export interface CalendarAssignment {
    id: string;
    title: string;
    classId: string;
    classCode: string;
    courseCode: string;
    courseName: string;
    startDate: string;
    endDate: string;
    status: AssignmentStatus;
}

export interface RubricCriterion {
    name: string;
    description: string;
    maxPoints: number;
    weight: number;
}

export interface AssignmentPageData {
    id: string;
    title: string;
    instructions: string | null;
    maxPoints: number | null;
    rubric: RubricCriterion[] | null;
    startDate: string;
    endDate: string;
    lateAllowed: boolean | null;
 
    // breadcrumb
    classId: string;
    classCode: string;
    academicYear: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    lecturerName: string | null;
 
    submission: SubmissionData | null;

    role: "STUDENT" | "LECTURER";
}