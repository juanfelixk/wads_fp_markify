import { NextRequest, NextResponse } from "next/server";
import { getGradingPageData, saveGrade } from "@/services/lecturer/server";
import { SaveGradePayload } from "@/services/lecturer/types";

// helper
function errorResponse(e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    const status =
        message === "Unauthorized" ? 401 :
        message === "Forbidden" ? 403 :
        message === "Not found" ? 404 :
        message === "Invalid score" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string; submissionId: string }> }) {
    try {
        const { classId, assignmentId, submissionId } = await params;
        const data = await getGradingPageData(classId, assignmentId, submissionId);
        return NextResponse.json({ data });
    } catch (e) {
        return errorResponse(e);
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string; submissionId: string }> }) {
    try {
        const { classId, assignmentId, submissionId } = await params;
        const payload = (await req.json()) as SaveGradePayload;
        await saveGrade(classId, assignmentId, submissionId, payload);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return errorResponse(e);
    }
}