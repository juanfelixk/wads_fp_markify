import { redirect } from "next/navigation";
import { getSession } from "@/modules/auth/server";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <>{children}</>;
}