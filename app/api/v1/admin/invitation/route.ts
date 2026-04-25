import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { createLecturer } from "@/services/admin/server";

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