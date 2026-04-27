import { getFeedbackPageData } from "@/services/feedback/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ classId: string, assignmentId: string }> }) {
    const { classId, assignmentId } = await params;
    const versionId = req.nextUrl.searchParams.get("versionId") ?? undefined;

    try {
        const data = await getFeedbackPageData(classId, assignmentId, versionId);
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