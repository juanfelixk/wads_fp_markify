import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { deleteClass, getLecturerClassPageData } from "@/services/classes/server";
 
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;
    const deleted = await deleteClass(classId, session.user.id);

    if (!deleted) {
        return NextResponse.json(
            { error: "Class not found or you do not own it" },
            { status: 404 }
        );
    }
 
    return new NextResponse(null, { status: 204 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const { classId } = await params;
    const data = await getLecturerClassPageData(classId, session.user.id);
 
    if (!data) {
        return NextResponse.json(
            { error: "Class not found or you do not have access." },
            { status: 404 }
        );
    }
 
    return NextResponse.json({ data });
}