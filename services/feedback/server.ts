"use server";
 
import { prisma } from "@/lib/prisma";
import { getSession } from "@/services/auth/server";
import type { FeedbackPageData } from "./types";
import { RubricCriterion } from "../assignments/types";

export async function getFeedbackPageData(classId: string, assignmentId: string, versionId?: string): Promise<FeedbackPageData> {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const studentId = session.user.id;
    
    // verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId, classId } },
    });
    if (!enrollment) throw new Error("Forbidden");
    
    // fetch submission with all related data
    const submission = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        include: {
            assignment: {
                include: {
                class: { include: { course: true } },
                },
            },
            annotations: {
                orderBy: { page: "asc" },
            },
            criterionScores: true,
        },
    });
    
    if (!submission) throw new Error("Not found");

    let displayFileName = submission.fileName;
    if (versionId) {
        const version = await prisma.submissionVersion.findUnique({
            where: { id: versionId },
            select: { fileName: true },
        });
        if (version?.fileName) displayFileName = version.fileName;
    }
    
    const { assignment } = submission;
    const { class: cls } = assignment;
    
    return {
        courseCode: cls.course.code,
        courseName: cls.course.name,
        classCode: cls.code,
        assignmentTitle: assignment.title,
        role: session.user.role as "STUDENT" | "LECTURER",
        submittedAt: submission.submittedAt?.toISOString() ?? null,
    
        isIrrelevant: submission.isIrrelevant,
        status: submission.status,
        fileName: displayFileName,
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
    };
}