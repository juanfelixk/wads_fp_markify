"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { fetchCourses, createClassClient } from "@/services/lecturer/client";
import { CourseSummary } from "@/services/lecturer/types";

export default function CreateNewClassPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<CourseSummary[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<CourseSummary | null>(null);
    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const [code, setCode] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCourses()
            .then(setCourses)
            .catch(() => toast.error("Failed to load courses."))
            .finally(() => setCoursesLoading(false));
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50);
    }, [dropdownOpen]);

    const filtered = courses.filter(
        (c) =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectCourse = (course: CourseSummary) => {
        setSelectedCourse(course);
        setDropdownOpen(false);
        setSearch("");
    };

    const handleClearCourse = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCourse(null);
    };

    const validate = (): string | null => {
        if (!selectedCourse) return "Please select a course.";
        if (!code.trim()) return "Class code is required.";
        if (!/^[A-Za-z0-9]+$/.test(code.trim())) return "Class code must be alphanumeric (e.g. L1CC, L3BA).";
        if (!academicYear.trim()) return "Academic year is required.";
        if (!/^\d{4}\/\d{4}$/.test(academicYear.trim())) return "Academic year must be in the format e.g. 2024/2025.";
        return null;
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) { toast.error(error); return; }
        try {
            setLoading(true);
            await createClassClient({
                courseId: selectedCourse!.id,
                code: code.trim(),
                academicYear: academicYear.trim(),
            });
            toast.success("Class created successfully.");
            router.push("/dashboard/lecturer");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = selectedCourse && code.trim() && academicYear.trim() && !loading;

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8.3rem)] px-4">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-lg space-y-4">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
                    <h1 className="text-2xl font-semibold tracking-tight mb-1">Create a new class</h1>
                    <p className="text-sm text-muted-foreground">
                        Select a course, assign a class code, and set the academic year. An enrollment key will be generated automatically after submission.
                    </p>
                </motion.div>

                {/* form */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="border border-border rounded-lg p-6 space-y-4 bg-card">
                    {/* course picker */}
                    <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
                        <label className="text-sm font-medium text-foreground select-none">
                            Course
                        </label>

                        <button type="button" onClick={() => !loading && setDropdownOpen((prev) => !prev)} disabled={loading || coursesLoading}
                            className={[
                                "relative flex items-center justify-between h-10 w-full rounded-md border border-input bg-background px-3 text-sm transition-colors",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                loading || coursesLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-accent/40",
                                dropdownOpen ? "ring-2 ring-ring" : "",
                            ].join(" ")}>
                            {selectedCourse ? (
                                <span className="flex items-center gap-2 min-w-0">
                                    <span className="font-medium text-foreground shrink-0">{selectedCourse.code}</span>
                                    <span className="text-muted-foreground truncate">{selectedCourse.name}</span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">
                                    {coursesLoading ? "Loading courses..." : "Select a course..."}
                                </span>
                            )}
                            <span className="flex items-center gap-1 shrink-0 ml-2">
                                {selectedCourse && (
                                    <span onClick={handleClearCourse} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                        <X size={13} />
                                    </span>
                                )}
                                <ChevronDown size={15} className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                            </span>
                        </button>

                        {/* dropdown */}
                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute z-50 mt-1 top-full w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                                        <Search size={13} className="text-muted-foreground shrink-0" />
                                        <input ref={searchRef} type="text" placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                                        {search && (
                                            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-52 overflow-y-auto">
                                        {filtered.length === 0 ? (
                                            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                                                {courses.length === 0
                                                    ? "No courses available in your institution."
                                                    : "No courses match your search."}
                                            </p>
                                        ) : (
                                            filtered.map((course) => {
                                                const isSelected = selectedCourse?.id === course.id;
                                                return (
                                                    <button key={course.id}type="button"onClick={() => handleSelectCourse(course)}
                                                        className={[
                                                            "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors cursor-pointer",
                                                            isSelected
                                                                ? "bg-accent text-accent-foreground"
                                                                : "hover:bg-accent/60 text-foreground",
                                                        ].join(" ")}>
                                                        <span className="font-medium w-16 shrink-0 text-foreground">{course.code}</span>
                                                        <span className="truncate text-muted-foreground flex-1">{course.name}</span>
                                                        {isSelected && <Check size={13} className="shrink-0 text-primary" />}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="text-xs text-muted-foreground">
                            Only courses registered under your institution are shown.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Class Code
                        </label>
                        <Input type="text" placeholder="e.g. L1CC, L4BA" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} disabled={loading} className="h-10" />
                        <p className="text-xs text-muted-foreground">
                            Must be alphanumeric and unique within the selected course and academic year.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Academic Year
                        </label>
                        <Input type="text" placeholder="e.g. 2024/2025" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} disabled={loading} className="h-10" />
                    </div>

                    <p className="text-xs text-muted-foreground border border-dashed border-border rounded-md px-3 py-2 bg-muted/30">
                        🔑 An enrollment key will be automatically generated when the class is created. You can find it on your lecturer dashboard.
                    </p>

                    <Button className="w-full h-10 cursor-pointer"onClick={handleSubmit}disabled={!canSubmit}>
                        {loading ? "Creating..." : "Create Class"}
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}