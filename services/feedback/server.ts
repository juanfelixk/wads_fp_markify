"use server";
 
import { prisma } from "@/lib/prisma";
import { getSession } from "@/services/auth/server";
import type { FeedbackPageData } from "./types";
import { RubricCriterion } from "../assignments/types";

export async function getFeedbackPageData(classId: string, assignmentId: string): Promise<FeedbackPageData> {
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
    
    if (!submission) throw new Error("Submission not found");
    
    const { assignment } = submission;
    const { class: cls } = assignment;
    
    return {
        courseCode: cls.course.code,
        courseName: cls.course.name,
        classCode: cls.code,
        assignmentTitle: assignment.title,
    
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
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height,
        content: a.content,
        quote: a.quote,
        type: a.type,
        source: a.source,
        })),
    };
}