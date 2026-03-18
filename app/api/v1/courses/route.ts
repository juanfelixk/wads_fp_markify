import { getSession } from "@/modules/auth/server";
import { getEnrolledCourses } from "@/modules/courses/server";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ data: null, error: "Unauthorized", status: 401 }, { status: 401 });
    }

    const courses = await getEnrolledCourses(session.user.id);
    return Response.json({ data: courses, error: null, status: 200 }, { status: 200 });
}