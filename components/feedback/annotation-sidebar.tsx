"use client";

import { Annotation } from "@/modules/feedback/types";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { annotationStyle } from "@/modules/feedback/constants";

export default function AnnotationSidebar({ annotations, activeId, onSelect }: {
    annotations: Annotation[];
    activeId: string | null;
    onSelect: (id: string | null) => void;
    }) {
    if (annotations.length === 0) return null;
    const counts = {
        PRAISE: annotations.filter((a) => a.type === "PRAISE").length,
        ISSUE: annotations.filter((a) => a.type === "ISSUE").length,
        SUGGESTION: annotations.filter((a) => a.type === "SUGGESTION").length,
    };
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Inline Annotations</CardTitle>
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
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
                {annotations.map((ann) => {
                const s = annotationStyle[ann.type];
                const Icon = s.icon;
                const isActive = activeId === ann.id;
                return (
                    <button key={ann.id} onClick={() => onSelect(isActive ? null : ann.id)} className={`w-full text-left p-2.5 rounded-lg border transition-all ${isActive ? `${s.bg} ${s.border}` : "hover:bg-muted/50 border-transparent"}`}>
                        <div className="flex items-start gap-2">
                            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${s.text}`} />
                            <div className="min-w-0">
                                <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${s.text}`}>{s.label} · pg {ann.page}</p>
                                {ann.quote && <p className="text-[11px] text-muted-foreground italic line-clamp-1 mb-0.5">"{ann.quote}"</p>}
                                <p className="text-xs text-foreground/80 line-clamp-2">{ann.content}</p>
                            </div>
                        </div>
                    </button>
                );
                })}
            </CardContent>
        </Card>
    );
}