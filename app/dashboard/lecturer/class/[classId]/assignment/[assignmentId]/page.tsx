"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Award, ShieldCheck, Users, CheckCircle2, Search, Download, Loader2, CalendarClock, CalendarCheck, ClockAlert, FileCheck, BadgeCheck, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchLecturerAssignmentPageData } from "@/services/assignments/client";
import type { LecturerAssignmentPageData } from "@/services/assignments/types";
import { getAccentColor } from "@/lib/accent-color";
import { statusConfig } from "@/services/assignments/constants";
import RubricDialog from "@/components/feedback/rubric-dialog";
import { fetchLecturerSubmissionFileUrl } from "@/services/submissions/client";
import { toast } from "sonner";
import { publishGradesClient } from "@/services/lecturer/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

function formatDateTime(dt: string) {
    const d = new Date(dt);
    return (d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true }));
}

export default function LecturerAssignmentPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    const assignmentId = params.assignmentId as string;
    const [pageData, setPageData] = useState<LecturerAssignmentPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [rubricOpen, setRubricOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        if (!classId || !assignmentId) return;
        setLoading(true);
        fetchLecturerAssignmentPageData(classId, assignmentId)
            .then(setPageData)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [classId, assignmentId]);

    const stats = useMemo(() => {
        if (!pageData) return { total: 0, submitted: 0, graded: 0, pct: 0 };
        const total = pageData.submissions.length;
        const submitted = pageData.submissions.filter((s) => s.status !== "NOT_SUBMITTED").length;
        const graded = pageData.submissions.filter((s) => s.status === "GRADED").length;
        const submitted_pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
        const graded_pct = total > 0 ? Math.round((graded / total) * 100) : 0;
        return { total, submitted, graded, submitted_pct, graded_pct };
    }, [pageData]);

    const filtered = useMemo(() => {
        if (!pageData) return [];
        return pageData.submissions.filter((s) => {
            const matchesSearch = !search ||
                s.studentName.toLowerCase().includes(search.toLowerCase()) ||
                s.studentId.toLowerCase().includes(search.toLowerCase()) ||
                s.email.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [pageData, search, statusFilter]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-24 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading assignment...</span>
            </div>
        );
    }

    if (error || !pageData) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    {error ? "Something went wrong" : "Assignment not found"}
                </h1>
                <p className="text-muted-foreground mb-6">
                    {error ?? "The assignment you're looking for doesn't exist."}
                </p>
                <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => router.push(`/dashboard/lecturer/class/${classId}`)}>
                    <ArrowLeft className="w-4 h-4" /> Back to Class
                </Button>
            </div>
        );
    }

    const { title, instructions, maxPoints, lateAllowed, startDate, endDate, rubric, courseCode, courseName, classCode, academicYear, role } = pageData;
    const color = getAccentColor(`${courseCode}-${academicYear}`);

    const isPublished = !!pageData?.gradesPublishedAt;
    const allGraded = pageData
        ? pageData.submissions.filter((s) => s.status !== "NOT_SUBMITTED").every((s) => s.status === "GRADE_SAVED" || s.status === "GRADED")
        : false;

    async function handlePublish() {
        setPublishing(true);
        try {
            const result = await publishGradesClient(classId, assignmentId);
            setPageData((prev) =>
                prev
                    ? {
                        ...prev,
                        gradesPublishedAt: new Date().toISOString(),
                        submissions: prev.submissions.map((s) =>
                            s.status === "GRADE_SAVED" ? { ...s, status: "GRADED" } : s
                        ),
                    }
                    : prev
            );
            toast.success(`${result.publishedCount} grade(s) published and released to students.`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to publish grades.");
        } finally {
            setPublishing(false);
        }
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <Button variant="ghost" size="lg" className="gap-2 hover:bg-foreground/10 text-muted-foreground mb-4 cursor-pointer" onClick={() => router.push(`/dashboard/lecturer/class/${classId}`)}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to Class
                </Button>
            </motion.div>

            {/* header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
                <div className="h-1.5 w-24 rounded-full mb-4" style={{ backgroundColor: `hsl(${color})` }} />

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-mono font-semibold">{courseCode}</Badge>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className="text-xs font-mono">{classCode}</Badge>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Badge variant="outline" className="text-xs font-mono">{academicYear}</Badge>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs text-muted-foreground">{courseName}</span>
                </div>

                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">{title}</h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <CalendarCheck className="w-4 h-4" />
                        Opens {formatDateTime(startDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4" />
                        Due {formatDateTime(endDate)}
                    </span>
                    {maxPoints != null && (
                        <span className="flex items-center gap-1.5">
                            <Award className="w-4 h-4" />
                            {maxPoints} points
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <ClockAlert className="w-4 h-4" />
                        Late {lateAllowed ? "allowed" : "not allowed"}
                    </span>
                </div>
            </motion.div>

            {instructions && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="mb-6">
                    <Card>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{instructions}</p>
                            {rubric && rubric.length > 0 && (
                                <>
                                    <Button variant="outline" className="w-full gap-2 cursor-pointer mt-5" onClick={() => setRubricOpen(true)}>
                                        <FileText className="w-4 h-4" /> View Rubric
                                    </Button>
                                </>
                            )}
                            <RubricDialog open={rubricOpen} onOpenChange={setRubricOpen} title={title} rubric={rubric ?? []} totalPoints={maxPoints ?? null} scores={null} role={role} />
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <Card>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Users className="w-3.5 h-3.5" /> Total Students
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <FileText className="w-3.5 h-3.5" /> Submitted
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.submitted}/{stats.total}</p>
                        <Progress value={stats.submitted_pct} className="h-1.5 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Graded
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.graded}/{stats.total}</p>
                        <Progress value={stats.graded_pct} className="h-1.5 mt-2" />
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-muted-foreground translate-y-px" />
                    <h2 className="text-lg font-semibold text-foreground">Submissions</h2>
                    <span className="text-sm text-muted-foreground translate-y-0.5">
                        ({filtered.length})
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-full sm:w-64 bg-foreground/7 text-muted-foreground" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 w-[170px] cursor-pointer bg-foreground/7">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="cursor-pointer">All statuses</SelectItem>
                            <SelectItem value="NOT_SUBMITTED"  className="cursor-pointer">Not Submitted</SelectItem>
                            <SelectItem value="SUBMITTED" className="cursor-pointer">Submitted</SelectItem>
                            <SelectItem value="SUBMITTED_LATE" className="cursor-pointer">Submitted Late</SelectItem>
                            <SelectItem value="REVISED" className="cursor-pointer">Revised</SelectItem>
                            <SelectItem value="TO_BE_REVIEWED" className="cursor-pointer">To Be Reviewed</SelectItem>
                            <SelectItem value="GRADE_SAVED" className="cursor-pointer">Grade Saved</SelectItem>
                            <SelectItem value="GRADED" className="cursor-pointer">Graded</SelectItem>
                        </SelectContent>
                    </Select>
                    {isPublished ? (
                        <Button disabled className="gap-1.5 cursor-not-allowed opacity-60">
                            <Lock className="w-3.5 h-3.5" /> Grades Published
                        </Button>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="gap-1.5 cursor-pointer bg-primary/90 hover:bg-primary" disabled={publishing || !allGraded || stats.submitted === 0} title={!allGraded ? "All submitted assignments must be graded before publishing" : undefined}>
                                    {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                                    Publish Grades
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Publish Grades</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will release all saved grades and comments to students. All students without submission will receive a score of <span className="text-destructive">0 (ZERO)</span>. Once published, grades cannot be edited. Make sure all grades are final before proceeding.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="cursor-pointer" onClick={handlePublish}>
                                        Publish
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </motion.div>

            {/* published banner */}
            {isPublished && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400 mb-4">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>All grades have been published and are now visible to students. Editing is no longer possible. Students with no submission are assigned with a score of 0.</span>
                </div>
            )}

            {/* table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">File</TableHead>
                                    <TableHead className="text-center">Submitted</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                                            Couldn&apos;t resolve any submissions.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((s) => {
                                        const canGrade = s.status !== "NOT_SUBMITTED" && !!s.fileName && !!s.submittedAt
                                        const isLocked = isPublished;
                                        const status = statusConfig[s.status];
                                        return (
                                            <TableRow key={s.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground text-sm">{s.studentName}</span>
                                                        <span className="text-xs text-muted-foreground">{s.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 ${status.className}`}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground text-center max-w-[100px] truncate">
                                                    {s.fileName 
                                                        ? s.fileName 
                                                        : s.status === "GRADED" 
                                                            ? <span className="text-destructive">No Submission</span>
                                                            : "—"
                                                    }
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground text-center">
                                                    {s.submittedAt 
                                                        ? formatDateTime(s.submittedAt) 
                                                        : s.status === "GRADED" 
                                                            ? <span className="text-destructive">No Submission</span>
                                                            : "—"
                                                    }
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {s.finalScore != null ? (
                                                        <span className="font-semibold text-foreground">
                                                            {s.finalScore}
                                                            <span className="text-xs text-muted-foreground font-normal"> / {maxPoints}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" disabled={!canGrade} onClick={() => window.open(`/dashboard/lecturer/class/${classId}/assignment/${assignmentId}/grading/${s.id}`, "_blank")}>
                                                            {isLocked ? <Eye className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                                                            {isLocked ? "View" : "Grade"}
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" disabled={!canGrade} onClick={async () => {
                                                            const url = await fetchLecturerSubmissionFileUrl(classId, assignmentId, s.studentId);
                                                            window.open(url, "_blank");
                                                        }} title="Download PDF">
                                                            <Download className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>

            <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Submissions are securely stored and access-controlled. Grades are visible only to enrolled students and authorized staff.
            </p>
        </div>
    );
}