import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { createLecturer } from "@/services/admin/server";

/**
 * @swagger
 * /api/v1/admin/invitation:
 *   post:
 *     summary: Create a new lecturer
 *     description: Allows an admin to create a lecturer account using email and name.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: lecturer@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Lecturer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation error or failed request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email is required.
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

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
        const { email, name } = await req.json();
        if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
        if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
        await createLecturer(session.user.id, email, name);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
    }
}