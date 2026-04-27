import { prisma } from "@/lib/prisma";
import { auth } from "@/services/auth/config";

export async function createLecturer(adminId: string, email: string, name: string) {
    const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { institution: true },
    });
    if (!admin) throw new Error("Admin not found.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("A user with this email already exists.");

    const defaultPassword = `${admin?.institution?.trim().toLowerCase().replace(/\s+/g, "-")}@123`;
    // "BINUS University International" -> "binus-university-international@123"

    await auth.api.signUpEmail({
        body: { email, name, password: defaultPassword }, // default password for new lecturer
    });

    await prisma.user.update({
        where: { email },
        data: { role: "LECTURER", institution: admin.institution, emailVerified: true },
    });
}

export async function getAllLecturers(adminId: string) {
    const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { institution: true },
    });
    if (!admin) throw new Error("Admin not found.");

    return prisma.user.findMany({
        where: { role: "LECTURER", institution: admin.institution },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
}

export async function getAllStudents(adminId: string) {
    const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { institution: true },
    });
    if (!admin) throw new Error("Admin not found.");

    return prisma.user.findMany({
        where: { role: "STUDENT", institution: admin.institution },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
}

export async function registerCourse(data: {
    code: string;
    name: string;
    institution: string;
}) {
    const existing = await prisma.course.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Course code "${data.code}" is already registered.`);
 
    return prisma.course.create({ data });
}

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
 
export async function getCourseClasses(courseId: string, institution: string) {
    return prisma.class.findMany({
        where: { courseId, course: { institution } },
        select: {
            id: true,
            code: true,
            academicYear: true,
            lecturer: { select: { name: true, email: true } },
            _count: { select: { enrollments: true } },
        },
        orderBy: { academicYear: "desc" },
    });
}
 
export async function updateCourse(courseId: string, institution: string, data: { code: string; name: string }) {
    const course = await prisma.course.findFirst({
        where: { id: courseId, institution },
        select: { id: true },
    });
    if (!course) return null;
 
    // check new course code is unique
    if (data.code) {
        const conflict = await prisma.course.findFirst({
            where: { code: data.code, NOT: { id: courseId } },
            select: { id: true },
        });
        if (conflict) throw new Error(`Course code "${data.code}" is already in use.`);
    }
 
    return prisma.course.update({
        where: { id: courseId },
        data: { code: data.code.trim().toUpperCase(), name: data.name.trim() },
    });
}