import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithSecurityAnswers } from "@/services/auth/server";

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset a user's password using security question answers.
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
 *               - answer1
 *               - answer2
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               answer1:
 *                 type: string
 *                 example: Fluffy
 *               answer2:
 *                 type: string
 *                 example: Jakarta
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123
 *                 minLength: 12
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   examples:
 *                     missingFields:
 *                       value: All fields are required.
 *                     weakPassword:
 *                       value: Password must be at least 12 characters.
 *                     missingNumber:
 *                       value: Password must include at least one number.
 *                     missingLowercase:
 *                       value: Password must include at least one lowercase letter.
 *                     missingUppercase:
 *                       value: Password must include at least one uppercase letter.
 */

export async function POST(req: NextRequest) {
    try {
        const { email, answer1, answer2, newPassword } = await req.json();

        if (!email || !answer1 || !answer2 || !newPassword)
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });

        if (newPassword.length < 12)
            return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
        if (!/[0-9]/.test(newPassword))
            return NextResponse.json({ error: "Password must include at least one number." }, { status: 400 });
        if (!/[a-z]/.test(newPassword))
            return NextResponse.json({ error: "Password must include at least one lowercase letter." }, { status: 400 });
        if (!/[A-Z]/.test(newPassword))
            return NextResponse.json({ error: "Password must include at least one uppercase letter." }, { status: 400 });

        await resetPasswordWithSecurityAnswers(email, answer1, answer2, newPassword);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}