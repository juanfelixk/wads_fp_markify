import { prisma } from "@/lib/prisma";

export async function getCourses(institution: string) {
    return prisma.course.findMany({
        where: { institution },
        select: {
            id: true,
            code: true,
            name: true,
            institution: true,
            createdAt: true,
            _count: { select: { classes: true } },
        },
        orderBy: { name: "asc" },
    });
}

export async function createClass({ courseId, code, academicYear, enrollmentKey, lecturerId, institution }: {
    courseId: string;
    code: string;
    academicYear: string;
    enrollmentKey: string;
    lecturerId: string;
    institution: string;
}) {
    const course = await prisma.course.findFirst({
        where: { id: courseId, institution },
    });

    if (!course) {
        throw new Error("Course not found or not in your institution.");
    }

    code = code.trim().toUpperCase();
    academicYear = academicYear.trim().toUpperCase();

    const existing = await prisma.class.findFirst({
        where: { courseId, code, academicYear },
    });

    if (existing) {
        throw new Error(`A class with code ${code} already exists for this course in AY ${academicYear}.`);
    }

    return prisma.class.create({
        data: { code, academicYear, enrollmentKey, courseId, lecturerId },
    });
}

// helper
function generateEnrollmentKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    for (let i = 0; i < 6; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

export async function generateUniqueEnrollmentKey(): Promise<string> {
    let key: string;
    let exists = true;
    // loop until a random unique key is generated
    do {
        key = generateEnrollmentKey();
        const existing = await prisma.class.findFirst({ where: { enrollmentKey: key } });
        exists = !!existing;
    } while (exists);
    return key;
}