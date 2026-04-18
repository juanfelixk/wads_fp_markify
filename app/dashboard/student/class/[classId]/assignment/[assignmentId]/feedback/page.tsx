"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Award, MessageSquare, Sparkles, AlertCircle, Clock, FileText, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSubmissionFileUrl } from "@/services/submissions/client";
import { fetchFeedbackPageData } from "@/services/feedback/client";
import type { FeedbackPageData } from "@/services/feedback/types";
import { statusConfig } from "@/services/assignments/constants";
import { annotationStyle } from "@/services/feedback/constants";
import { GrammarFeedback, StructureFeedback } from "@/services/feedback/types";
import RubricDialog from "@/components/feedback/rubric-dialog";
import AnnotationSidebar from "@/components/feedback/annotation-card";
import GrammarCard from "@/components/feedback/grammar-card";
import StructureCard from "@/components/feedback/structure-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ssr:false prevents DOMMatrix / canvas errors on the server
const PdfViewerInner = dynamic(() => import("@/components/feedback/pdf-viewer-inner"), {
    ssr: false,
    loading: () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
    )}
);

function IrrelevantBanner({ assignmentId, classId }: { assignmentId: string; classId: string }) {
    return (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="px-5 space-y-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                        <h3 className="text-base font-semibold text-destructive">
                            Irrelevant Submission Detected
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your submission does not appear to match the instructions for this assignment. No score has been calculated. Please upload the correct document to receive AI-generated feedback and grading.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                            If you think that this is an error, please contact your lecturer.
                        </p>
                    </div>
                </div>
                <Button variant="destructive" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/student/class/${classId}/assignment/${assignmentId}`}>
                        Submit the correct document
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function ScoresCard({ data, aiTimedOut }: { data: FeedbackPageData, aiTimedOut?: boolean }) {
    const aiPct = data.maxPoints ? ((data.aiScore ?? 0) / data.maxPoints) * 100 : 0;
    const finalPct = data.maxPoints && data.finalScore != null ? (data.finalScore / data.maxPoints) * 100 : null;
    const [rubricOpen, setRubricOpen] = useState(false);
    return (
        <Card>
            <CardContent className="px-5 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Scores
                </h3>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-muted-foreground tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> AI Score
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3 h-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs">
                                        This AI-generated score is an estimate based on the rubric and may be inaccurate. It does not represent your final grade. Use this for revision purposes only.
                                    </TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                        </span>
                        {data.aiScore != null
                        ? <span className="text-sm font-semibold tabular-nums">{data.aiScore}<span className="text-muted-foreground font-normal"> / {data.maxPoints ?? "—"}</span></span>
                        : aiTimedOut
                            ? <span className="text-xs text-amber-500 italic flex items-center gap-1"><AlertCircle className="w-3 h-3" /> AI currently unavailable, please try again later.</span>
                            : <span className="text-xs text-muted-foreground italic">Analysing…</span>
                        }
                    </div>
                    {data.aiScore != null ? <Progress value={aiPct} className="h-1.5" /> : <Skeleton className="h-1.5 w-full rounded-full" />}
                    <p className="text-xs text-muted-foreground mt-1.5">AI-generated estimate. Final grading is determined by your instructor.</p>
                </div>
                <Separator />
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-primary tracking-wide">Final Score</span>
                        {finalPct != null
                        ? <span className="text-lg font-bold text-primary tabular-nums">{data.finalScore}<span className="text-sm font-normal text-muted-foreground"> / {data.maxPoints}</span></span>
                        : <span className="text-xs text-muted-foreground italic flex items-center gap-1"><Clock className="w-3 h-3" /> Pending review</span>
                        }
                    </div>
                    {finalPct != null && <Progress value={finalPct} className="h-1.5" />}
                    <p className="text-xs text-muted-foreground mt-1.5">Finalised by your instructor after manual review.</p>
                </div>
                {data.rubric && data.rubric.length > 0 && (
                    <>
                        <Button variant="outline" className="w-full gap-2 cursor-pointer" onClick={() => setRubricOpen(true)}>
                            <FileText className="w-4 h-4" /> View Rubric
                        </Button>
                    </>
                )}
            </CardContent>
            <RubricDialog open={rubricOpen} onOpenChange={setRubricOpen} title={data.assignmentTitle} rubric={data.rubric ?? []} totalPoints={data.maxPoints} scores={data.criterionScores} status={data.status} role={data.role} />
        </Card>
        
    );
}

function InstructorCommentCard({ comment }: { comment: string | null }) {
  if (!comment) {
    return (
        <Card className="border-dashed">
            <CardContent className="px-5 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Lecturer's Comment
                </h3>
            <p className="text-sm text-muted-foreground italic">No comment yet, check back after grading.</p>
            </CardContent>
        </Card>
    );
  }
  return (
    <Card>
        <CardContent className="px-5 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Instructor Comment
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{comment}</p>
        </CardContent>
    </Card>
  );
}

// timeout when all models fail
const POLL_INTERVAL_MS = 5000; // check every 5s
const POLL_TIMEOUT_MS  = 120_000; // give up after 2 minutes

export default function FeedbackStudioPage() {
    const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
    const [data, setData] = useState<FeedbackPageData | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const pollTimer  = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [aiTimedOut, setAiTimedOut] = useState(false);

    function clearTimers() {
        if (pollTimer.current) clearInterval(pollTimer.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    useEffect(() => {
        async function initialLoad() {
            try {
                const [pageData, url] = await Promise.all([
                    fetchFeedbackPageData(classId, assignmentId),
                    fetchSubmissionFileUrl(classId, assignmentId),
                ]);
                setData(pageData);
                setFileUrl(url);
                setLoading(false);

                // if AI result already answers, no need to poll
                if (pageData.aiScore !== null || pageData.isIrrelevant) {
                    return;
                }

                // compute how much time remaining before timeout
                const submittedAt = pageData.submittedAt ? new Date(pageData.submittedAt).getTime() : Date.now();
                const elapsed     = Date.now() - submittedAt;
                const remaining   = POLL_TIMEOUT_MS - elapsed;

                if (remaining <= 0) {
                    setAiTimedOut(true);
                    return;
                }

                // set timeout for only the remaining window
                timeoutRef.current = setTimeout(() => {
                    clearTimers();
                    setAiTimedOut(true);
                }, remaining);

                pollTimer.current = setInterval(async () => {
                    try {
                        const polled = await fetchFeedbackPageData(classId, assignmentId);
                        setData(polled);
                        if (polled.aiScore !== null || polled.isIrrelevant) {
                            clearTimers();
                        }
                    } catch {
                        // silently ignore
                    }
                }, POLL_INTERVAL_MS);
                } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load feedback.");
                setLoading(false);
            }
        }
        initialLoad();
        return () => clearTimers();
    }, [classId, assignmentId]);

    useEffect(() => {
        if (!activeAnnotation || !data) return;
        const ann = data.annotations.find((a) => a.id === activeAnnotation);
        if (!ann) return;
        pageRefs.current.get(ann.page)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [activeAnnotation, data]);

    if (error) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                <h1 className="text-xl font-semibold">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/student/class/${classId}/assignment/${assignmentId}`}>
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Assignment
                    </Link>
                </Button>
            </div>
        </div>
        );
    }

    const status = data ? statusConfig[data.status] : null;

    return (
        <div className="min-h-screen bg-background">
            {/* top bar */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="top-0 z-30 bg-card/95 backdrop-blur border-b">
                <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between max-w-7xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0" asChild>
                            <Link href={`/dashboard/student/class/${classId}/assignment/${assignmentId}`}>
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
                                <span className="text-foreground font-medium shrink-0">Feedback Studio</span>
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

                            {/* PdfViewerInner is loaded only in the browser */}
                            {!loading && fileUrl && (
                                <PdfViewerInner fileUrl={fileUrl} annotations={data?.annotations ?? []} activeAnnotation={activeAnnotation} onAnnotationClick={setActiveAnnotation} onPageRefsReady={(refs) => { pageRefs.current = refs; }} />
                            )}

                            {/* annotation callout */}
                            <AnimatePresence>
                                {activeAnnotation && data && (() => {
                                    const ann = data.annotations.find((a) => a.id === activeAnnotation);
                                    if (!ann) return null;
                                    const s = annotationStyle[ann.type];
                                    const Icon = s.icon;
                                    return (
                                        <motion.div key={activeAnnotation} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className={`m-3 p-3 rounded-lg border ${s.bg} ${s.border}`}>
                                            <div className="flex items-start gap-2">
                                                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.text}`} />
                                                <div>
                                                    <p className={`text-xs font-semibold mb-0.5 ${s.text}`}>{s.label}</p>
                                                    {ann.quote && <p className="text-[11px] text-muted-foreground italic mb-1">"{ann.quote}"</p>}
                                                    <p className="text-sm text-foreground/80">{ann.content}</p>
                                                </div>
                                                <button onClick={() => setActiveAnnotation(null)} className="ml-auto text-muted-foreground hover:text-foreground text-xs shrink-0">✕</button>
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                        </Card>
                    </motion.div>

                    {/* right: feedback cards */}
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="lg:col-span-2 space-y-4">
                        {loading ? (
                        <>
                            <Skeleton className="h-40 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <Skeleton className="h-48 w-full rounded-xl" />
                        </>
                        ) : data ? (
                        <>
                            {data.isIrrelevant ? (
                                <IrrelevantBanner assignmentId={assignmentId} classId={classId} />
                            ) : (
                                <>
                                    <ScoresCard data={data} aiTimedOut={aiTimedOut} />
                                    <InstructorCommentCard comment={data.comment} />
                                    <AnnotationSidebar annotations={data.aiScore != null ? data.annotations : []} activeId={activeAnnotation} onSelect={setActiveAnnotation} aiTimedOut={aiTimedOut} />
                                    <GrammarCard grammar={data.aiGrammarFeedback as GrammarFeedback | null} aiTimedOut={aiTimedOut} />
                                    <StructureCard structure={data.aiStructureFeedback as StructureFeedback | null} aiTimedOut={aiTimedOut} />
                                </>
                            )}
                        </>
                        ) : null}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}