import { NextRequest, NextResponse } from "next/server";
import { getGradingPageData, saveGrade } from "@/services/lecturer/server";
import { SaveGradePayload } from "@/services/lecturer/types";

/**
 * @swagger
 * /api/v1/lecturer/class/{classId}/assignment/{assignmentId}/grading/{submissionId}:
 *   get:
 *     summary: Get grading page data
 *     description: Retrieve grading details and submission data for a student's assignment submission.
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
 *         example: class123
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         example: assignment456
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         example: submission789
 *     responses:
 *       200:
 *         description: Successfully retrieved grading page data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   example:
 *                     studentName: John Doe
 *                     score: 90
 *                     feedback: Great work
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid score
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
 *         description: Submission not found
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
 *
 *   patch:
 *     summary: Save assignment grade
 *     description: Save or update the grade and feedback for a student's assignment submission.
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
 *         example: class123
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         example: assignment456
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         example: submission789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               score: 95
 *               feedback: Excellent improvement
 *     responses:
 *       200:
 *         description: Grade saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid score or request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid score
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
 *         description: Submission not found
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