"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { registerCourseClient } from "@/services/admin/client";
import { authClient } from "@/services/auth/client";
import { motion } from "framer-motion";
import { BookPlus, Building2 } from "lucide-react";

export default function RegisterCoursePage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const institution = session?.user?.institution ?? "Unknown";

    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = (): string | null => {
        if (!code.trim()) return "Course code is required.";
        if (!/^[A-Za-z0-9]+$/.test(code.trim())) return "Course code must be alphanumeric (e.g. CS101).";
        if (!name.trim()) return "Course name is required.";
        return null;
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) { toast.error(error); return; }
        try {
            setLoading(true);
            await registerCourseClient({ code: code.trim(), name: name.trim() });
            toast.success(`Course "${code.toUpperCase()}" registered successfully.`);
            router.push("/dashboard/admin");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = code.trim() && name.trim() && !loading;

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8.3rem)] px-4">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-lg space-y-4 -translate-y-10">
                {/* heading */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-semibold tracking-tight">Register a new course</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Add a new course to your curriculum. Once registered, the assigned lecturer must manually create class(es) for this course on their lecturer dashboard.
                    </p>
                </motion.div>

                {/* form */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="border border-border rounded-lg p-6 space-y-4 bg-card">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Institution
                        </label>
                        <Input value={institution} disabled className="h-10 bg-muted/50 text-muted-foreground cursor-not-allowed" />
                        <p className="text-xs text-muted-foreground">
                            Courses are registered under your institution.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Course Code
                        </label>
                        <Input type="text" placeholder="e.g. CS101" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} disabled={loading} className="h-10" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Course Name
                        </label>
                        <Input type="text" placeholder="e.g. Introduction to Computer Science" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="h-10" />
                    </div>

                    <Button className="w-full h-10 cursor-pointer" onClick={handleSubmit} disabled={!canSubmit}>
                        {loading ? "Registering..." : "Register Course"}
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}