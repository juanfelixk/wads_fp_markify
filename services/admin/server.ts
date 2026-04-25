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