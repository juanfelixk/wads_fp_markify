"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, ListChecks, Plus, Trash2, GripVertical, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createAssignment, fetchAssignment, updateAssignment } from "@/services/assignments/client";
import type { RubricCriterion } from "@/services/assignments/types";
import { useSearchParams } from "next/navigation";

interface RubricModalProps {
    open: boolean;
    onClose: () => void;
    criteria: RubricCriterion[];
    onChange: (criteria: RubricCriterion[]) => void;
}

function emptycriterion(): RubricCriterion {
    return { name: "", description: "", maxPoints: 10, weight: 0 };
}

function RubricModal({ open, onClose, criteria, onChange }: RubricModalProps) {
    const [draft, setDraft] = useState<RubricCriterion[]>(
        criteria.length > 0 ? criteria : [emptycriterion()]
    );

    // keep draft in sync when modal reopens with existing data
    const handleOpen = (isOpen: boolean) => {
        if (isOpen) setDraft(criteria.length > 0 ? criteria : [emptycriterion()]);
    };

    const update = (i: number, field: keyof RubricCriterion, value: string | number) => {
        setDraft((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
    };

    const add = () => setDraft((prev) => [...prev, emptycriterion()]);

    const remove = (i: number) => {
        if (draft.length === 1) return;
        setDraft((prev) => prev.filter((_, idx) => idx !== i));
    };

    const totalWeight = draft.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    const weightOk = Math.round(totalWeight) === 100;

    const handleSave = () => {
        for (const c of draft) {
            if (!c.name.trim()) { toast.error("Each criterion must have a name."); return; }
            if (!c.description.trim()) { toast.error("Each criterion must have a description."); return; }
            if (Number(c.maxPoints) <= 0) { toast.error("Max points must be positive for each criterion."); return; }
            if (Number(c.weight) <= 0) { toast.error("Weight must be positive for each criterion."); return; }
        }
        if (!weightOk) { toast.error("Weights must sum to exactly 100%."); return; }
        onChange(draft.map((c) => ({
            name: c.name.trim(),
            description: c.description.trim(),
            maxPoints: Number(c.maxPoints),
            weight: Number(c.weight),
        })));
        onClose();
    };

    const handleClear = () => {
        setDraft([emptycriterion()]);
        onChange([]);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { handleOpen(o); if (!o) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Configure Rubric</DialogTitle>
                    <DialogDescription>
                        Add rubric criteria with names, descriptions, max points, and percentage weights. Weights must sum up to 100%.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                    <AnimatePresence initial={false}>
                        {draft.map((criterion, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <GripVertical className="w-3.5 h-3.5" />
                                        Criterion {i + 1}
                                    </div>
                                    <button type="button" onClick={() => remove(i)} disabled={draft.length === 1} className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-foreground select-none">
                                            Name <span className="text-destructive">*</span>
                                        </label>
                                        <Input placeholder="e.g. Argumentation" value={criterion.name} onChange={(e) => update(i, "name", e.target.value)} className="h-8 text-sm" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-foreground select-none">
                                                Max Pts <span className="text-destructive">*</span>
                                            </label>
                                            <Input type="number" min={1} placeholder="10" value={criterion.maxPoints} onChange={(e) => update(i, "maxPoints", e.target.value)} className="h-8 text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-foreground select-none">
                                                Weight % <span className="text-destructive">*</span>
                                            </label>
                                            <Input type="number" min={1} max={100} placeholder="25" value={criterion.weight} onChange={(e) => update(i, "weight", e.target.value)} className="h-8 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-foreground select-none">
                                        Description <span className="text-destructive">*</span>
                                    </label>
                                    <Textarea placeholder="What will be assessed for this criterion..." value={criterion.description} onChange={(e) => update(i, "description", e.target.value)} rows={2} className="resize-none text-sm" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button type="button" onClick={add} className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                        Add criterion
                    </button>
                </div>

                {/* weight total indicator */}
                <div className={[
                    "flex items-center gap-2 px-3 py-2 rounded-md text-xs border",
                    weightOk
                        ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-400"
                        : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400",
                ].join(" ")}>
                    {!weightOk && <TriangleAlert className="w-3.5 h-3.5 shrink-0" />}
                    Total weight: <span className="font-semibold">{totalWeight}%</span>
                    <span className="italic">
                        {weightOk ? "" : "must be equal to 100%"}
                    </span>
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground cursor-pointer" onClick={handleClear}>
                        Clear rubric
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!weightOk} className="cursor-pointer">
                        Save Rubric
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function CreateAssignmentPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    const [title, setTitle] = useState("");
    const [instructions, setInstructions] = useState("");
    const [maxPoints, setMaxPoints] = useState("");
    const [lateAllowed, setLateAllowed] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rubric, setRubric] = useState<RubricCriterion[]>([]);
    const [rubricOpen, setRubricOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // check edit or create new
    const searchParams = useSearchParams();
    const assignmentId = searchParams.get("assignmentId");
    const isEditing = !!assignmentId;

    useEffect(() => {
        if (!assignmentId) return;
        setLoading(true);
        fetchAssignment(classId, assignmentId)
            .then((data) => {
                setTitle(data.title);
                setInstructions(data.instructions);
                setMaxPoints(String(data.maxPoints));
                setLateAllowed(data.lateAllowed);
                setStartDate(data.startDate);
                setEndDate(data.endDate);
                setRubric(data.rubric);
            })
            .catch((err) => toast.error(err.message))
            .finally(() => setLoading(false));
    }, [assignmentId]);

    const validate = (): string | null => {
        if (!title.trim()) return "Assignment title is required.";
        if (!instructions) return "Instructions is required."
        if (!startDate) return "Start date is required.";
        if (!endDate) return "End date is required.";
        if (!maxPoints) return "Max points is required.";
        if (rubric.length === 0) return "Rubric is required.";
        if (new Date(endDate) <= new Date(startDate)) return "End date must be after start date.";
        if (maxPoints && (isNaN(Number(maxPoints)) || Number(maxPoints) <= 0)) return "Max points must be a positive number.";
        return null;
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) { toast.error(err); return; }

        try {
            setLoading(true);
            if (isEditing) {
                await updateAssignment(classId, assignmentId!, {
                    title: title.trim(),
                    instructions: instructions.trim(),
                    maxPoints: Number(maxPoints),
                    lateAllowed,
                    startDate,
                    endDate,
                    rubric,
                })
            } else {
                await createAssignment(classId, {
                    title: title.trim(),
                    instructions: instructions.trim(),
                    maxPoints: Number(maxPoints),
                    lateAllowed,
                    startDate,
                    endDate,
                    rubric,
                });
            }
            toast.success(isEditing ? "Assignment updated." : "Assignment created successfully.");
            router.push(`/dashboard/lecturer/class/${classId}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = title.trim() && startDate && endDate && !loading && instructions && maxPoints && rubric.length !== 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8.3rem)] px-4 py-8 mb-10">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-lg space-y-4">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
                    <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground mb-4" onClick={() => router.push(`/dashboard/lecturer/class/${classId}`)}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Class
                    </Button>
                    <h1 className="text-2xl font-semibold tracking-tight mb-1">
                        {isEditing ? "Edit Assignment" : "Create a new assignment"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isEditing ? "Update any fields to edit this assignment." : "Set the title, instructions, dates, max points, and rubric for your students."}
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="border border-border rounded-lg p-6 space-y-4 bg-card">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Assignment Title <span className="text-destructive">*</span>
                        </label>
                        <Input type="text" placeholder="e.g. Final Project" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} className="h-10" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Instructions <span className="text-destructive">*</span>
                        </label>
                        <Textarea placeholder="Describe what students need to submit..." value={instructions} onChange={(e) => setInstructions(e.target.value)} disabled={loading} rows={4} className="resize-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">
                                Start Date & Time <span className="text-destructive">*</span>
                            </label>
                            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} className="h-10" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">
                                Due Date & Time <span className="text-destructive">*</span>
                            </label>
                            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} className="h-10"  />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Max Points <span className="text-destructive">*</span>
                        </label>
                        <Input type="number" placeholder="e.g. 100" min={1} value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} disabled={loading} className="h-10" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">
                            Rubric <span className="text-destructive">*</span>
                        </label>
                        <button type="button" onClick={() => setRubricOpen(true)} disabled={loading}
                            className={[
                                "flex items-center justify-between w-full rounded-md border px-3 h-10 text-sm transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                rubric.length > 0
                                    ? "border-primary/40 bg-primary/5 text-foreground"
                                    : "border-input bg-background text-muted-foreground hover:bg-accent/40",
                                loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                            ].join(" ")}>
                            <span className="flex items-center gap-2">
                                <ListChecks className="w-4 h-4 shrink-0" />
                                {rubric.length > 0
                                    ? `${rubric.length} criteri${rubric.length > 1 ? "a" : "on"} configured`
                                    : "Configure rubric…"}
                            </span>
                            {rubric.length > 0 && (
                                <span className="text-xs text-primary font-medium">Edit</span>
                            )}
                        </button>

                        {/* rubric summary */}
                        {rubric.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {rubric.map((c, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                                        {c.name} <span className="opacity-60">· {c.weight}%</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* late allowed */}
                    <div className="flex items-center gap-3 py-1">
                        <button type="button" role="switch" aria-checked={lateAllowed} onClick={() => !loading && setLateAllowed((v) => !v)} disabled={loading}
                            className={[
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                lateAllowed ? "bg-primary" : "bg-input",
                                loading ? "opacity-50 cursor-not-allowed" : "",
                            ].join(" ")}>
                            <span className={[
                                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
                                lateAllowed ? "translate-x-4" : "translate-x-0",
                            ].join(" ")} />
                        </button>
                        <div>
                            <p className="text-sm font-medium text-foreground select-none">
                                Allow late submissions
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Students can still submit after the due date.
                            </p>
                        </div>
                    </div>

                    <Button className="w-full h-10 cursor-pointer" onClick={handleSubmit} disabled={!canSubmit}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                (isEditing ? "Saving..." : "Creating...")
                            </>
                        ) : (isEditing ? "Save Changes" : "Create Assignment")}
                    </Button>
                </motion.div>
            </motion.div>

            <RubricModal open={rubricOpen} onClose={() => setRubricOpen(false)} criteria={rubric} onChange={setRubric} />
        </div>
    );
}