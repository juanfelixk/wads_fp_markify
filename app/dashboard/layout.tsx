import Navbar from "@/components/dashboard/navbar";
import Footer from "@/components/dashboard/footer";
import { getSession } from "@/services/auth/server";
import { getEnrolledClasses } from "@/services/classes/server";
import { redirect } from "next/navigation";
 
export default async function DashboardLayout({children,}: {children: React.ReactNode;}) {
    const session = await getSession();
    if (!session) {
        redirect("/auth/login");
    }
    
    if (session.user.role === "STUDENT") {
        // skip enrollment check for onboarding page to avoid redirect loop
        const isOnboarding = false; // handled below via separate layout
        const enrollments = await getEnrolledClasses(session.user.id);
        if (enrollments.length === 0) {
            redirect("/onboarding");
        }
    }
    
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar userName={session?.user?.name ?? "User"} />
            <main className="flex-1 bg-muted-foreground/12">{children}</main>
            <Footer />
        </div>
    );
}