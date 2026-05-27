import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getLecturerClasses } from "@/services/classes/server";

/**
 * @swagger
 * /api/v1/admin/lecturer/[lecturerId]/class:
 *   get:
 *     summary: Get lecturer classes
 *     description: Retrieve all classes assigned to a lecturer. Only accessible by the admin.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecturerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the lecturer
 *         example: clx123abc456
 *     responses:
 *       200:
 *         description: Successfully retrieved lecturer classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 example:
 *                   id: class123
 *                   name: Web Development
 *                   code: CS101
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ lecturerId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    
    try {
        const { lecturerId } = await params;
        const classes = await getLecturerClasses(lecturerId);
        return NextResponse.json(classes);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
    }
}