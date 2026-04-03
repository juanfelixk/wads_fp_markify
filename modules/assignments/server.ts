import { prisma } from "@/lib/prisma";
import { getSession } from "../auth/server";
import type { AssignmentPageData, RubricCriterion } from "./types";
import { getStudentSubmission } from "../submissions/server";
import { SubmissionStatus } from "@/generated/prisma";

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

    submission = {
        ...rawSubmission,
        status,
    };
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
    };
}