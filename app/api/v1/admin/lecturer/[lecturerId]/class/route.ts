import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getLecturerClasses } from "@/services/classes/server";

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