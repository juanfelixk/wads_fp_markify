import { NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getAllStudents } from "@/services/admin/server";

/**
 * @swagger
 * /api/v1/admin/student:
 *   get:
 *     summary: Get all students
 *     description: Retrieve a list of all students. Only accessible by the admin.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 example:
 *                   id: std123
 *                   name: Jane Smith
 *                   email: jane.smith@example.com
 *                   role: STUDENT
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

export async function GET() {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    
    try {
        const students = await getAllStudents(session.user.id);
        return NextResponse.json(students);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
    }
}