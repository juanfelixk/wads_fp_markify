"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RubricCriterion } from "@/services/assignments/types";
import { SubmissionCriterionScore } from "@/generated/prisma";

interface RubricDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    rubric: RubricCriterion[];
    totalPoints: number | null;
    scores?: SubmissionCriterionScore[] | null;
    status?: string | null;
    role: string;
}

export default function RubricDialog({ open, onOpenChange, title, rubric, totalPoints, scores, status, role }: RubricDialogProps) {
    if (!rubric || rubric.length === 0) return null;

    const visible = (role === "LECTURER") || (status === "GRADED");

    function getScore(name: string) {
        return scores?.find((s) => s.criterionName === name);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Grading Rubric</DialogTitle>
                    <DialogDescription>{title}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-3 mt-2">
                        {rubric.map((criterion, idx) => {
                            const score = getScore(criterion.name);

                            return (
                                <div key={idx} className="grid grid-cols-[1fr_auto] gap-3 items-stretch">
                                    {/* LEFT: rubric content */}
                                    <div className="p-4 rounded-lg border bg-muted/30">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="sm:text-sm text-base font-semibold text-foreground">
                                            {criterion.name}
                                            </p>
                                            <Badge variant="secondary" className="text-sm">
                                            {criterion.maxPoints} pts ({criterion.weight}%)
                                            </Badge>
                                        </div>

                                        <p className="sm:text-xs text-sm text-muted-foreground leading-relaxed">
                                            {criterion.description}
                                        </p>
                                    </div>

                                    {/* RIGHT: score box */}
                                        <div className="flex items-center justify-center min-w-[70px] px-3 rounded-lg border bg-background">
                                        {score && visible ? (
                                            <span className="text-base font-bold text-primary tabular-nums">
                                            {score.pointsAwarded}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPoints != null && visible ? (
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="sm:text-sm text-base font-semibold text-foreground">
                            Total
                            </span>
                            <span className="text-base font-bold text-primary tabular-nums">
                            {(scores?.reduce((sum, s) => sum + s.pointsAwarded, 0) ?? "-")} / {totalPoints}
                            </span>
                        </div>
                        ) : (
                            <div className="text-xs text-muted-foreground text-right italic">
                                Pending lecturer review...
                            </div>
                        )}
                </div>
            </DialogContent>
        </Dialog>
    );
}