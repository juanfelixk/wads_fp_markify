import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { enrollStudent } from "@/services/classes/server";

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
          const { courseCode, classCode, academicYear, enrollmentKey } = body ?? {};

          // skip for social providers (google)
          if (!courseCode && !classCode && !academicYear && !enrollmentKey) return;

          try {
            await enrollStudent(user.id, courseCode!, classCode!, academicYear!, enrollmentKey!);
          } catch (err) {
            await prisma.user.delete({ where: { id: user.id } });
            throw err;
          }
        },
      },
    },
  },
});