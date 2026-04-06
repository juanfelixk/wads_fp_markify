"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RubricCriterion } from "@/modules/assignments/types";

interface RubricDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    rubric: RubricCriterion[];
    totalPoints: number | null;
}

export default function RubricDialog({ open, onOpenChange, title, rubric, totalPoints }: RubricDialogProps) {
    if (!rubric || rubric.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Grading Rubric</DialogTitle>
                    <DialogDescription>{title}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                    {rubric.map((criterion, idx) => (
                        <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center justify-between mb-1.5">
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
                    ))}

                    {totalPoints != null && (
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="sm:text-sm text-base font-semibold text-foreground">
                                Total
                            </span>
                            <span className="sm:text-sm text-base font-bold text-primary">
                                {totalPoints} points
                            </span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}