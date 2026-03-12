import "server-only";
import { auth } from "@/modules/auth/config";
import { headers } from "next/headers";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session; // { user, session } or null
}