import "server-only";
import { prisma } from "@/lib/prisma";

export async function getEnrolledCourses(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId },
        include: {
        course: {
            include: {
            lecturer: { select: { name: true } },
            _count: { select: { enrollments: true } },
            },
        },
        },
        orderBy: { createdAt: "asc" },
    });

    return enrollments.map((e) => ({
        id: e.course.code,
        courseId: e.course.id,
        name: e.course.name,
        institution: e.course.institution,
        lecturer: e.course.lecturer.name ?? "Unknown",
        students: e.course._count.enrollments,
    }));
}

export async function unenrollStudent(studentId: string, courseId: string) {
    await prisma.enrollment.delete({
        where: {
        studentId_courseId: { studentId, courseId },
        },
    });
}