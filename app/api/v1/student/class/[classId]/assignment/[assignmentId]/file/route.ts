import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getSubmissionFileUrl } from "@/services/submissions/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string }> }) {
    const { classId, assignmentId } = await params;
    const versionId = _req.nextUrl.searchParams.get("versionId") ?? undefined;

    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        } 

        const studentId = session.user.id;
        // get url
        const url = await getSubmissionFileUrl(classId, assignmentId, studentId, versionId);
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