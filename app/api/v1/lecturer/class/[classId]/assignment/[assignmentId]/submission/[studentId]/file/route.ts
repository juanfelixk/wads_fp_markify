import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getSubmissionFileUrl } from "@/services/submissions/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string; studentId: string }> }) {
    const { classId, assignmentId, studentId } = await params;

    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "LECTURER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const url = await getSubmissionFileUrl(classId, assignmentId, studentId);
        return NextResponse.json({ url });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal error";
        const status =
            message === "Forbidden" ? 403
            : message === "Not found" ? 404
            : 500;
        return NextResponse.json({ error: message }, { status });
    }
}