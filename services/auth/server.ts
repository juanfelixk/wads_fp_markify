import "server-only";
import { auth } from "@/services/auth/config";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { hashPassword } from "better-auth/crypto";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getUserSecurityQuestions(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
        securityQuestion1: true,
        securityQuestion2: true,
    },
  });

  if (!user) throw new Error("No account found with that email.");
  if (!user.securityQuestion1 || !user.securityQuestion2)
    throw new Error("This account does not have security questions set up.");

  return {
    question1: user.securityQuestion1,
    question2: user.securityQuestion2,
  };
}

export async function resetPasswordWithSecurityAnswers(email: string, answer1: string, answer2: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
        id: true,
        securityAnswer1: true,
        securityAnswer2: true,
        accounts: {
            where: { providerId: "credential" },
            select: { id: true },
        },
    },
  });

  if (!user) throw new Error("No account found with that email.");
  if (!user.securityAnswer1 || !user.securityAnswer2)
    throw new Error("This account does not have security questions set up.");

  const [match1, match2] = await Promise.all([
    compare(answer1.trim().toLowerCase(), user.securityAnswer1),
    compare(answer2.trim().toLowerCase(), user.securityAnswer2),
  ]);

  if (!match1 || !match2) throw new Error("One or more answers are incorrect.");

  const hashed = await hashPassword(newPassword);

  await prisma.account.updateMany({
    where: { userId: user.id, providerId: "credential" },
    data: { password: hashed },
  });
}