import { NextResponse } from "next/server";
import { getSession } from "@/services/auth/server"; 
import { getLecturerClasses } from "@/services/classes/server";
import { ClassSummary } from "@/services/classes/types";

export async function GET() {
    const session = await getSession();
    if (!session) {
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
    }));

    return NextResponse.json(classes);
}