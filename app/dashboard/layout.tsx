import Navbar from "@/components/navbar";
import Footer from "@/components/footer"
import { getSession } from "@/modules/auth/server";
 
export default async function DashboardLayout({children,}: {children: React.ReactNode;}) {
    const session = await getSession();
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar userName={session?.user?.name ?? "User"} />
            <main className="flex-1 bg-muted-foreground/12">{children}</main>
            <Footer />
        </div>
    );
}