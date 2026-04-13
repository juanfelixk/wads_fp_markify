"use client";

import { StructureFeedback } from "@/services/feedback/types";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Loader2, ChevronUp, ChevronDown, AlignLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StructureCardProps {
    structure: StructureFeedback | null
}

export default function StructureCard({ structure }: StructureCardProps) {
    const [open, setOpen] = useState(true);
    if (!structure) {
        return (
        <Card className="border-dashed">
            <CardContent className="px-5 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-primary" /> Essay Structure
                </h3>
                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysis in progress…
                </p>
            </CardContent>
        </Card>
        );
    }
    const total = structure.sections.reduce((s, e) => s + e.score, 0);
    const max = structure.sections.reduce((s, e) => s + e.maxScore, 0);
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl select-none">
                        <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-primary" /> Essay Structure
                                <span className="text-xs font-normal text-muted-foreground">{total}/{max}</span>
                            </span>
                            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                        {structure.overview && <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2.5 italic">{structure.overview}</p>}
                        {structure.sections.map((section, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{section.name}</span>
                                <span className="text-xs font-semibold tabular-nums">{section.score}<span className="text-muted-foreground font-normal">/{section.maxScore}</span></span>
                            </div>
                            <Progress value={(section.score / section.maxScore) * 100} className="h-1.5" />
                            <p className="text-[11px] text-muted-foreground">{section.feedback}</p>
                        </div>
                        ))}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}