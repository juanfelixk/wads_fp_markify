import { getSession } from "@/services/auth/server";
import { getEnrolledClasses, enrollStudent } from "@/services/classes/server";

/**
 * @swagger
 * /api/v1/student/class:
 *   get:
 *     summary: Get enrolled classes
 *     description: Retrieve all classes the authenticated student is enrolled in.
 *     tags:
 *       - Student
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved enrolled classes
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
 *                       classId: class123
 *                       courseCode: CS101
 *                       classCode: A
 *                       academicYear: 2025/2026
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
 *
 *   post:
 *     summary: Enroll student into class
 *     description: Enroll the authenticated student into a class using enrollment details and enrollment key.
 *     tags:
 *       - Student
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseCode
 *               - classCode
 *               - academicYear
 *               - enrollmentKey
 *             properties:
 *               courseCode:
 *                 type: string
 *                 example: CS101
 *               classCode:
 *                 type: string
 *                 example: A
 *               academicYear:
 *                 type: string
 *                 example: 2025/2026
 *               enrollmentKey:
 *                 type: string
 *                 example: ABC12345
 *     responses:
 *       201:
 *         description: Successfully enrolled into class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   example:
 *                     enrollmentId: enroll123
 *                     classId: class123
 *       400:
 *         description: Enrollment failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Enrollment failed
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
        return Response.json({ data: null, error: "Unauthorized", status: 401 }, { status: 401 });
    }

    const courses = await getEnrolledClasses(session.user.id);
    return Response.json({ data: courses, error: null, status: 200 }, { status: 200 });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = await enrollStudent(session.user.id, body.courseCode, body.classCode, body.academicYear, body.enrollmentKey);
        return Response.json({ data: result }, { status: 201 });
    } catch (err: any) {
        return Response.json({ error: err.message || "Enrollment failed" }, { status: 400 });
    }
}