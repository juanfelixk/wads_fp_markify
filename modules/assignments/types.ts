export type AssignmentStatus =
    | "NOT_SUBMITTED"
    | "SUBMITTED"
    | "REVISED"
    | "GRADED";

export interface Assignment {
    id: string;
    title: string;
    instructions: string | null;
    maxPoints: number | null;
    startDate: string;
    endDate: string;
    status: AssignmentStatus;
}
 
export interface ClassDetail {
    classId: string;
    classCode: string;
    academicYear: string;
    courseName: string;
    courseCode: string;
    lecturerName: string;
    institution: string;
    assignments: Assignment[];
}