import { getFeedbackPageData } from "@/services/feedback/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/student/class/{classId}/assignment/{assignmentId}/feedback:
 *   get:
 *     summary: Get assignment feedback
 *     description: Retrieve feedback and grading details for a student's assignment submission.
 *     tags:
 *       - Student
 *       - Feedback
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
 *       - in: query
 *         name: versionId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional submission version ID
 *         example: version789
 *     responses:
 *       200:
 *         description: Successfully retrieved feedback data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   example:
 *                     score: 92
 *                     feedback: Excellent work and clear documentation.
 *                     gradedAt: "2026-05-27T12:00:00.000Z"
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
 *         description: Feedback or assignment not found
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