import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./config";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
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