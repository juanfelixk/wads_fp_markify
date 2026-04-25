import { NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getAllStudents } from "@/services/admin/server";

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