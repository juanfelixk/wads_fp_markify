import { getSession } from "@/modules/auth/server";
import { unenrollStudent } from "@/modules/courses/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;
    const session = await getSession();
    if (!session) {
        return Response.json({ data: null, error: "Unauthorized", status: 401 }, { status: 401 });
    }

    await unenrollStudent(session.user.id, courseId);
    return Response.json({ data: null, error: null, status: 200 }, { status: 200 });
}