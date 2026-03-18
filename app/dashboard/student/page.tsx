"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ClassCard from "@/components/dashboard/course-card";
import { Course } from "@/modules/courses/types";
import { fetchEnrolledCourses, dropCourse } from "@/modules/courses/client";
import { toast } from "sonner";
import { authClient } from "@/modules/auth/client";

export default function StudentDashboardPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session } = authClient.useSession();
    const userName = session?.user?.name ?? "Student";

    useEffect(() => {
        fetchEnrolledCourses()
        .then(setCourses)
        .catch(() => toast.error("Failed to load courses."))
        .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        const previous = courses;
        setCourses((prev) => prev.filter((c) => c.courseId !== id));
        try {
            await dropCourse(id);
            toast.success("Course dropped successfully.");
        } catch {
            setCourses(previous);
            toast.error("Failed to drop course. Please try again.");
        }
    }

    const handleView = (id: string) => {
        router.push(`/dashboard/student/course/${id}`);
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Institution
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    BINUS University International
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Welcome back, <span className="font-medium text-foreground">{userName}</span>. You are enrolled in{" "}
                    <span className="font-medium text-foreground">{courses.length}</span>{" "}
                    {courses.length === 1 ? "class" : "classes"}.
                </p>
            </motion.div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {courses.map((cls, i) => (
                            <motion.div  key={cls.courseId}  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
                                <ClassCard cls={cls} onView={() => handleView(cls.courseId)} onDelete={() => handleDelete(cls.courseId)} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {courses.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground text-sm">
                    No classes yet.{" "}
                    <span
                        className="text-foreground font-medium cursor-pointer underline underline-offset-2"
                        onClick={() => router.push("/dashboard/student/enroll")}
                    >
                        Enroll in a class
                    </span>{" "}
                    to get started.
                    </div>
                )}
                </>
            )}
        </div>
    );
}