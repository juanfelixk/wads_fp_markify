import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getEnrolledClasses } from "@/services/classes/server";

/**
 * @swagger
 * /api/v1/admin/student/[studentId]/enrollment:
 *   get:
 *     summary: Get enrolled classes for a student
 *     description: Retrieve all classes a student is enrolled in. Only accessible by the admin.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student
 *         example: std123abc456
 *     responses:
 *       200:
 *         description: Successfully retrieved enrolled classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 example:
 *                   id: class123
 *                   name: Database Systems
 *                   code: CS205
 *       400:
 *         description: Failed request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Something went wrong.
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized.
 */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    
    try {
        const { studentId } = await params;
        const enrollments = await getEnrolledClasses(studentId);
        return NextResponse.json(enrollments);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
    }
}