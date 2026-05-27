import { getSession } from "@/services/auth/server";
import { unenrollStudent } from "@/services/classes/server";

/**
 * @swagger
 * /api/v1/student/class/{classId}:
 *   delete:
 *     summary: Unenroll from class
 *     description: Allow an authenticated student to unenroll from a class.
 *     tags:
 *       - Student
 *       - Class
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
 *         description: Successfully unenrolled from class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   nullable: true
 *                   example: null
 *                 error:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 status:
 *                   type: number
 *                   example: 200
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   nullable: true
 *                   example: null
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *                 status:
 *                   type: number
 *                   example: 401
 */

export async function DELETE(_req: Request, { params }: { params: Promise<{ classId: string }> }) {
    const { classId } = await params;
    const session = await getSession();
    if (!session) {
        return Response.json({ data: null, error: "Unauthorized", status: 401 }, { status: 401 });
    }

    await unenrollStudent(session.user.id, classId);
    return Response.json({ data: null, error: null, status: 200 }, { status: 200 });
}