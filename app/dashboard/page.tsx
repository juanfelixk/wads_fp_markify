import { redirect } from "next/navigation";
import { getSession } from "@/services/auth/server";
 
export default async function DashboardPage() {
    const session = await getSession();
    if (!session) redirect("/auth/login");
    if (session.user.role.toUpperCase() === "STUDENT") redirect("/dashboard/student");
    if (session.user.role.toUpperCase() === "LECTURER") redirect("/dashboard/lecturer");
    if (session.user.role.toUpperCase() === "ADMIN") redirect("/dashboard/admin");
}