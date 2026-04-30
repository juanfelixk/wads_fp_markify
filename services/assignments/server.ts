import { prisma } from "@/lib/prisma";
import { getSession } from "../auth/server";
import type { AssignmentPageData, RubricCriterion, CalendarAssignment, CreateAssignmentPayload, CreatedAssignment } from "./types";
import { getStudentSubmission } from "../submissions/server";
import { Prisma, SubmissionStatus } from "@/generated/prisma";

export async function getAssignmentPageData(classId: string, assignmentId: string): Promise<AssignmentPageData> {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const studentId = session.user.id;
    // verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId, classId } },
    });
    if (!enrollment) throw new Error("Forbidden");

    // fetch assignment with class and course info
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            class: {
                include: {
                    course: true,
                    lecturer: { select: { name: true } },
                },
            },
        },
    });
    if (!assignment) throw new Error("Not found");
    if (assignment.classId !== classId) throw new Error("Not found");

    const rawSubmission = await getStudentSubmission(assignmentId, studentId);

    let submission = rawSubmission;

    if (rawSubmission) {
        const isLate =
            rawSubmission.submittedAt &&
            new Date(rawSubmission.submittedAt).getTime() >
            assignment.endDate.getTime();

        const isRevised =
            (rawSubmission.revisionHistory?.length ?? 0) > 0;

        let status: SubmissionStatus;

        if (rawSubmission.status === "GRADED") {
            status = "GRADED"; // preserve
        } else if (isRevised) {
            status = isLate ? "SUBMITTED_LATE" : "REVISED";
        } else {
            status = isLate ? "SUBMITTED_LATE" : "SUBMITTED";
        }

        submission = rawSubmission ? {
            ...rawSubmission,
            criterionScores: rawSubmission.criterionScores ?? [],
        } : null;
    }
    
    return {
        id: assignment.id,
        title: assignment.title,
        instructions: assignment.instructions,
        maxPoints: assignment.maxPoints,
        rubric: (assignment.rubric as RubricCriterion[] | null) ?? null,
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate.toISOString(),
        lateAllowed: assignment.lateAllowed,

        classId: assignment.class.id,
        classCode: assignment.class.code,
        academicYear: assignment.class.academicYear,
        courseId: assignment.class.course.id,
        courseName: assignment.class.course.name,
        courseCode: assignment.class.course.code,
        lecturerName: assignment.class.lecturer.name,

        submission,

        role: session.user.role as "STUDENT" | "LECTURER",
    };
}

export async function getCalendarAssignments(studentId: string): Promise<CalendarAssignment[]> {
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId },
        include: {
            class: {
                include: {
                    course: true,
                    assignments: {
                        include: {
                            submissions: {
                                where: { studentId },
                                select: { status: true },
                            },
                        },
                    },
                },
            },
        },
    });

    const assignments = enrollments.flatMap((e) =>
        e.class.assignments.map((a) => ({
            id: a.id,
            title: a.title,
            classId: e.class.id,
            classCode: e.class.code,
            courseCode: e.class.course.code,
            courseName: e.class.course.name,
            startDate: a.startDate.toISOString(),
            endDate: a.endDate.toISOString(),
            status: a.submissions[0]?.status ?? "NOT_SUBMITTED",
        }))
    );

    return assignments;
}

export async function getAssignmentsInClass(classId: string, studentId: string) {
    // verify valid student enrollment
    const enrollment = await prisma.enrollment.findUnique({
        where: {
            studentId_classId: { studentId, classId },
        },
    });
    if (!enrollment) {
        throw new Error("Forbidden");
    }

    // check class existence
    const cls = await prisma.class.findUnique({
        where: { id: classId },
        include: {
            course: true,
            lecturer: { select: { name: true } },
            assignments: {
                orderBy: { endDate: "asc" },
                include: {
                    submissions: {
                        where: { studentId },
                        select: { status: true },
                    },
                },
            },
        },
    });
    if (!cls) {
        throw new Error("Not found");
    }

    const data = {
        classId: cls.id,
        classCode: cls.code,
        academicYear: cls.academicYear,
        courseName: cls.course.name,
        courseCode: cls.course.code,
        lecturerName: cls.lecturer.name ?? "Unknown",
        institution: cls.course.institution,
        assignments: cls.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        maxPoints: a.maxPoints,
        startDate: a.startDate.toISOString(),
        endDate: a.endDate.toISOString(),
        status: a.submissions[0]?.status ?? "NOT_SUBMITTED",
        })),
    };

    return data;
}

// lecturer-side
export async function createClassAssignment(classId: string, lecturerId: string, payload: CreateAssignmentPayload): Promise<CreatedAssignment | null> {
    const cls = await prisma.class.findFirst({
        where: { id: classId, lecturerId },
        select: { id: true },
    });
    if (!cls) return null;
 
    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);
 
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format.");
    }
    if (endDate <= startDate) {
        throw new Error("End date must be after start date.");
    }
    if (!payload.title.trim()) {
        throw new Error("Title is required.");
    }
 
    if (payload.rubric && payload.rubric.length > 0) {
        const totalWeight = payload.rubric.reduce((sum, c) => sum + c.weight, 0);
        if (Math.round(totalWeight) !== 100) {
            throw new Error("Rubric criterion weights must sum to 100.");
        }
        for (const c of payload.rubric) {
            if (!c.name.trim()) throw new Error("Each rubric criterion must have a name.");
            if (c.maxPoints <= 0) throw new Error("Each rubric criterion must have positive max points.");
            if (c.weight <= 0) throw new Error("Each rubric criterion weight must be positive.");
        }
    }
 
    const assignment = await prisma.assignment.create({
        data: {
            classId,
            title: payload.title.trim(),
            instructions: payload.instructions?.trim() || null,
            maxPoints: payload.maxPoints ?? null,
            lateAllowed: payload.lateAllowed ?? false,
            startDate,
            endDate,
            rubric: payload.rubric && payload.rubric.length > 0
                ? (payload.rubric as unknown as Prisma.InputJsonValue)
                : undefined,
        },
        select: { id: true, title: true, startDate: true, endDate: true },
    });
 
    return {
        id: assignment.id,
        title: assignment.title,
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate.toISOString(),
    };
}

// lecturer-side
export async function deleteAssignmentById(assignmentId: string): Promise<void> {
    await prisma.assignment.delete({ where: { id: assignmentId } })
}

// lecturer-side
export async function getAssignmentById(assignmentId: string) {
    return prisma.assignment.findUnique({
        where: { id: assignmentId },
    });
}

// lecturer-side
export async function updateAssignmentById(assignmentId: string, data: CreateAssignmentPayload) {
    return prisma.assignment.update({
        where: { id: assignmentId },
        data: {
            title: data.title,
            instructions: data.instructions,
            maxPoints: data.maxPoints,
            lateAllowed: data.lateAllowed,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            rubric: (data.rubric ?? []) as unknown as Prisma.InputJsonValue,
        },
    });
}