import { getSession } from "@/services/auth/server";
import { getCalendarAssignments } from "@/services/assignments/server";

/**
 * @swagger
 * /api/v1/student/calendar:
 *   get:
 *     summary: Get student calendar assignments
 *     description: Retrieve all assignment events for the authenticated student's calendar.
 *     tags:
 *       - Student
 *       - Assignment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved calendar assignments
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
 *                       id: assignment123
 *                       title: Midterm Project
 *                       dueDate: "2026-06-10T23:59:00.000Z"
 *                       className: Software Engineering
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
 */

export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignments = await getCalendarAssignments(session.user.id);
    return Response.json({ data: assignments, error: null });
}