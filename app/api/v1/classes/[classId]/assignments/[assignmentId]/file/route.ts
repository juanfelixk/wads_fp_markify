import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/server";
import { prisma } from "@/lib/prisma";
import { getStudentSubmission } from "@/modules/submissions/server";
import { getPresignedUrl } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string }> }) {
    const { classId, assignmentId } = await params;

    try {
        const session = await getSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const studentId = session.user.id;
        // verify enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: { studentId_classId: { studentId, classId } },
        });
        if (!enrollment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // verify valid submission
        const submission = await getStudentSubmission(assignmentId, studentId);
        if (!submission?.currentFile) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // get url
        const url = await getPresignedUrl(submission.currentFile.fileUrl);
        return NextResponse.json({ url });
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}