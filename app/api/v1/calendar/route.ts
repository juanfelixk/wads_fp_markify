import { getSession } from "@/services/auth/server";
import { getCalendarAssignments } from "@/services/assignments/server";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignments = await getCalendarAssignments(session.user.id);
    return Response.json({ data: assignments, error: null });
}