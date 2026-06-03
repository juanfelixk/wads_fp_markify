"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Award, Sparkles, FileText, Loader2, Save, RotateCcw, AlertTriangle, ArrowBigRightDash, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchGradingPageData, fetchSubmissionFileUrlForGrading, submitGrade } from "@/services/lecturer/client";
import type { GradingPageData } from "@/services/lecturer/types";
import { statusConfig } from "@/services/assignments/constants";
import AnnotationSidebar from "@/components/feedback/annotation-card";
import GrammarCard from "@/components/feedback/grammar-card";
import StructureCard from "@/components/feedback/structure-card";
import type { SubmissionCriterionScore } from "@/generated/prisma";
import { GrammarFeedback, StructureFeedback } from "@/services/feedback/types";

// ssr:false prevents DOMMatrix / canvas errors on the server
const PdfViewerInner = dynamic(() => import("@/components/feedback/pdf-viewer-inner"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    )}
);

function AIScoreCard({ data }: { data: GradingPageData }) {
    const aiPct = data.maxPoints ? ((data.aiScore ?? 0) / data.maxPoints) * 100 : 0;

    return (
        <Card>
            <CardContent className="px-5 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Score
                </h3>
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Score</span>
                        {data.aiScore != null ? (
                            <span className="text-lg font-bold text-foreground">
                                {data.aiScore}
                                <span className="text-sm font-normal text-muted-foreground"> / {data.maxPoints ?? "—"}</span>
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">Analysing…</span>
                        )}
                    </div>
                    {data.aiScore != null && <Progress value={aiPct} className="h-1.5" />}
                </div>
                <p className="text-[11px] text-muted-foreground">
                    AI-generated estimate based on the rubric. Use as a reference for manual grading.
                </p>
            </CardContent>
        </Card>
    );
}

