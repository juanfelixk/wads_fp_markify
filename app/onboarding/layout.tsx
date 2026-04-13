import { getSession } from "@/services/auth/server";
import { getEnrolledClasses } from "@/services/classes/server";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session) {
        redirect("/auth/login");
    }

    const enrollments = await getEnrolledClasses(session.user.id);
    if (enrollments.length > 0) {
        redirect("/dashboard/student");
    }

    return <>{children}</>;
}