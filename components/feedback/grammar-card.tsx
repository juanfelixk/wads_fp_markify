"use client";

import { GrammarFeedback } from "@/services/feedback/types";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Type, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";

interface GrammarCardProps {
  grammar: GrammarFeedback | null;
}

export default function GrammarCard({ grammar }: GrammarCardProps) {
    const [open, setOpen] = useState(true);
    if (!grammar) {
        return (
        <Card className="border-dashed">
            <CardContent className="px-5 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" /> Grammar & Style
                </h3>
                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysis in progress…
                </p>
            </CardContent>
        </Card>
        );
    }
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl select-none">
                        <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-primary" /> Grammar & Style
                            <Badge variant="secondary" className="text-[10px]">{grammar.issues.length}</Badge>
                        </span>
                        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-3 pt-0">
                        {grammar.summary && <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2.5 italic">{grammar.summary}</p>}
                        {grammar.issues.map((issue, i) => (
                            <div key={i} className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{issue.type}</Badge>
                                    <span className={`text-[10px] font-bold uppercase ${issue.severity === "high" ? "text-red-500" : issue.severity === "medium" ? "text-amber-500" : "text-muted-foreground"}`}>{issue.severity}</span>
                                </div>
                                {issue.original && <p className="line-through text-muted-foreground">{issue.original}</p>}
                                {issue.suggestion && <p className="text-primary font-medium">→ {issue.suggestion}</p>}
                                <p className="text-muted-foreground">{issue.explanation}</p>
                            </div>
                        ))}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}