import { getSession } from "@/services/auth/server";
import { getAssignmentsInClass } from "@/services/assignments/server";

export async function GET(_req: Request, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    try {
        const data = await getAssignmentsInClass(classId, session.user.id);
        return Response.json({ data, error: null });
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message === "Forbidden") return Response.json({ error: "Forbidden." }, { status: 403 });
            if (err.message === "Not found") return Response.json({ error: "Class not found." }, { status: 404 });
        }
        return Response.json({ error: "Internal server error." }, { status: 500 });
    }
}