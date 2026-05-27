import { NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getAllLecturers } from "@/services/admin/server";

/**
 * @swagger
 * /api/v1/admin/lecturer:
 *   get:
 *     summary: Get all lecturers
 *     description: Retrieve a list of all lecturers. Only accessible by the admin.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved lecturers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 example:
 *                   id: lec123
 *                   name: John Doe
 *                   email: john.doe@example.com
 *                   role: LECTURER
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
        const lecturers = await getAllLecturers(session.user.id);
        return NextResponse.json(lecturers);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
    }
}