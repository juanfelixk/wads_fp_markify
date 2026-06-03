import { NextRequest, NextResponse } from "next/server";
import { getUserSecurityQuestions } from "@/services/auth/server";

/**
 * @swagger
 * /api/v1/auth/reset-password/questions:
 *   post:
 *     summary: Get user security questions
 *     description: Retrieve the security questions associated with a user's email for password reset verification.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Successfully retrieved security questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example:
 *                 - "What is your mother's maiden name?"
 *                 - "What was the name of your first pet?"
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
 */

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

        const questions = await getUserSecurityQuestions(email);
        return NextResponse.json(questions);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}