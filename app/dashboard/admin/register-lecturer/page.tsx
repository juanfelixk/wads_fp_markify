"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLecturerClient } from "@/services/admin/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/services/auth/client";
import { motion } from "framer-motion";

export default function RegisterLecturerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    
    const { data: session } = authClient.useSession();
    const defaultPassword = `${session?.user?.institution?.trim().toLowerCase().replace(/\s+/g, "-")}@123`;

    const validate = (): string | null => {
        if (!email.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
        if (!name.trim()) return "Name is required.";
        return null;
    }

    const handleSubmit = async () => {
        const error = validate();
        if (error) { toast.error(error); return; }
        try {
            setLoading(true);
            await createLecturerClient(email, name);
            toast.success("Successfully registered a new lecturer.");
            router.push("/dashboard/admin");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-lg space-y-4 -translate-y-10">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
                    <h1 className="text-2xl font-semibold tracking-tight">Register a new lecturer</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        The new lecturer's account will be created with this default password. Please share this with them so they can log in and change it. <br />
                        <span className="font-mono font-medium text-foreground">{defaultPassword}</span>
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="border border-border rounded-lg p-6 space-y-4 bg-card">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Email</label>
                        <Input type="text" placeholder="e.g. lecturer@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Full Name</label>
                        <Input type="text" placeholder="e.g. Dr. John Doe, B.Sc., M.Sc." value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="h-10" />
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Include title(s) when neccesary.
                        </p>
                    </div>
                    <Button className="w-full h-10 cursor-pointer" onClick={handleSubmit} disabled={loading || !email || !name}>
                        {loading ? "Registering..." : "Register Lecturer"}
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}