"use client";

import { Annotation } from "@/services/feedback/types";
import { Card, CardContent } from "../ui/card";
import { annotationStyle } from "@/services/feedback/constants";
import { AlertCircle, Check, Loader2, PencilLine } from "lucide-react";

export default function AnnotationSidebar({ annotations, activeId, onSelect, aiTimedOut, status }: { annotations: Annotation[]; activeId: string | null; onSelect: (id: string | null) => void; aiTimedOut?: boolean; status: string; }) {
    if (!annotations || annotations.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="px-5 space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                        <PencilLine className="w-4 h-4 text-primary" /> Inline Annotations
                    </h3>
                    {aiTimedOut ? (
                        <p className="text-sm italic flex items-center gap-2 text-amber-500">
                            <AlertCircle className="w-3.5 h-3.5" /> AI currently unavailable, please try again later.
                        </p>
                    ) : status === "TO_BE_REVIEWED" ? (
                        <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                            <Check className="w-3.5 h-3.5" /> No issue found.
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysis in progress…
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    };
    const counts = {
        PRAISE: annotations.filter((a) => a.type === "PRAISE").length,
        ISSUE: annotations.filter((a) => a.type === "ISSUE").length,
        SUGGESTION: annotations.filter((a) => a.type === "SUGGESTION").length,
    };
    return (
        <Card>
            <CardContent className="px-5 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <PencilLine className="w-4 h-4 text-primary" /> Inline Annotations
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(["PRAISE", "ISSUE", "SUGGESTION"] as const).map((t) => {
                        const s = annotationStyle[t];
                        return counts[t] > 0 ? (
                        <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.border} ${s.text}`}>
                            {counts[t]} {s.label}
                        </span>
                        ) : null;
                    })}
                </div>

                <div className="space-y-0.5!">
                    {annotations.map((ann) => {
                        const s = annotationStyle[ann.type];
                        const Icon = s.icon;
                        const isActive = activeId === ann.id;
                        return (
                            <button key={ann.id} onClick={() => onSelect(isActive ? null : ann.id)} className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${isActive ? `${s.bg} ${s.border}` : "hover:bg-muted border-transparent"}`}>
                                <div className="flex items-start gap-2">
                                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${s.text}`} />
                                    <div className="min-w-0">
                                        <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${s.text}`}>{s.label} (page {ann.page})</p>
                                        {ann.quote && <p className="text-[11px] text-muted-foreground italic line-clamp-1 mb-0.5">"{ann.quote}"</p>}
                                        <p className="text-xs text-foreground/80 line-clamp-2">{ann.content}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}