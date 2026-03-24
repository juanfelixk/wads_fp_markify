"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BookOpen, User, Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchClassDetail } from "@/modules/assignments/client";
import { ClassDetail, Assignment } from "@/modules/assignments/types";
import { toast } from "sonner";
import { getAccentColor } from "@/lib/accent-color";
import { statusConfig } from "@/modules/assignments/constants";

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getDeadlineState(endDate: string): "overdue" | "soon" | "OK" {
    const now = Date.now();
    const end = new Date(endDate).getTime();
    const diff = end - now;
    if (diff < 0) return "overdue";
    if (diff < 1000 * 60 * 60 * 24 * 3) return "soon"; // within 3 days
    return "OK";
}

export default function StudentCoursePage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;
    const [detail, setDetail] = useState<ClassDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClassDetail(classId)
        .then(setDetail)
        .catch(() => toast.error("Failed to load class."))
        .finally(() => setLoading(false));
    }, [classId]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
                <div className="h-6 w-32 rounded bg-muted animate-pulse" />
                <div className="h-10 w-64 rounded bg-muted animate-pulse" />
                <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                <div className="mt-8 space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center py-24 text-center gap-3">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Class not found or you don't have access.</p>
                <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground" onClick={() => router.push("/dashboard/student")}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground mb-4" onClick={() => router.push("/dashboard/student")}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs font-mono font-semibold">
                        {detail.courseCode}
                    </Badge>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className="text-xs font-mono">
                        {detail.classCode}
                    </Badge>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className="text-xs font-mono">
                        {detail.academicYear}
                    </Badge>
                </div>

                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">
                    {detail.courseName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {detail.lecturerName}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        {detail.institution}
                    </span>
                </div>
            </motion.div>

            {/* assignments heading */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }} className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground translate-y-px" />
                <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
                <span className="text-sm text-muted-foreground translate-y-0.5">
                    ({detail.assignments.length})
                </span>
            </motion.div>

            {/* assignment list */}
            {detail.assignments.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center py-16 text-muted-foreground text-sm">
                    No assignments yet.
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {detail.assignments.map((assignment, i) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} index={i} classId={classId} />
                    ))}
                </div>
            )}
        </div>
    );
}

function AssignmentCard({ assignment, index, classId }: { assignment: Assignment; index: number; classId: string; }) {
    const status = statusConfig[assignment.status];
    const deadlineState = getDeadlineState(assignment.endDate);
    const isNotSubmitted = assignment.status === "NOT_SUBMITTED";

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 + index * 0.06 }}>
            <Card className="hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 h-full" style={{ backgroundColor: `hsl(${getAccentColor(classId)})` }} />
                <CardContent className="px-8">
                    {/* mobile: stacked, sm+: side by side */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* left: title + dates */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-base truncate mb-3 sm:mb-1.5">
                                {assignment.title}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-y-0.5 text-sm sm:text-xs text-muted-foreground">
                                <span className="sm:mr-5 sm:w-[150px]">
                                    <span className="font-medium text-foreground/70">Start:</span>{" "}
                                    {formatDateTime(assignment.startDate)}
                                </span>
                                <span className={`sm:mr-5 sm:w-[200px] ${
                                    isNotSubmitted && deadlineState === "overdue"
                                        ? "text-red-500 dark:text-red-400"
                                        : isNotSubmitted && deadlineState === "soon"
                                        ? "text-amber-500 dark:text-amber-400"
                                        : ""
                                }`}>
                                    <span className={`font-medium ${
                                        isNotSubmitted && deadlineState !== "OK"
                                            ? "text-inherit"
                                            : "text-foreground/70"
                                    }`}>
                                        Due:
                                    </span>{" "}
                                    {formatDateTime(assignment.endDate)}
                                    {isNotSubmitted && deadlineState === "overdue" && (
                                        <span className="ml-1 font-medium">(Overdue)</span>
                                    )}
                                    {isNotSubmitted && deadlineState === "soon" && (
                                        <span className="ml-1 font-medium">(Due soon)</span>
                                    )}
                                </span>
                                {assignment.maxPoints != null && (
                                    <span>
                                        <span className="font-medium text-foreground/70">Max Points:</span>{" "}
                                        {assignment.maxPoints}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* right: status + action */}
                        <div className="flex items-center gap-3 shrink-0 justify-end">
                            <Badge variant="outline" className={`text-xs font-medium px-2.5 py-1 ${status.className}`}>
                                {status.label}
                            </Badge>
                            <Link href={`/dashboard/student/course/${classId}/assignment/${assignment.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}