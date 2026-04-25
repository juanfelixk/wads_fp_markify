import { NextRequest, NextResponse } from "next/server";
import { recordSubmissionUpload } from "@/services/submissions/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME  = "application/pdf";

export async function POST(req: NextRequest, { params }: { params: Promise<{ classId: string, assignmentId: string }> }) {
    const { classId, assignmentId } = await params;

    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        if (file.type !== ALLOWED_MIME) {
            return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File exceeds the 10 MB limit" }, { status: 400 });
        }

        const result = await recordSubmissionUpload(classId, assignmentId, file);
        return NextResponse.json(result, { status: 201 });
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