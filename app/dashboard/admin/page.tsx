"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/services/auth/client";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, GraduationCap, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
    const { data: session } = authClient.useSession();
    const userName = session?.user?.name ?? "Student";
    const institution = session?.user?.institution ?? "Your Institution";
    const router = useRouter();

    const cards = [
        {
            key: "lecturers",
            title: "View all lecturers",
            description: `View all lecturers using Markify services in ${institution}.`,
            label: "View Lecturers",
            href: "/dashboard/admin/view-lecturers",
            Icon: GraduationCap,
        },
        {
            key: "students",
            title: "View all students",
            description: `View all students using Markify services in ${institution}.`,
            label: "View Students",
            href: "/dashboard/admin/view-students",
            Icon: UsersRound,
        },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Institution
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {institution}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Welcome back, <span className="font-medium text-foreground">{userName}</span>.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                    {cards.map((card, i) => (
                        <motion.div key={card.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
                            <Card className="group relative overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <CardContent className="space-y-2">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <card.Icon className="w-6 h-6 text-primary" /> {card.title}
                                    </h3>
                                    <div className="text-sm text-muted-foreground">
                                        {card.description}
                                    </div>
                                </CardContent>
                                <CardFooter className="gap-2 pt-3 border-t border-border">
                                    <Button variant="default" size="sm" className="flex-1 gap-1.5 cursor-pointer" onClick={() => router.push(card.href)}>
                                        <Eye className="w-3.5 h-3.5" /> {card.label}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}