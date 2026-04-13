import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  basePath: "/api/v1/auth",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          const body = ctx?.body as Record<string, string> | undefined;
          const courseCode = body?.courseCode?.trim().toUpperCase();
          const classCode = body?.classCode?.trim().toUpperCase();
          const academicYear = body?.academicYear?.trim();
          const enrollmentKey = body?.enrollmentKey?.trim().toLowerCase();

          // skip for social providers (google)
          if (!courseCode && !classCode && !academicYear && !enrollmentKey) return;

          // validate empty fields
          if (!courseCode || !classCode || !academicYear || !enrollmentKey) {
            await prisma.user.delete({ where: { id: user.id } });
            throw new Error("All enrollment fields are required.");
          }

          // find course
          const course = await prisma.course.findUnique({
            where: { code: courseCode },
          });
          if (!course) {
            await prisma.user.delete({ where: { id: user.id } });
            throw new Error("Course not found.");
          }

          // find class
          const cls = await prisma.class.findUnique({
            where: {
              courseId_code_academicYear: {
                courseId: course.id,
                code: classCode,
                academicYear,
              },
            },
          });
          if (!cls) {
            await prisma.user.delete({ where: { id: user.id } });
            throw new Error("Class not found.");
          }

          if (cls.enrollmentKey !== enrollmentKey) {
            await prisma.user.delete({ where: { id: user.id } });
            throw new Error("Invalid enrollment key.");
          }

          // enroll the user
          await prisma.enrollment.create({
            data: {
              studentId: user.id,
              classId: cls.id,
            },
          });
        },
      },
    },
  },
});