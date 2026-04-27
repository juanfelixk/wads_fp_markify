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