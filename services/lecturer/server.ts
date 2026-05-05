import { prisma } from "@/lib/prisma";
import { getSession } from "@/services/auth/server";
import { getPresignedUrl } from "@/lib/storage";
import { RubricCriterion } from "@/services/assignments/types";
import { GradingPageData, SaveGradePayload } from "./types";

export async function getCourses(institution: string) {
    return prisma.course.findMany({
        where: { institution },
        select: {
            id: true,
            code: true,
            name: true,
            institution: true,
            createdAt: true,
            _count: { select: { classes: true } },
        },
        orderBy: { name: "asc" },
    });
}

export async function createClass({ courseId, code, academicYear, enrollmentKey, lecturerId, institution }: {
    courseId: string;
    code: string;
    academicYear: string;
    enrollmentKey: string;
    lecturerId: string;
    institution: string;
}) {
    const course = await prisma.course.findFirst({
        where: { id: courseId, institution },
    });

    if (!course) {
        throw new Error("Course not found or not in your institution.");
    }

    code = code.trim().toUpperCase();
    academicYear = academicYear.trim().toUpperCase();

    const existing = await prisma.class.findFirst({
        where: { courseId, code, academicYear },
    });

    if (existing) {
        throw new Error(`A class with code ${code} already exists for this course in AY ${academicYear}.`);
    }

    return prisma.class.create({
        data: { code, academicYear, enrollmentKey, courseId, lecturerId },
    });
}

// helper
function generateEnrollmentKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    for (let i = 0; i < 6; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

export async function generateUniqueEnrollmentKey(): Promise<string> {
    let key: string;
    let exists = true;
    // loop until a random unique key is generated
    do {
        key = generateEnrollmentKey();
        const existing = await prisma.class.findFirst({ where: { enrollmentKey: key } });
        exists = !!existing;
    } while (exists);
    return key;
}

// helper
async function getLecturerSession() {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "LECTURER") throw new Error("Forbidden");
    return session;
}

// helper
async function verifyLecturerOwnsClass(lecturerId: string, classId: string) {
    const cls = await prisma.class.findUnique({
        where: { id: classId },
        include: { course: true },
    });
    if (!cls || cls.lecturerId !== lecturerId) throw new Error("Forbidden");
    return cls;
}

export async function getGradingPageData(classId: string, assignmentId: string, submissionId: string): Promise<GradingPageData> {
    const session = await getLecturerSession();
    const cls = await verifyLecturerOwnsClass(session.user.id, classId);

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            assignment: { include: { class: { include: { course: true } } } },
            annotations: { orderBy: { page: "asc" } },
            criterionScores: true,
            student: { select: { id: true, name: true, email: true } },
        },
    });

    if (!submission) throw new Error("Not found");
    if (submission.assignment.classId !== classId) throw new Error("Forbidden");
    if (submission.assignmentId !== assignmentId) throw new Error("Forbidden");

    const { assignment } = submission;

    return {
        courseCode: cls.course.code,
        courseName: cls.course.name,
        classCode: cls.code,
        assignmentTitle: assignment.title,
        role: "LECTURER",
        submittedAt: submission.submittedAt?.toISOString() ?? null,
        isIrrelevant: submission.isIrrelevant,
        status: submission.status,
        fileName: submission.fileName,
        aiScore: submission.aiScore,
        finalScore: submission.finalScore,
        comment: submission.comment,
        maxPoints: assignment.maxPoints,
        aiGrammarFeedback: submission.aiGrammarFeedback,
        aiStructureFeedback: submission.aiStructureFeedback,
        rubric: (assignment.rubric as RubricCriterion[] | null) ?? null,
        criterionScores: submission.criterionScores,
        annotations: submission.annotations.map((a) => ({
            id: a.id,
            page: a.page,
            content: a.content,
            quote: a.quote,
            type: a.type,
            source: a.source,
        })),
        studentName: submission.student.name ?? submission.student.email,
        studentId: submission.student.id,
        gradesPublishedAt: assignment.gradesPublishedAt?.toISOString() ?? null,
    };
}

