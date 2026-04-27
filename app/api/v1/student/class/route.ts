import { getSession } from "@/services/auth/server";
import { getEnrolledClasses, enrollStudent } from "@/services/classes/server";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ data: null, error: "Unauthorized", status: 401 }, { status: 401 });
    }

    const courses = await getEnrolledClasses(session.user.id);
    return Response.json({ data: courses, error: null, status: 200 }, { status: 200 });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = await enrollStudent(session.user.id, body.courseCode, body.classCode, body.academicYear, body.enrollmentKey);
        return Response.json({ data: result }, { status: 201 });
    } catch (err: any) {
        return Response.json({ error: err.message || "Enrollment failed" }, { status: 400 });
    }
}