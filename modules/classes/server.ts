import "server-only";
import { prisma } from "@/lib/prisma";

export async function getEnrolledClasses(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId },
        include: {
            class: {
                include: {
                    course: true,
                    lecturer: { select: { name: true } },
                    _count: { select: { enrollments: true } },
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    return enrollments.map((e) => ({
        classId: e.class.id,
        courseCode: e.class.course.code,
        classCode: e.class.code,
        courseName: e.class.course.name,
        institution: e.class.course.institution,
        academicYear: e.class.academicYear,
        lecturer: e.class.lecturer.name ?? "Unknown",
        students: e.class._count.enrollments,
    }));
}

export async function unenrollStudent(studentId: string, classId: string) {
    await prisma.enrollment.delete({
        where: {
            studentId_classId: { studentId, classId },
        },
    });
}