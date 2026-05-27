import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getSubmissionFileUrl } from "@/services/submissions/server";

/**
 * @swagger
 * /api/v1/student/class/{classId}/assignment/{assignmentId}/file:
 *   get:
 *     summary: Get submission file URL
 *     description: Retrieve the authenticated student's assignment submission file URL.
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
 *       - in: query
 *         name: versionId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional submission version ID
 *         example: version789
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
 *                   example: https://storage.example.com/submissions/assignment.pdf
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string; assignmentId: string }> }) {
    const { classId, assignmentId } = await params;
    const versionId = _req.nextUrl.searchParams.get("versionId") ?? undefined;

    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        } 

        const studentId = session.user.id;
        // get url
        const url = await getSubmissionFileUrl(classId, assignmentId, studentId, versionId);
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