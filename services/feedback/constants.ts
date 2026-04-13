import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

export const annotationStyle = {
    PRAISE: { 
        icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-400",
        label: "Praise"
    },
    ISSUE: {
        icon: AlertCircle, 
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-400",
        label: "Issue"
    },
    SUGGESTION: {
        icon: Lightbulb,
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-400",
        label: "Suggestion"
    },
};