import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { createClassAssignment } from "@/services/assignments/server";

// create new assignment
export async function POST(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    let body: {
        title?: string;
        instructions?: string;
        maxPoints?: number;
        lateAllowed?: boolean;
        startDate?: string;
        endDate?: string;
        rubric?: { name: string; description: string; maxPoints: number; weight: number }[];
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { title, instructions, maxPoints, lateAllowed, startDate, endDate, rubric } = body;

    if (!title || !startDate || !endDate) {
        return NextResponse.json(
            { error: "title, startDate, and endDate are required." },
            { status: 400 }
        );
    }

    let data;
    try {
        data = await createClassAssignment(classId, session.user.id, {
            title,
            instructions,
            maxPoints,
            lateAllowed,
            startDate,
            endDate,
            rubric,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create assignment.";
        return NextResponse.json({ error: message }, { status: 422 });
    }

    if (!data) {
        return NextResponse.json({ error: "Class not found or you do not have access." }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 201 });
}