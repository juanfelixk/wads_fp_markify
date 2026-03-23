"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, PlusCircle, Calendar, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";
import { authClient } from "@/modules/auth/client";
import { toast } from "sonner";

export default function Navbar({ userName }: { userName: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        await authClient.signOut();
        router.push("/auth/login");
        toast.success("Successfully logged out.");
    };

    const navItems = [
        { label: "Home", icon: Home, href: "/dashboard/student" },
        { label: "Enroll", icon: PlusCircle, href: "/dashboard/student/enroll" },
        { label: "Calendar", icon: Calendar, href: "/dashboard/student/calendar" },
    ];

    return (
        <header className="sticky top-0 z-20 h-17 border-b border-foreground/25 bg-background">
            <div className="grid grid-cols-2 md:grid-cols-3 items-center h-full px-6 py-3">
                <button className="flex flex-col cursor-pointer" onClick={() => router.push("/dashboard/student")}>
                    <Image src="/logo-full.png" alt="Markify Logo" height={0} width={150} />
                </button>

                <div className="hidden md:flex items-center justify-center gap-2">
                    {navItems.map(({ label, icon: Icon, href }) => (
                        <Button key={href} variant="ghost" size="lg" className={cn("gap-2 cursor-pointer", pathname === href ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-foreground/10 text-muted-foreground")} onClick={() => router.push(href)}>
                            <Icon className="w-4 h-4" />
                            {label}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center justify-end">
                    {/* DESKTOP */}
                    <div className="hidden md:flex items-center">
                        <button className="cursor-pointer rounded-full overflow-hidden w-8 h-8 hover:opacity-80 transition-opacity mr-3.5" onClick={() => router.push("/dashboard/profile")}>
                            <Image src={getAvatarUrl(userName)} alt="Profile" width={32} height={32} className="rounded-full" />
                        </button>
                        <div className="w-px h-5 bg-foreground/20" />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground cursor-pointer hover:bg-foreground/8 ml-1">
                                <LogOut className="w-4 h-4" />
                                Logout
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader className="select-none">
                                    <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
                                    <AlertDialogDescription className="my-2">Are you sure you want to logout?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout} disabled={loading} className="cursor-pointer">
                                        {loading ? "Logging out..." : "Logout"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    {/* MOBILE */}
                    <div className="flex md:hidden items-center gap-2">
                        <button className="cursor-pointer rounded-full overflow-hidden w-8 h-8 hover:opacity-80 transition-opacity" onClick={() => router.push("/dashboard/profile")}>
                            <Image src={getAvatarUrl(userName)} alt="Profile" width={32} height={32} className="rounded-full" />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="cursor-pointer hover:bg-foreground/10">
                                <Menu className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 z-50">
                                {navItems.map(({ label, icon: Icon, href }) => (
                                <DropdownMenuItem key={href} className={cn("gap-2 cursor-pointer", pathname === href && "bg-primary/10 text-primary")} onClick={() => router.push(href)}>
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-[60vw] sm:max-w-sm">
                                        <AlertDialogHeader className="select-none">
                                            <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
                                            <AlertDialogDescription className="my-2">Are you sure you want to logout?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleLogout} disabled={loading} className="cursor-pointer">
                                                {loading ? "Logging out..." : "Logout"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}