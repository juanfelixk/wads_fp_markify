import { NextRequest, NextResponse } from "next/server";
import { getStudentSubmissionFileUrl } from "@/services/lecturer/server";

/**
 * @swagger
 * /api/v1/lecturer/class/{classId}/assignment/{assignmentId}/grading/{submissionId}/file:
 *   get:
 *     summary: Get student submission file URL
 *     description: Retrieve the file URL for a student's assignment submission for grading purposes.
 *     tags:
 *       - Lecturer
 *       - Grading
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
 *         example: assign456
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the submission
 *         example: sub789
 *     responses:
 *       200:
 *         description: Successfully retrieved submission file URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   example: https://storage.example.com/submissions/file.pdf
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
 *         description: Submission or file not found
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
 *                   example: Internal server error
 */

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