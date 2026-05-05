import { NextRequest, NextResponse } from "next/server";
import { publishGrades } from "@/services/lecturer/server";

function errorResponse(e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    const status =
        message === "Unauthorized" ? 401 :
        message === "Forbidden" ? 403 :
        message === "Not found" ? 404 :
        message === "Already published" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
}

export async function POST( _req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string }> }) {
    try {
        const { classId, assignmentId } = await params;
        const result = await publishGrades(classId, assignmentId);
        return NextResponse.json(result);
    } catch (e) {
        return errorResponse(e);
    }
}