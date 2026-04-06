"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Clock, Award, Upload, Eye, Shield, Lock, History, CheckCircle, AlertCircle, ChevronRight, BookOpen, User, Info, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { fetchAssignmentPageData } from "@/modules/assignments/client";
import { uploadSubmission } from "@/modules/submissions/client";
import { statusConfig } from "@/modules/assignments/constants";
import { getAccentColor } from "@/lib/accent-color";
import type { AssignmentPageData } from "@/modules/assignments/types";
import type { SubmissionVersionData } from "@/modules/submissions/types";
import RubricDialog from "@/components/feedback/rubric-dialog";

// helper
function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// helper
function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// helper
function getDeadlineState(endDate: string): "overdue" | "soon" | "ok" {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff < 0) return "overdue";
    if (diff < 1000 * 60 * 60 * 24 * 3) return "soon";
    return "ok";
}

// skeleton
function Skeleton() {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
            <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                <div className="h-8 w-80 rounded bg-muted animate-pulse" />
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="h-40 rounded-lg bg-muted animate-pulse" />
                    <div className="h-56 rounded-lg bg-muted animate-pulse" />
                </div>
                <div className="space-y-4">
                    <div className="h-48 rounded-lg bg-muted animate-pulse" />
                    <div className="h-32 rounded-lg bg-muted animate-pulse" />
                </div>
            </div>
        </div>
    );
}

