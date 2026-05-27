import { NextRequest, NextResponse } from "next/server";
import { publishGrades } from "@/services/lecturer/server";

/**
 * @swagger
 * /api/v1/lecturer/class/{classId}/assignment/{assignmentId}/publish:
 *   post:
 *     summary: Publish assignment grades
 *     description: Publish all grades for a specific assignment so students can view them.
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
 *         example: assignment456
 *     responses:
 *       200:
 *         description: Grades published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 publishedAt: "2026-05-27T10:30:00.000Z"
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
 *         description: Class or assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Not found
 *       409:
 *         description: Grades already published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Already published
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