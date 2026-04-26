import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { deleteClass } from "@/services/classes/server";
 
export async function DELETE(_req: NextRequest, { params }: { params: { classId: string } }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteClass(params.classId, session.user.id);

    if (!deleted) {
        return NextResponse.json(
            { error: "Class not found or you do not own it" },
            { status: 404 }
        );
    }
 
    return new NextResponse(null, { status: 204 });
}