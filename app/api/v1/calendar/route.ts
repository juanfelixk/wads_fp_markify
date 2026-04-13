import { getSession } from "@/services/auth/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollments = await prisma.enrollment.findMany({
        where: { studentId: session.user.id },
        include: {
            class: {
                include: {
                    course: true,
                    assignments: {
                        include: {
                            submissions: {
                                where: { studentId: session.user.id },
                                select: { status: true },
                            },
                        },
                    },
                },
            },
        },
    });

    const assignments = enrollments.flatMap((e) =>
        e.class.assignments.map((a) => ({
            id: a.id,
            title: a.title,
            classId: e.class.id,
            classCode: e.class.code,
            courseCode: e.class.course.code,
            courseName: e.class.course.name,
            startDate: a.startDate.toISOString(),
            endDate: a.endDate.toISOString(),
            status: a.submissions[0]?.status ?? "NOT_SUBMITTED",
        }))
    );

    return Response.json({ data: assignments, error: null });
}