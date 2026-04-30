"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Users, Clock, Plus, FileText, Loader2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchLecturerClassPageData } from "@/services/classes/client";
import type { LecturerClassPageData, LecturerAssignment } from "@/services/classes/types";
import { getAccentColor } from "@/lib/accent-color";
import { AlertDialog, AlertDialogAction, AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteAssignment } from "@/services/assignments/client";
import { toast } from "sonner";

function formatDateTime(dt: string) {
    const d = new Date(dt);
    return (d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true }));
}

function deadlineState(startDate: string, endDate: string) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (now < start) return { label: "Not Opened", className: "bg-muted text-muted-foreground border-border" };
    if (diffMs < 0) return { label: "Deadline Passed", className: "bg-red-50 text-red-700 border-red-400" };
    if (diffDays <= 3) return { label: `Due in ${diffDays}d`, className: "bg-yellow-50 text-yellow-700 border-yellow-400" };
    return { label: "Open", className: "bg-primary/10 text-primary border-primary/20" };
}

export default function LecturerClassPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    const [pageData, setPageData] = useState<LecturerClassPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!classId) return;
        setLoading(true);
        fetchLecturerClassPageData(classId)
            .then(setPageData)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [classId]);

    const stats = useMemo(() => {
        if (!pageData) return { totalSubs: 0, totalGraded: 0 };
        const totalSubs = pageData.assignments.reduce((s, a) => s + a.submissions, 0);
        const totalGraded = pageData.assignments.reduce((s, a) => s + a.graded, 0);
        return { totalSubs, totalGraded };
    }, [pageData]);

    async function handleDeleteAssignment(assignmentId: string) {
        setDeletingId(assignmentId);
        try {
            await deleteAssignment(classId, assignmentId);
            setPageData(prev => prev ? {
            ...prev,
            assignments: prev.assignments.filter(a => a.id !== assignmentId)
            } : prev);
            toast.success("Assignment deleted successfully.")
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete assignment.")
        } finally {
            setDeletingId(null);
        }
        }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-24 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading class…</span>
            </div>
        );
    }

    if (error || !pageData) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    {error ? "Something went wrong" : "Class not found"}
                </h1>
                <p className="text-muted-foreground mb-6">
                    {error ?? "The class you're looking for doesn't exist."}
                </p>
                <Button variant="outline" className="gap-2" onClick={() => router.push("/dashboard/lecturer")}>
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
            </div>
        );
    }

    const { courseCode, courseName, classCode, academicYear, students, assignments } = pageData;
    const color = getAccentColor(`${courseCode}-${academicYear}`);

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground mb-4" onClick={() => router.push("/dashboard/lecturer")}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="h-1.5 w-24 rounded-full mb-4" style={{ backgroundColor: `hsl(${color})` }} />

                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs font-mono font-semibold">
                        {courseCode}
                    </Badge>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className="text-xs font-mono">
                        {classCode}
                    </Badge>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className="text-xs font-mono">
                        {academicYear}
                    </Badge>
                </div>

                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">
                    {courseName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {students} students
                    </span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> {assignments.length} assignments
                    </span>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }} className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground translate-y-px" />
                    <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
                    <span className="text-sm text-muted-foreground translate-y-0.5">
                        ({assignments.length})
                    </span>
                </div>

                <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => router.push(`/dashboard/lecturer/class/${classId}/create-assignment`)}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Assignment</span>
                    <span className="sm:hidden">New</span>
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }} className="text-xs text-muted-foreground mb-3">
                {stats.totalSubs} total submissions · {stats.totalGraded} graded
            </motion.div>

            <div className="space-y-3">
                {assignments.map((assignment: LecturerAssignment, i: number) => {
                    const pct = students > 0
                        ? Math.round((assignment.submissions / students) * 100)
                        : 0;
                    const state = deadlineState(assignment.startDate, assignment.endDate);

                    return (
                        <motion.div key={assignment.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}>
                            <Card className="hover:shadow-md transition-shadow duration-200 p-2!">
                                <CardContent className="px-1!">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                                                    {assignment.title}
                                                </p>
                                                <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 ${state.className}`}>
                                                    {state.label}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-x-7 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                                <span>
                                                    <span className="font-medium text-foreground/70">Start:</span>{" "}
                                                    {formatDateTime(assignment.startDate)}
                                                </span>
                                                <span>
                                                    <span className="font-medium text-foreground/70">Due:</span>{" "}
                                                    {formatDateTime(assignment.endDate)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="sm:w-48 shrink-0">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-muted-foreground">Submissions</span>
                                                <span className="font-medium text-foreground">
                                                    {assignment.submissions}/{students}
                                                </span>
                                            </div>
                                            <Progress value={pct} className="h-1.5" />
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {assignment.graded} graded
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0 ml-4">
                                            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={() => router.push(`/dashboard/lecturer/class/${classId}/assignment/${assignment.id}`)}>
                                                <Eye className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">View</span>
                                            </Button>
                                            {/* edit */}
                                            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer"
                                                onClick={() => router.push(`/dashboard/lecturer/class/${classId}/create-assignment?assignmentId=${assignment.id}`)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Edit</span>
                                            </Button>
                                            {/* delete */}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="max-w-[60vw] sm:max-w-sm">
                                                    <AlertDialogHeader className="select-none">
                                                        <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                                                        <AlertDialogDescription className="my-2">
                                                            Are you sure you want to delete <span className="font-medium text-foreground">{assignment.title}</span>? All data related to this assignment will be deleted. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="cursor-pointer bg-destructive! text-destructive-foreground! hover:bg-destructive/90!" onClick={() => handleDeleteAssignment(assignment.id)} disabled={deletingId === assignment.id}>
                                                            {deletingId === assignment.id ? "Deleting…" : "Delete Assignment"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}