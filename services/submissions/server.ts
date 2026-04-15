import { prisma } from "@/lib/prisma";
import { getSession } from "../auth/server";
import { SubmissionStatus } from "@/generated/prisma";
import type { SubmissionData, SubmissionVersionData } from "./types";
import { gradeSubmission } from "@/services/ai/server";
import { Prisma } from "@/generated/prisma";
import { uploadFile, getPresignedUrl } from "@/lib/storage";

// helper
function formatVersion(v: {
    id: string;
    version: number;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: Date;
}): SubmissionVersionData {
    return {
        id: v.id,
        version: v.version,
        fileName: v.fileName,
        fileSize: v.fileSize,
        fileUrl: v.fileUrl,
        uploadedAt: v.uploadedAt.toISOString(),
    };
}

export async function getStudentSubmission(assignmentId: string, studentId: string): Promise<SubmissionData | null> {
    // find submission
    const submission = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        include: {
            versions: { orderBy: { version: "desc" } },
            criterionScores: true,
        },
    });
    if (!submission) return null;

    const [currentVersion, ...olderVersions] = submission.versions;
    return {
        id: submission.id,
        status: submission.status,
        finalScore: submission.finalScore,
        aiScore: submission.aiScore,
        comment: submission.comment,
        submittedAt: submission.submittedAt?.toISOString() ?? null,
        currentFile: currentVersion ? formatVersion(currentVersion) : null,
        revisionHistory: olderVersions.map(formatVersion),
        criterionScores: submission.criterionScores ?? [],
    };
}

export async function recordSubmissionUpload(classId: string, assignmentId: string, file: File) {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const studentId = session.user.id;
    // verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId, classId } },
    });
    if (!enrollment) throw new Error("Forbidden");

    // verify assignment exists and belongs to this class
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { id: true, classId: true,endDate: true, lateAllowed: true },
    });
    if (!assignment || assignment.classId !== classId) throw new Error("Not found");
    
    // check late allowed
    const isLate = (new Date()) > assignment.endDate;
    if (isLate && !assignment.lateAllowed) {
        throw new Error("Late submissions are not allowed.");
    }

    // determine next version number
    const existing = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (existing?.status === SubmissionStatus.GRADED) throw new Error("Graded");
    const nextVersion = existing ? ((existing.versions[0]?.version ?? 0) + 1) : 1;

    // check has existing submission and lateness to determine new status
    const hasExistingSubmission = !!existing && (existing.versions[0]?.version ?? 0) > 0;
    let newStatus: SubmissionStatus;
    if (isLate) {
        newStatus = SubmissionStatus.SUBMITTED_LATE;
    } else {
        newStatus = hasExistingSubmission ? SubmissionStatus.REVISED : SubmissionStatus.SUBMITTED;
    }

    // upload to storage
    const fileUrl = await uploadFile({
        buffer: Buffer.from(await file.arrayBuffer()),
        fileName: file.name,
        mimeType: file.type,
        folder: `submissions/${classId}/${assignmentId}`,
    });

    // update status and time
    const [submission, version] = await prisma.$transaction(async (tx) => {
        const sub = await tx.submission.upsert({
            where: { assignmentId_studentId: { assignmentId, studentId } },
            create: {
                assignmentId,
                studentId,
                status: newStatus,
                fileUrl: fileUrl,
                fileName: file.name,
                fileSize: file.size,
                submittedAt: new Date(),
            },
            update: {
                status: newStatus,
                fileUrl: fileUrl,
                fileName: file.name,
                fileSize: file.size,
                submittedAt: new Date(),
                aiScore: null,
                aiGrammarFeedback: Prisma.JsonNull,
                aiStructureFeedback: Prisma.JsonNull,
            },
        });

        const ver = await tx.submissionVersion.create({
            data: {
                submissionId: sub.id,
                version: nextVersion,
                fileName: file.name,
                fileSize: file.size,
                fileUrl: fileUrl,
            },
        });
        return [sub, ver];
    });

    void gradeSubmission(assignmentId, studentId, fileUrl).then((result) => {
        if (!result.success) {
            console.error("[recordSubmissionUpload] grading failed:", result.error);
        }
    });

    return {
        submissionId: submission.id,
        status: submission.status,
        version: formatVersion(version),
    };
}

export async function getSubmissionFileUrl(classId: string, assignmentId: string, studentId: string) {
    // verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId, classId } },
    });
    if (!enrollment) {
        throw new Error("Forbidden");
    };

    // verify valid submission
    const submission = await getStudentSubmission(assignmentId, studentId);
    if (!submission?.currentFile) {
        throw new Error("Not found");
    };

    // get url
    const url = await getPresignedUrl(submission.currentFile.fileUrl);

    return url;
}