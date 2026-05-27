import { NextRequest, NextResponse } from "next/server";
import { getAssignmentPageData } from "@/services/assignments/server";

/**
 * @swagger
 * /api/v1/student/class/{classId}/assignment/{assignmentId}:
 *   get:
 *     summary: Get assignment details
 *     description: Retrieve assignment page data for a student.
 *     tags:
 *       - Student
 *       - Assignment
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
 *     responses:
 *       200:
 *         description: Successfully retrieved assignment data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   example:
 *                     id: assignment456
 *                     title: Midterm Project
 *                     instructions: Build a REST API using Next.js
 *                     startDate: "2026-05-20T00:00:00.000Z"
 *                     endDate: "2026-06-01T23:59:00.000Z"
 *                     maxPoints: 100
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
 *         description: Assignment not found
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string, assignmentId: string }> }) {
    const { classId, assignmentId } = await params;

    try {
        const data = await getAssignmentPageData(classId, assignmentId);
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