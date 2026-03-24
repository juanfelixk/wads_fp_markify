import { AssignmentStatus } from "./types";

export const statusConfig: Record<AssignmentStatus, { label: string; className: string }> = {
    NOT_SUBMITTED: {
        label: "Not Submitted",
        className: "border-muted-foreground/30 text-muted-foreground bg-muted/40",
    },
    SUBMITTED: {
        label: "Submitted",
        className: "border-blue-400/40 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40",
    },
    REVISED: {
        label: "Revised",
        className: "border-amber-400/40 text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40",
    },
    GRADED: {
        label: "Graded",
        className: "border-green-400/40 text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/40",
    },
};