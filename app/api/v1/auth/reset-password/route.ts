import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithSecurityAnswers } from "@/services/auth/server";

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