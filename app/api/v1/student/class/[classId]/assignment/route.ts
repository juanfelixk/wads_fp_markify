import { getSession } from "@/services/auth/server";
import { getAssignmentsInClass } from "@/services/assignments/server";

/**
 * @swagger
 * /api/v1/student/class/{classId}/assignment:
 *   get:
 *     summary: Get assignments in class
 *     description: Retrieve all assignments available in a specific class for the authenticated student.
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
 *     responses:
 *       200:
 *         description: Successfully retrieved assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     example:
 *                       id: assignment456
 *                       title: Midterm Project
 *                       dueDate: "2026-06-01T23:59:00.000Z"
 *                       maxPoints: 100
 *                 error:
 *                   type: string
 *                   nullable: true
 *                   example: null
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
 *         description: Forbidden access to the class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Forbidden.
 *       404:
 *         description: Class not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Class not found.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error.
 */

export async function GET(_req: Request, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    try {
        const data = await getAssignmentsInClass(classId, session.user.id);
        return Response.json({ data, error: null });
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message === "Forbidden") return Response.json({ error: "Forbidden." }, { status: 403 });
            if (err.message === "Not found") return Response.json({ error: "Class not found." }, { status: 404 });
        }
        return Response.json({ error: "Internal server error." }, { status: 500 });
    }
}