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
        className: "border-purple-400/40 text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40",
    },
    GRADED: {
        label: "Graded",
        className: "border-green-400/40 text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/40",
    },
    SUBMITTED_LATE: {
        label: "Submitted Late",
        className: "border-red-400/40 text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40",
    },
};