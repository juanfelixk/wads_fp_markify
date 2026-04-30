"use client";

import { authClient } from "@/services/auth/client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ClassSummary } from "@/services/classes/types";
import { toast } from "sonner";
import { deleteOwnedClass, fetchOwnedClasses } from "@/services/classes/client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LecturerClassCard } from "@/components/dashboard/lecturer-class-card";

export default function LecturerDashboardPage() {
    const { data: session } = authClient.useSession();
    const lecturerName = session?.user?.name ?? "Lecturer";
    const institution = session?.user?.institution ?? "Your Institution";
    
    const [classes, setClasses] = useState<ClassSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const isSearching = query.trim().length > 0;
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchOwnedClasses()
            .then(setClasses)
            .catch(() =>
                toast.error("Failed to load classes.")
            )
            .finally(() => setLoading(false));
    }, [toast]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return classes;
        return classes.filter(
            (c) =>
                c.courseCode.toLowerCase().includes(q) ||
                c.courseName.toLowerCase().includes(q) ||
                c.classCode.toLowerCase().includes(q) ||
                c.academicYear.toLowerCase().includes(q)
        );
    }, [classes, query]);

    const handleDelete = async (cls: ClassSummary) => {
        setClasses((prev) => prev.filter((c) => c.classId !== cls.classId));
        setDeletingIds((prev) => new Set(prev).add(cls.classId));
 
        try {
            await deleteOwnedClass(cls.classId);
            toast.success(`"${cls.courseName} - ${cls.classCode}" has been removed.`);
        } catch {
            setClasses((prev) =>
                [...prev, cls].sort((a, b) => a.courseName.localeCompare(b.courseName))
            );
            toast.error(`Failed to delete "${cls.courseName} - ${cls.classCode}". Please try again.`);
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(cls.classId);
                return next;
            });
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Institution
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {institution}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Welcome back, <span className="font-medium text-foreground">{lecturerName}</span>
                </p>
            </motion.div>

            {/* toolbar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 min-w-10/12 sm:min-w-0 sm:max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by course, class, or academic year" className="pl-9 bg-foreground/7 text-muted-foreground" />
                </div>
            </motion.div>

            {/* class cards */}
            <div className="space-y-3">
                {loading && (
                    <>
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-[125px] w-full rounded-lg" />
                        ))}
                    </>
                )}
 
                {!loading && filtered.length === 0 && (
                    <div className="text-center text-muted-foreground py-16 border border-dashed border-border rounded-lg">
                        {query ? `No classes match "${query}".` : "No classes found."}
                    </div>
                )}
 
                {!loading && (
                    isSearching ? (
                        filtered.map((cls) => (
                            <div key={cls.classId}>
                                <LecturerClassCard cls={cls} onDelete={handleDelete} deleting={deletingIds.has(cls.classId)} />
                            </div>
                        ))
                    ) : (
                        <AnimatePresence>
                            {filtered.map((cls, i) => (
                                <motion.div key={cls.classId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, delay: i * 0.06 }}>
                                    <LecturerClassCard cls={cls} index={i} onDelete={handleDelete} deleting={deletingIds.has(cls.classId)} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )
                    )}
            </div>
        </div>
    );
}