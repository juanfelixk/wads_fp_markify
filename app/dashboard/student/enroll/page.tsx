"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { enrollInClass } from "@/services/classes/client";
import { motion } from "framer-motion";

export default function EnrollPage() {
    const router = useRouter();
    const [courseCode, setCourseCode] = useState("");
    const [classCode, setClassCode] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [enrollmentKey, setEnrollmentKey] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = (): string | null => {
        if (!courseCode.trim()) return "Course code is required.";
        if (!classCode.trim()) return "Class code is required.";
        if (!academicYear.trim()) return "Academic year is required.";
        if (!/^\d{4}\/\d{4}$/.test(academicYear.trim())) return "Academic year must be in the format e.g. 2024/2025.";
        if (!enrollmentKey.trim()) return "Enrollment key is required.";
        return null;
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) { toast.error(error); return; }
        try {
            setLoading(true);
            await enrollInClass(courseCode.trim(), classCode.trim(), academicYear.trim(), enrollmentKey.trim());
            toast.success("Successfully enrolled!");
            router.push("/dashboard/student");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8.3rem)] px-4">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-lg space-y-4 -translate-y-10">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
                    <h1 className="text-2xl font-semibold tracking-tight">Enroll in a Class</h1>
                    <p className="text-sm text-muted-foreground mt-1">Enter your class details provided by your lecturer.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="border border-border rounded-lg p-6 space-y-4 bg-card">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Course Code</label>
                        <Input type="text" placeholder="e.g. CS101" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Class Code</label>
                        <Input type="text" placeholder="e.g. L1AC" value={classCode} onChange={(e) => setClassCode(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Academic Year</label>
                        <Input type="text" placeholder="e.g. 2024/2025" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Enrollment Key</label>
                        <Input type="text" placeholder="Provided by your lecturer" value={enrollmentKey} onChange={(e) => setEnrollmentKey(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <Button className="w-full h-10 cursor-pointer" onClick={handleSubmit} disabled={loading || !courseCode || !classCode || !academicYear || !enrollmentKey}>
                        {loading ? "Enrolling..." : "Enroll"}
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}