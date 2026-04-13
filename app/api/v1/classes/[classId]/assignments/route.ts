import { getSession } from "@/services/auth/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    // verify valid student enrollment
    const enrollment = await prisma.enrollment.findUnique({
        where: {
        studentId_classId: {
            studentId: session.user.id,
            classId,
        },
        },
    });
    if (!enrollment) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const cls = await prisma.class.findUnique({
        where: { id: classId },
        include: {
        course: true,
        lecturer: { select: { name: true } },
        assignments: {
            orderBy: { endDate: "asc" },
            include: {
            submissions: {
                where: { studentId: session.user.id },
                select: { status: true },
            },
            },
        },
        },
    });

    if (!cls) {
        return Response.json({ error: "Class not found." }, { status: 404 });
    }

    const data = {
        classId: cls.id,
        classCode: cls.code,
        academicYear: cls.academicYear,
        courseName: cls.course.name,
        courseCode: cls.course.code,
        lecturerName: cls.lecturer.name ?? "Unknown",
        institution: cls.course.institution,
        assignments: cls.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        maxPoints: a.maxPoints,
        startDate: a.startDate.toISOString(),
        endDate: a.endDate.toISOString(),
        status: a.submissions[0]?.status ?? "NOT_SUBMITTED",
        })),
    };

    return Response.json({ data, error: null });
}