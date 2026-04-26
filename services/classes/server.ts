import "server-only";
import { prisma } from "@/lib/prisma";

// student-side
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

// student-side
export async function unenrollStudent(studentId: string, classId: string) {
    await prisma.enrollment.delete({
        where: {
            studentId_classId: { studentId, classId },
        },
    });
}

// student-side
export async function enrollStudent(studentId: string, courseCode: string, classCode: string, academicYear: string, enrollmentKey: string) {
    const normalizedCourseCode = courseCode.trim().toUpperCase();
    const normalizedClassCode = classCode.trim().toUpperCase();
    const normalizedYear = academicYear.trim();
    const normalizedKey = enrollmentKey.trim().toLowerCase();

    // check empty fields
    if (!normalizedCourseCode || !normalizedClassCode || !normalizedYear || !normalizedKey) {
        throw new Error("All fields are required.");
    }

    // check course
    const course = await prisma.course.findUnique({
        where: { code: normalizedCourseCode },
    });
    if (!course) {
        throw new Error("Course not found.");
    }

    // check credentials
    const cls = await prisma.class.findUnique({
        where: {
            courseId_code_academicYear: {
                courseId: course.id,
                code: normalizedClassCode,
                academicYear: normalizedYear,
            },
        },
    });
    if (!cls) {
        throw new Error("Class not found.");
    }
    if (cls.enrollmentKey !== normalizedKey) {
        throw new Error("Invalid enrollment key.");
    }

    // check institution via user.institution (only for non first time)
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { institution: true },
    });
    if (student?.institution && student.institution !== course.institution) {
        throw new Error("This class belongs to a different institution. Please enroll with a new account for that institution.");
    }

    // check already enrolled
    const alreadyEnrolled = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId, classId: cls.id } },
    });
    if (alreadyEnrolled) {
        throw new Error("You are already enrolled in this class.");
    }

    // create enrollment and set institution on first enroll
    await prisma.$transaction([
        prisma.enrollment.create({
            data: { studentId, classId: cls.id },
        }),
        ...(!student?.institution ? [
            prisma.user.update({
                where: { id: studentId },
                data: { institution: course.institution },
            }),
        ] : []),
    ]);

    return { classId: cls.id };
}

// lecturer-side
export async function getLecturerClasses(lecturerId: string) {
    return prisma.class.findMany({
        where: { lecturerId },
        select: {
            id: true,
            code: true,
            academicYear: true,
            course: { select: { code: true, name: true } },
            _count: { select: { enrollments: true } },
        },
        orderBy: { course: { name: "asc" } },
    });
}

// lecturer-side
export async function deleteClass(classId: string, lecturerId: string) {
    // verify ownership before deleting
    const cls = await prisma.class.findFirst({
        where: { id: classId, lecturerId },
        select: { id: true },
    });
 
    if (!cls) return null;
 
    return prisma.class.delete({ where: { id: classId } });
}