import { getSession } from "@/modules/auth/server";
import { getEnrolledClasses } from "@/modules/classes/server";
import { prisma } from "@/lib/prisma";

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

    // check empty fields
    const { courseCode, classCode, academicYear, enrollmentKey } = await req.json();
    if (!courseCode?.trim() || !classCode?.trim() || !academicYear?.trim() || !enrollmentKey?.trim()) {
        return Response.json({ error: "All fields are required." }, { status: 400 });
    }

    // check course
    const course = await prisma.course.findUnique({
        where: { code: courseCode.trim().toUpperCase() },
    });
    if (!course) {
        return Response.json({ error: "Course not found." }, { status: 404 });
    }

    // check credentials
    const cls = await prisma.class.findUnique({
        where: {
            courseId_code_academicYear: {
                courseId: course.id,
                code: classCode.trim().toUpperCase(),
                academicYear: academicYear.trim(),
            },
        },
    });
    if (!cls) {
        return Response.json({ error: "Class not found." }, { status: 404 });
    }
    if (cls.enrollmentKey !== enrollmentKey.trim().toLowerCase()) {
        return Response.json({ error: "Invalid enrollment key." }, { status: 403 });
    }

    // check institution
    const existing = await prisma.enrollment.findFirst({
        where: { studentId: session.user.id },
        include: { class: { include: { course: { select: { institution: true } } } } },
    });
    if (existing && existing.class.course.institution !== course.institution) {
        return Response.json({
            error: "This class belongs to a different institution. Please enroll with a new account for that institution.",
        }, { status: 403 });
    }

    // check already enrolled
    const alreadyEnrolled = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId: session.user.id, classId: cls.id } },
    });
    if (alreadyEnrolled) {
        return Response.json({ error: "You are already enrolled in this class." }, { status: 409 });
    }

    await prisma.enrollment.create({
        data: { studentId: session.user.id, classId: cls.id },
    });
    return Response.json({ data: { classId: cls.id }, error: null }, { status: 201 });
}