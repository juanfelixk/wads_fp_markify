import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./config";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
});

export async function loginWithGoogle() {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });
}

export async function loginWithEmail(email: string, password: string) {
  const result = await authClient.signIn.email({
    email,
    password,
    callbackURL: "/dashboard",
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function fetchSecurityQuestions(email: string) {
  console.log("Origin:", window.location.origin);
  const res = await fetch("/api/v1/auth/reset-password/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch questions.");
  return data as { question1: string; question2: string };
}

export async function submitResetPassword( email: string, answer1: string, answer2: string, newPassword: string) {
  const res = await fetch("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, answer1, answer2, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to reset password.");
}