function CriterionScoresCard({ criterionScores, overrides, onOverrideChange, isPublished }: {
    criterionScores: SubmissionCriterionScore[];
    overrides: Record<string, string>;
    onOverrideChange: (criterionName: string, value: string) => void;
    isPublished: boolean;
}) {
    if (!criterionScores || criterionScores.length === 0) return null;

    const totals = criterionScores.reduce((acc, cs) => {
        const ov = overrides[cs.criterionName];
        const parsed = Number(ov);
        const isValid = ov !== undefined && ov !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= cs.pointsMax;
        const eff = isValid ? parsed : cs.pointsAwarded;
        acc.ai += cs.pointsAwarded;
        acc.eff += eff;
        acc.max += cs.pointsMax;

        if (isValid && parsed !== cs.pointsAwarded) acc.adjusted += 1;
            return acc;
    }, { ai: 0, eff: 0, max: 0, adjusted: 0 });
    const totalDelta = totals.eff - totals.ai;

    return (
        <Card>
            <CardContent className="space-y-4 px-5">
                <div className="text-base flex items-center justify-between gap-2 mb-6">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" /> Criterion Scores
                    </h3>
                    {totals.adjusted > 0 && (
                        <Badge variant="secondary" className="text-[11px] gap-1">
                            {totals.adjusted} overridden
                        </Badge>
                    )}
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground">AI total</span>
                        <span className="text-xs font-semibold tabular-nums">
                            {totals.ai}<span className="text-muted-foreground font-normal"> / {totals.max}</span>
                        </span>
                    </div>
                    <ArrowBigRightDash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-foreground/80 font-medium">Effective</span>
                        <span className="text-xs font-bold tabular-nums">
                            {totals.eff}<span className="text-muted-foreground font-normal"> / {totals.max}</span>
                        </span>
                        {totalDelta !== 0 && (
                        <span className={`text-xs font-semibold tabular-nums ${totalDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                            {totalDelta > 0 ? "+" : ""}
                            {totalDelta}
                        </span>
                        )}
                    </div>
                </div>

                <div className="text-xs text-muted-foreground leading-tight">
                    AI suggested scores per rubric criterion. Type to override or leave blank to keep the AI score.
                </div>

                <div className="space-y-4">
                    {criterionScores.map((cs) => {
                        const overrideVal = overrides[cs.criterionName] ?? "";
                        const isOverridden = overrideVal !== "";
                        const parsed = Number(overrideVal);
                        const effective = isOverridden && Number.isFinite(parsed) ? parsed : cs.pointsAwarded;
                        const aiPct = cs.pointsMax > 0 ? (cs.pointsAwarded / cs.pointsMax) * 100 : 0;
                        const effPct = cs.pointsMax > 0 ? (effective / cs.pointsMax) * 100 : 0;
                        const delta = effective - cs.pointsAwarded;
                        const invalid = isOverridden && (!Number.isFinite(parsed) || parsed < 0 || parsed > cs.pointsMax);

                        return (
                            <div key={cs.id} className={`rounded-lg border p-4 transition-colors ${isOverridden ? "border-primary/20 bg-primary/2" : "bg-card"}`}>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground leading-tight">
                                            {cs.criterionName}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2 mb-1 flex-wrap">
                                            <Badge variant="outline" className="text-[11px] gap-1 px-1.5 py-0 font-normal">
                                                <Sparkles className="w-2.5 h-2.5" /> AI {cs.pointsAwarded} / {cs.pointsMax}
                                            </Badge>
                                            {isOverridden && !invalid && delta !== 0 && (
                                                <Badge variant="outline" className={`text-[11px] gap-1 px-1.5 py-0 font-normal ${
                                                    delta > 0
                                                    ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                                                    : "border-destructive/40 text-destructive"
                                                }`}>
                                                    {delta > 0 ? "+" : ""}
                                                    {delta}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <Input type="number" min={0} max={cs.pointsMax} placeholder={String(cs.pointsAwarded)} value={overrideVal} onChange={(e) => onOverrideChange(cs.criterionName, e.target.value)} className={`h-10 w-12 text-sm text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                            invalid ? "border-destructive focus-visible:ring-destructive" : ""
                                        }`} aria-label={`Override score for ${cs.criterionName}`} disabled={isPublished} />
                                        <span className="text-sm text-muted-foreground tabular-nums">/ {cs.pointsMax}</span>
                                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => onOverrideChange(cs.criterionName, "")} disabled={!isOverridden || isPublished} title="Reset to AI score">
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 bg-muted-foreground/40" style={{ width: `${Math.min(100, Math.max(0, aiPct))}%` }} />
                                    {isOverridden && !invalid && (
                                        <div className={`absolute inset-y-0 left-0 ${ delta >= 0 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${Math.min(100, Math.max(0, effPct))}%` }} />
                                    )}
                                </div>
                                {invalid && (
                                    <p className="mt-1.5 text-[11px] text-destructive flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Must be between 0 and {cs.pointsMax}.
                                    </p>
                                )}
                                {cs.rationale && (
                                    <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                        {cs.rationale}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function FinalizeCard({ data, criterionScores, overrides, onSave, saving, isPublished }: {
    data: GradingPageData;
    criterionScores: SubmissionCriterionScore[];
    overrides: Record<string, string>;
    onSave: (score: number, comment: string) => void;
    saving: boolean;
    isPublished: boolean;
}) {
    // compute derived final score from criterion overrides
    const derivedScore = criterionScores.length > 0
        ? criterionScores.reduce((sum, cs) => {
            const ov = overrides[cs.criterionName];
            const parsed = Number(ov);
            const isValid = ov !== undefined && ov !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= cs.pointsMax;
            return sum + (isValid ? parsed : cs.pointsAwarded);
        }, 0)
        : (data.aiScore ?? 0);

    const [finalComment, setFinalComment] = useState(data.comment ?? "");
    const derivedPct = data.maxPoints ? (derivedScore / data.maxPoints) * 100 : 0;

    const hasInvalidOverride = criterionScores.some((cs) => {
        const ov = overrides[cs.criterionName];
        if (ov === undefined || ov === "") return false;
        const parsed = Number(ov);
        return !Number.isFinite(parsed) || parsed < 0 || parsed > cs.pointsMax;
    });

    const handleSave = () => {
        if (hasInvalidOverride) {
            toast.error("Fix out-of-range criterion scores before saving.");
            return;
        }
        onSave(derivedScore, finalComment);
    };

    return (
        <Card>
            <CardContent className="space-y-4 px-5">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Finalize Grade
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Final Score</span>
                        <span className="text-lg font-bold text-foreground">
                            {derivedScore}
                            <span className="text-sm font-normal text-muted-foreground"> / {data.maxPoints ?? "—"}</span>
                        </span>
                    </div>
                    <Progress value={derivedPct} className="h-1.5" />
                    {criterionScores.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Automatically derived from criterion scores above.
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                        Comment to Student
                    </label>
                    <Textarea value={finalComment} onChange={(e) => setFinalComment(e.target.value)} rows={5} placeholder="Write feedback the student will see..." className="text-sm" disabled={saving || isPublished} />
                </div>

                <Button onClick={handleSave} className="w-full gap-2 mt-4 cursor-pointer" disabled={saving || hasInvalidOverride || isPublished}>
                    {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : isPublished ? (
                        <><Lock className="w-4 h-4" /> Grade Published</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Grade</>
                    )}
                </Button>

                {isPublished ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 shrink-0" />
                        Grades have been published. Editing is no longer possible.
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Saved grades can be edited at any time prior to publishing. Grades and comments are only visible to students after you publish them from the submissions page.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function GradingStudioPage() {
    const { classId, assignmentId, submissionId } = useParams<{
        classId: string;
        assignmentId: string;
        submissionId: string;
    }>();
    const router = useRouter();
    const [data, setData] = useState<GradingPageData | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // criterion overrides: criterionName -> string value (empty = use AI)
    const [overrides, setOverrides] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [finalized, setFinalized] = useState(false);

    const status = data ? statusConfig[data.status] : null;
    const isPublished = !!data?.gradesPublishedAt;

    useEffect(() => {
        async function load() {
            try {
                const [pageData, url] = await Promise.all([
                    fetchGradingPageData(classId, assignmentId, submissionId),
                    fetchSubmissionFileUrlForGrading(classId, assignmentId, submissionId),
                ]);
                setData(pageData);
                setFileUrl(url);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [classId, assignmentId, submissionId]);

    useEffect(() => {
        if (!activeAnnotation || !data) return;
        const ann = data.annotations.find((a) => a.id === activeAnnotation);
        if (!ann) return;
        pageRefs.current.get(ann.page)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [activeAnnotation, data]);

    function handleOverrideChange(criterionName: string, value: string) {
        setOverrides((prev) => ({ ...prev, [criterionName]: value }));
    }

    async function handleSave(finalScore: number, comment: string) {
        if (!data) return;
        setSaving(true);
        try {
            const criterionOverrides = (data.criterionScores ?? []).map((cs) => ({
                criterionName: cs.criterionName,
                pointsAwarded: overrides[cs.criterionName] !== "" && overrides[cs.criterionName] !== undefined
                    ? Number(overrides[cs.criterionName])
                    : cs.pointsAwarded,
            }));

            await submitGrade(classId, assignmentId, submissionId, {
                finalScore,
                comment,
                criterionOverrides,
            });
            setData((prev) => prev ? { ...prev, status: "GRADE_SAVED" } : prev);
            toast.success(`Score of ${finalScore}/${data.maxPoints} saved. Publish from the submissions page to release all scores to all students.`);
            router.push(`/dashboard/lecturer/class/${classId}/assignment/${assignmentId}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save grade.")
        } finally {
            setSaving(false);
        }
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-8.3rem)] bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">{error}</p>
                    <Link href={`/dashboard/lecturer/class/${classId}/assignment/${assignmentId}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer">
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Assignment
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* top bar */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="top-0 z-30 bg-card/95 backdrop-blur border-b">
                <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between max-w-7xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0" asChild>
                            <Link href={`/dashboard/lecturer/class/${classId}/assignment/${assignmentId}`}>
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Link>
                        </Button>
                        <Separator orientation="vertical" className="h-5" />
                        <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                            {loading ? <Skeleton className="h-4 w-48" /> : (
                                <>
                                <span className="font-medium text-foreground">{data?.courseCode}</span>
                                <ChevronRight className="w-3 h-3 shrink-0" />
                                <span className="font-medium text-foreground">{data?.assignmentTitle}</span>
                                <ChevronRight className="w-3 h-3 shrink-0" />
                                <span className="text-foreground font-medium shrink-0">{data?.studentName}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {status && !loading && (
                        <Badge variant="outline" className={`text-xs font-medium px-2.5 py-1 shrink-0 ${status.className}`}>
                        {status.label}
                        </Badge>
                    )}
                </div>
            </motion.div>

            {/* main */}
            <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* left: PDF viewer */}
                    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="lg:col-span-3">
                        <Card className="sticky top-20 overflow-hidden">
                            <h3 className="text-base font-semibold flex items-center gap-2 px-5">
                                <FileText className="w-4 h-4 text-primary" />
                                {loading ? <Skeleton className="h-4 w-40" /> : <span>{data?.fileName ?? "Submitted Document"}</span>}
                            </h3>

                            {loading && (
                                <div className="p-6 space-y-3">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                                </div>
                            )}

                            {!loading && fileUrl && data && (() => {
                                return (
                                    <PdfViewerInner fileUrl={fileUrl} annotations={data.annotations} activeAnnotation={activeAnnotation} onAnnotationClick={setActiveAnnotation} onPageRefsReady={(refs) => { pageRefs.current = refs; }} />
                                );
                            })()}
                        </Card>
                    </motion.div>

                    {/* right: grading cards */}
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="lg:col-span-2 space-y-5">
                        {loading ? (
                            <>
                                <Skeleton className="h-40 w-full rounded-xl" />
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                            </>
                        ) : data ? (
                            <>
                                <AIScoreCard data={data} />
                                <AnnotationSidebar annotations={data.annotations} activeId={activeAnnotation} onSelect={setActiveAnnotation} status={data.status} />
                                <GrammarCard grammar={data.aiGrammarFeedback as GrammarFeedback | null} status={data.status} />
                                <StructureCard structure={data.aiStructureFeedback as StructureFeedback | null} status={data.status} />
                                {data.criterionScores && data.criterionScores.length > 0 && (
                                    <CriterionScoresCard criterionScores={data.criterionScores} overrides={overrides} onOverrideChange={handleOverrideChange} isPublished={isPublished} />
                                )}
                                <FinalizeCard data={data} criterionScores={data.criterionScores ?? []} overrides={overrides} onSave={handleSave} saving={saving} isPublished={isPublished} />
                            </>
                        ) : null}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}