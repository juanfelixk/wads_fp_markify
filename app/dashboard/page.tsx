import { redirect } from "next/navigation";
import { getSession } from "@/modules/auth/server";
import LogoutButton from "@/components/logout-button";

export default async function DashboardPage() {
    const session = await getSession();

    if (!session) {
        redirect("/auth/login");
    }

    return (
        <div>
            <h1>Welcome {session.user.name}!</h1>
            <ul>
                <li>Email: {session.user.email}</li>
                <li>User ID: {session.user.id}</li>
                <li>Email Verified: {session.user.emailVerified ? "Yes" : "No"}</li>
            </ul>
            <LogoutButton />
        </div>
    );
}