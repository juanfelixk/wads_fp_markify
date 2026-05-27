import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getSubmissionFileUrl } from "@/services/submissions/server";

/**
 * @swagger
 * /api/v1/lecturer/class/{classId}/assignment/{assignmentId}/submission/{studentId}/file:
 *   get:
 *     summary: Get student submission file
 *     description: Retrieve the file URL of a student's assignment submission for lecturers.
 *     tags:
 *       - Lecturer
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
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student
 *         example: student789
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
 *                   example: https://storage.example.com/submissions/report.pdf
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
 *         description: Submission file not found
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string; studentId: string }> }) {
    const { classId, assignmentId, studentId } = await params;

    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "LECTURER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const url = await getSubmissionFileUrl(classId, assignmentId, studentId);
        return NextResponse.json({ url });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal error";
        const status =
            message === "Forbidden" ? 403
            : message === "Not found" ? 404
            : 500;
        return NextResponse.json({ error: message }, { status });
    }
}