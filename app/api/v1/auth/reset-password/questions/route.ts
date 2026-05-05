import { NextRequest, NextResponse } from "next/server";
import { getUserSecurityQuestions } from "@/services/auth/server";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

        const questions = await getUserSecurityQuestions(email);
        return NextResponse.json(questions);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}