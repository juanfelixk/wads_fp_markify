import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getEnrolledClasses } from "@/services/classes/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    
    try {
        const { studentId } = await params;
        const enrollments = await getEnrolledClasses(studentId);
        return NextResponse.json(enrollments);
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
    }
}