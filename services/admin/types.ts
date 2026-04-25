export interface LecturerOrStudent {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface LecturerClass {
    id: string;
    code: string;
    academicYear: string;
    course: { code: string; name: string };
    _count: { enrollments: number };
}

export interface StudentEnrollment {
    classId: string;
    courseCode: string;
    classCode: string;
    courseName: string;
    academicYear: string;
    lecturer: string;
    students: number;
}