// upload zone
function UploadZone({ classId, assignmentId, isBlocked, onUploaded }: {classId: string; assignmentId: string; isBlocked: boolean; onUploaded: () => void;}) {
    const [hover, setHover] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are accepted.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File exceeds the 10 MB limit.");
            return;
        }
        setUploading(true);
        setProgress(0);
        try {
            const result = await uploadSubmission(classId, assignmentId, file, setProgress);
            onUploaded();
            toast.success("Submission uploaded successfully.");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed.";
            if (message === "Graded") {
                toast.error("This assignment has been graded. No further submissions allowed.");
            } else {
                toast.error(message);
            }
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }

    if (isBlocked) {
        return (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-dashed">
                <Lock className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-xs text-red-600">
                    Submissions are now locked.
                </p>
            </div>
        );
    }

    return (
        <div>
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                    ${hover ? "border-primary bg-primary/5" : "border-border"}
                    ${uploading ? "pointer-events-none" : ""}`}
                onClick={() => !uploading && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setHover(true); }}
                onDragLeave={() => setHover(false)}
                onDrop={(e) => {
                    e.preventDefault(); setHover(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                }}
            >
                {uploading ? (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.2 }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{progress}%</p>
                    </div>
                ) : (
                    <>
                        <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">
                            Drag & drop your essay here, or
                            <span className="text-primary font-medium"> browse files</span>
                        </p>
                        <p className="text-xs text-muted-foreground">PDF only · Max 10 MB · Encrypted at rest</p>
                    </>
                )}
            </div>
        </div>
    );
}

// version row (current and history)
function VersionRow({ version, classId, assignmentId, isCurrent = false }: { version: SubmissionVersionData; classId: string; assignmentId: string; isCurrent?: boolean; }) {
    const [loading] = useState(false);

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${isCurrent ? "bg-muted/40" : "bg-card"}`}>
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-md ${isCurrent ? "bg-primary/10" : "bg-muted"} flex items-center justify-center shrink-0`}>
                    <FileText className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="min-w-0">
                    <p className={`text-sm ${isCurrent ? "font-medium text-foreground" : "text-foreground"} truncate pr-3 sm:pr-0`}>
                        {version.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        v{version.version} · {formatFileSize(version.fileSize)} · {formatDateTime(version.uploadedAt)}
                    </p>
                </div>
            </div>
            <Button variant={isCurrent ? "outline" : "ghost"} size="sm" className={`gap-1.5 shrink-0 cursor-pointer ${!isCurrent && "text-muted-foreground"}`} onClick={() => window.open(`/dashboard/student/class/${classId}/assignment/${assignmentId}/feedback`, "_blank")} disabled={loading}>
                <Eye className="w-3.5 h-3.5" />
                {isCurrent && <span className="hidden sm:inline">View Feedback</span>}
            </Button>
        </div>
    );
}

// page
export default function AssignmentPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;
    const assignmentId = params.assignmentId as string;

    const [data, setData] = useState<AssignmentPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [rubricOpen, setRubricOpen] = useState(false);

    useEffect(() => {
        fetchAssignmentPageData(classId, assignmentId)
            .then(setData)
            .catch(() => toast.error("Failed to load assignment."))
            .finally(() => setLoading(false));
    }, [classId, assignmentId]);

    // update submission state after upload
    async function handleUploaded() {
        const fresh = await fetchAssignmentPageData(classId, assignmentId);
        setData(fresh);
    }

    if (loading) return <Skeleton />;

    if (!data) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center py-24 text-center gap-3">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Assignment not found or you don't have access.</p>
                <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground" onClick={() => router.push(`/dashboard/student/class/${classId}`)}>
                    <ArrowLeft className="w-4 h-4" /> Back to Class
                </Button>
            </div>
        );
    }

    const accentColor = getAccentColor(classId);
    const status = statusConfig[data.submission?.status ?? "NOT_SUBMITTED"];
    const deadlineState = getDeadlineState(data.endDate);
    const isGraded = data.submission?.status === "GRADED";
    const isNotSubmitted = !data.submission || data.submission.status === "NOT_SUBMITTED";
    const isLate = new Date(data.endDate).getTime() < Date.now();
    const lateAllowed = data.lateAllowed ?? false;
    const isSubmissionBlocked = isGraded || (isLate && !lateAllowed);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground mb-4" onClick={() => router.push(`/dashboard/student/class/${classId}`)}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to {data.courseCode}
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="h-1.5 w-24 rounded-full mb-4" style={{ backgroundColor: `hsl(${accentColor})` }} />

                {/* breadcrumb */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs font-mono font-semibold">{data.courseCode}</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs font-mono">{data.classCode}</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{data.title}</span>
                </div>

                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                    {data.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                    {data.lecturerName && (
                        <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" /> {data.lecturerName}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> {data.courseName}
                    </span>
                </div>

                {/* status and grade */}
                <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className={`text-xs font-medium px-2.5 py-1 ${status.className}`}>
                        {status.label}
                    </Badge>
                    {data.submission?.finalScore != null && data.maxPoints != null && (
                        <span className="sm:text-sm text-base font-semibold text-primary">
                            {data.submission.finalScore}/{data.maxPoints} pts
                        </span>
                    )}
                    {/* deadline warning */}
                    {isNotSubmitted && deadlineState !== "ok" && (
                        <span className={`text-xs font-medium flex items-center gap-1 ${deadlineState === "overdue" ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"}`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            {deadlineState === "overdue" ? "Overdue" : "Due soon"}
                        </span>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* left column */}
                <div className="lg:col-span-2 space-y-5">
                    {/* instructions */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
                        <Card>
                            <CardContent className="px-5 space-y-3">
                                <h3 className="text-base font-semibold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Instructions
                                </h3>
                                {data.instructions ? (
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {data.instructions}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No instructions provided.</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* submission */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
                        <Card>
                            <CardContent className="px-5 space-y-4">
                                <h3 className="text-base font-semibold flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-primary" /> Submission
                                </h3>

                                {/* current file */}
                                <AnimatePresence mode="popLayout">
                                    {data.submission?.currentFile ? (
                                        <motion.div key="current-file" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                            <VersionRow version={data.submission.currentFile} classId={classId} assignmentId={assignmentId} isCurrent />
                                        </motion.div>
                                    ) : (
                                        <motion.p key="no-file" className="text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            No document submitted yet.
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                {/* upload zone */}
                                <UploadZone classId={classId} assignmentId={assignmentId} isBlocked={isSubmissionBlocked} onUploaded={handleUploaded} />

                                {/* security note */}
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                                    <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        <span className="font-medium text-foreground">Secure upload:</span>{" "}
                                        Documents are encrypted in transit and at rest. Access is restricted to only you and your instructor.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* revision history */}
                    <AnimatePresence>
                        {(data.submission?.revisionHistory?.length ?? 0) > 0 && (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
                                <Card>
                                    <CardContent className="px-5 space-y-3">
                                        <h3 className="text-base font-semibold flex items-center gap-2">
                                            <History className="w-4 h-4 text-primary" /> Revision History
                                        </h3>
                                        <div className="space-y-3">
                                            {data.submission!.revisionHistory.map((v) => (
                                                <VersionRow key={v.id} version={v} classId={classId} assignmentId={assignmentId} />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* right column */}
                <div className="space-y-5">
                    {/* details */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
                        <Card>
                            <CardContent className="px-5 space-y-4">
                                <h3 className="text-base font-semibold flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary" /> Details
                                </h3>

                                <div className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground tracking-wide mb-0.5">Due Date</p>
                                        <p className={`text-sm ${
                                            isNotSubmitted && deadlineState === "overdue" ? "text-red-500 dark:text-red-400 font-medium" :
                                            isNotSubmitted && deadlineState === "soon"    ? "text-amber-500 dark:text-amber-400 font-medium" :
                                            "text-foreground"
                                        }`}>
                                            {formatDateTime(data.endDate)}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-start gap-3">
                                    <CloudUpload className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground tracking-wide mb-0.5">
                                            Late Submissions
                                        </p>
                                        <p className="text-sm text-foreground">
                                            {data.lateAllowed ? "Allowed" : "Not allowed"}
                                        </p>
                                    </div>
                                </div>

                                {data.maxPoints != null && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Award className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-0.5">Max Points</p>
                                                <p className="text-sm text-foreground">{data.maxPoints} points</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {data.submission?.finalScore != null && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-0.5">Final Grade</p>
                                                <p className="text-xl sm:text-lg font-bold text-primary">
                                                    {data.submission.finalScore}
                                                    <span className="text-sm font-normal text-muted-foreground"> / {data.maxPoints}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {data.submission?.comment && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">Lecturer Comment</p>
                                            <p className="text-sm text-foreground/80 leading-relaxed">{data.submission.comment}</p>
                                        </div>
                                    </>
                                )}

                                {data.rubric && data.rubric.length > 0 && (
                                    <>
                                        <Separator />
                                        <Button variant="outline" className="w-full gap-2 cursor-pointer" onClick={() => setRubricOpen(true)}>
                                            <FileText className="w-4 h-4" /> View Rubric
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* security */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
                        <Card className="border-primary/10">
                            <CardContent className="px-5 space-y-3">
                                <h3 className="text-base font-semibold flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-primary" /> Security
                                </h3>
                                {[
                                    { icon: Shield, text: "End-to-end encrypted upload" },
                                    { icon: Lock, text: "Role-based access control" },
                                    { icon: AlertCircle, text: "Tamper-proof submission log" },
                                    { icon: CheckCircle, text: "Encrypted storage at rest" },
                                ].map(({ icon: Icon, text }, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <Icon className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                        <span className="text-xs text-muted-foreground">{text}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            <RubricDialog open={rubricOpen} onOpenChange={setRubricOpen} title={data.title}rubric={data.rubric ?? []} totalPoints={data.maxPoints} />
        </div>
    );
}