export async function getStudentSubmissionFileUrl(classId: string, assignmentId: string, submissionId: string): Promise<string> {
    const session = await getLecturerSession();
    await verifyLecturerOwnsClass(session.user.id, classId);

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: {
            fileUrl: true,
            assignmentId: true,
            assignment: { select: { classId: true } },
        },
    });

    if (!submission || !submission.fileUrl) throw new Error("Not found");
    if (submission.assignmentId !== assignmentId || submission.assignment.classId !== classId)
        throw new Error("Forbidden");

    return getPresignedUrl(submission.fileUrl);
}

export async function saveGrade(classId: string, assignmentId: string, submissionId: string, payload: SaveGradePayload): Promise<void> {
    const session = await getLecturerSession();
    await verifyLecturerOwnsClass(session.user.id, classId);

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: {
            assignmentId: true,
            assignment: { select: { classId: true } },
        },
    });

    if (!submission) throw new Error("Not found");
    if (submission.assignmentId !== assignmentId || submission.assignment.classId !== classId)
        throw new Error("Forbidden");

    if (typeof payload.finalScore !== "number" || payload.finalScore < 0)
        throw new Error("Invalid score");

    await prisma.$transaction(async (tx) => {
        await tx.submission.update({
            where: { id: submissionId },
            data: {
                finalScore: payload.finalScore,
                comment: payload.comment,
                status: "GRADE_SAVED",
            },
        });

        for (const override of payload.criterionOverrides ?? []) {
            await tx.submissionCriterionScore.updateMany({
                where: { submissionId, criterionName: override.criterionName },
                data: { pointsAwarded: override.pointsAwarded },
            });
        }
    });
}

export async function publishGrades(classId: string, assignmentId: string): Promise<{ publishedCount: number }> {
    const session = await getLecturerSession();
    await verifyLecturerOwnsClass(session.user.id, classId);

    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { classId: true, gradesPublishedAt: true },
    });

    if (!assignment) throw new Error("Not found");
    if (assignment.classId !== classId) throw new Error("Forbidden");
    if (assignment.gradesPublishedAt) throw new Error("Already published");

    // verify all submitted submissions have GRADE_SAVED status
    const submissions = await prisma.submission.findMany({
        where: { assignmentId },
        select: { id: true, status: true, studentId: true },
    });

    const submitted = submissions.filter((s) => s.status !== "NOT_SUBMITTED");
    const ungradedCount = submitted.filter((s) => s.status !== "GRADE_SAVED").length;
    if (ungradedCount > 0) throw new Error(`${ungradedCount} submission(s) have not been graded yet.`);

    // find enrolled students who have no submission row at all
    const enrollments = await prisma.enrollment.findMany({
        where: { classId },
        select: { studentId: true },
    });

    const submittedStudentIds = new Set(submissions.map((s) => s.studentId));
    const missingStudentIds = enrollments.map((e) => e.studentId).filter((id) => !submittedStudentIds.has(id));

    await prisma.$transaction(async (tx) => {
        // create zero-score GRADED submissions for students who never submitted
        if (missingStudentIds.length > 0) {
            await tx.submission.createMany({
                data: missingStudentIds.map((studentId) => ({
                    assignmentId,
                    studentId,
                    status: "GRADED",
                    finalScore: 0,
                })),
            });
        }

        // handle any existing NOT_SUBMITTED rows (edge case)
        await tx.submission.updateMany({
            where: { assignmentId, status: "NOT_SUBMITTED" },
            data: { finalScore: 0, status: "GRADED" },
        });

        // change all GRADE_SAVED to GRADED
        await tx.submission.updateMany({
            where: { assignmentId, status: "GRADE_SAVED" },
            data: { status: "GRADED" },
        });

        // timestamp the assignment
        await tx.assignment.update({
            where: { id: assignmentId },
            data: { gradesPublishedAt: new Date() },
        });
    });

    const totalCount = submissions.length + missingStudentIds.length;
    return { publishedCount: totalCount };
}