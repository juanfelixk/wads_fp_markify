import { NextRequest, NextResponse } from "next/server";
import { getStudentSubmissionFileUrl } from "@/services/lecturer/server";

function errorResponse(e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    const status =
        message === "Unauthorized" ? 401 :
        message === "Forbidden" ? 403 :
        message === "Not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string; submissionId: string }> }) {
    try {
        const { classId, assignmentId, submissionId } = await params;
        const url = await getStudentSubmissionFileUrl(classId, assignmentId, submissionId);
        return NextResponse.json({ url });
    } catch (e) {
        return errorResponse(e);
    }
}