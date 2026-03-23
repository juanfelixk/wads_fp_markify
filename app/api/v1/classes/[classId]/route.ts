import { getSession } from "@/modules/auth/server";
import { unenrollStudent } from "@/modules/classes/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ classId: string }> }) {
    const { classId } = await params;
    const session = await getSession();
    if (!session) {
        return Response.json({ data: null, error: "Unauthorized", status: 401 }, { status: 401 });
    }

    await unenrollStudent(session.user.id, classId);
    return Response.json({ data: null, error: null, status: 200 }, { status: 200 });
}