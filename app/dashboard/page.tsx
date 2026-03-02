import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
import LogoutButton from "@/components/logout-button";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
        redirect("/login");
    }

    let decodedToken;

    try {
        decodedToken = await adminAuth.verifyIdToken(session, true);
    } catch {
        redirect("/login");
    }

    return (
        <div>
            <LogoutButton />
            <ul>
                <li>{decodedToken.email}</li>
                <li>{decodedToken.uid}</li>
                <li>{decodedToken.email_verified? "Yes" : "No"}</li>
            </ul>
        </div>
    )
}