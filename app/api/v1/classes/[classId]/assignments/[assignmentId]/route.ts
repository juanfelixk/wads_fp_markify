import { NextRequest, NextResponse } from "next/server";
import { getAssignmentPageData } from "@/modules/assignments/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string, assignmentId: string }> }) {
    const { classId } = await params;
    const { assignmentId } = await params;

    try {
        const data = await getAssignmentPageData(classId, assignmentId);
        return NextResponse.json({ data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal error";
        const status =
            message === "Unauthorized" ? 401
            : message === "Forbidden"  ? 403
            : message === "Not found"  ? 404
            : 500;
        return NextResponse.json({ error: message }, { status });
    }
}