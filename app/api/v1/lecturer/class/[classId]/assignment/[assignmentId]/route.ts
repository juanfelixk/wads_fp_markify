import { deleteAssignmentById, getAssignmentById, updateAssignmentById } from "@/services/assignments/server";
import { getSession } from "@/services/auth/server";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignmentId } = await params;

    try {
        await deleteAssignmentById(assignmentId);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId } = await params;
    try {
        const assignment = await getAssignmentById(assignmentId);
        if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(assignment);
    } catch {
        return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId } = await params;
    const body = await req.json();
    try {
        await updateAssignmentById(assignmentId, body);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
    }
}