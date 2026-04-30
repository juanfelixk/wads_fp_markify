import { Assignment } from "../assignments/types";

export interface ClassSummary {
    classId: string;
    courseCode: string;
    classCode: string;
    courseName: string;
    institution: string;
    academicYear: string;
    lecturer: string;
    students: number;
    enrollmentKey: string;
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

export interface LecturerAssignment {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    submissions: number;
    graded: number;
}
 
export interface LecturerClassPageData {
    classId: string;
    courseCode: string;
    courseName: string;
    classCode: string;
    academicYear: string;
    students: number;
    assignments: LecturerAssignment[];
}