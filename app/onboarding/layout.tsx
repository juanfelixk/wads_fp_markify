import { getSession } from "@/modules/auth/server";
import { getEnrolledCourses } from "@/modules/classes/server";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session) {
        redirect("/auth/login");
    }

    const enrollments = await getEnrolledCourses(session.user.id);
    if (enrollments.length > 0) {
        redirect("/dashboard/student");
    }

    return <>{children}</>;
}