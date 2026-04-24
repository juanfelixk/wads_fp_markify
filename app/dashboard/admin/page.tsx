"use client";

import { authClient } from "@/services/auth/client";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
    const { data: session } = authClient.useSession();
    const userName = session?.user?.name ?? "Student";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Institution
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    institution
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Welcome back, <span className="font-medium text-foreground">{userName}</span>.
                </p>
            </motion.div>
        </div>
    )
}