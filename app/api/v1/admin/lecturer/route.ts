import { NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getAllLecturers } from "@/services/admin/server";

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