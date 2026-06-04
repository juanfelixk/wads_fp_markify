import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { enrollStudent } from "@/services/classes/server";
import { hash } from "bcryptjs";

export const auth = betterAuth({
  basePath: "/api/v1/auth",
  trustedOrigins: ["https://e2526-wads-b4bc-03.csbihub.id"],
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
      institution: {
        type: "string",
        required: false,
        input: false,
      },
      securityQuestion1: {
        type: "string",
        required: false,
        input: true,
      },
      securityAnswer1: {
        type: "string",
        required: false,
        input: true,
      },
      securityQuestion2: {
        type: "string",
        required: false,
        input: true,
      },
      securityAnswer2: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          const body = ctx?.body as Record<string, string> | undefined;
          const { courseCode, classCode, academicYear, enrollmentKey, securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2 } = body ?? {};

          // skip for social providers (google)
          if (!courseCode && !classCode && !academicYear && !enrollmentKey) return;

          try {
            await enrollStudent(user.id, courseCode!, classCode!, academicYear!, enrollmentKey!);

            // hash and save security questions
            if (securityQuestion1 && securityAnswer1 && securityQuestion2 && securityAnswer2) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  securityQuestion1,
                  securityAnswer1: await hash(securityAnswer1.trim().toLowerCase(), 10),
                  securityQuestion2,
                  securityAnswer2: await hash(securityAnswer2.trim().toLowerCase(), 10),
                },
              });
            }
          } catch (err) {
              await prisma.user.delete({ where: { id: user.id } });
            throw err;
          }
        },
      },
    },
  },
});