import { NextRequest, NextResponse } from "next/server";
import { recordSubmissionUpload } from "@/services/submissions/server";

/**
 * @swagger
 * /api/v1/student/class/{classId}/assignment/{assignmentId}/submit:
 *   post:
 *     summary: Submit assignment file
 *     description: Upload a PDF file submission for an assignment.
 *     tags:
 *       - Student
 *       - Submission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the class
 *         example: class123
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *         example: assignment456
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file upload (max 10 MB)
 *     responses:
 *       201:
 *         description: Submission uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 submissionId: submission789
 *       400:
 *         description: Invalid file upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     noFile:
 *                       value: No file provided
 *                     invalidType:
 *                       value: Only PDF files are accepted
 *                     fileTooLarge:
 *                       value: File exceeds the 10 MB limit
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Forbidden
 *       404:
 *         description: Assignment or class not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal error
 */

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