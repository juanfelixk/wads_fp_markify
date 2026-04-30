import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server"; 
import { getLecturerClasses } from "@/services/classes/server";
import { ClassSummary } from "@/services/classes/types";
import { createClass, generateUniqueEnrollmentKey } from "@/services/lecturer/server";

export async function GET() {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await getLecturerClasses(session.user.id);

    const classes: ClassSummary[] = raw.map((c) => ({
        classId: c.id,
        courseCode: c.course.code,
        classCode: c.code,
        courseName: c.course.name,
        institution: session.user.institution ?? "",
        academicYear: c.academicYear,
        lecturer: session.user.name ?? "",
        students: c._count.enrollments,
        enrollmentKey: c.enrollmentKey,
    }));

    return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, code, academicYear } = body;

    if (!courseId || !code || !academicYear) {
        return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!/^[A-Za-z0-9]+$/.test(code.trim())) {
        return NextResponse.json({ error: "Class code must be alphanumeric." }, { status: 400 });
    }

    try {
        const enrollmentKey = await generateUniqueEnrollmentKey();
        const newClass = await createClass({
            courseId,
            code: code.trim(),
            academicYear: academicYear.trim(),
            enrollmentKey,
            lecturerId: session.user.id,
            institution: session.user.institution ?? "Unknown",
        });
        return NextResponse.json(newClass, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create class.";
        return NextResponse.json({ error: message }, { status: 409 });
    }
}