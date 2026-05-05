import type { ClassSummary } from "../classes/types";
import { CourseSummary, CreateClassPayload, GradingPageData, PublishGradesResult } from "./types";

export async function fetchCourses(): Promise<CourseSummary[]> {
    const res = await fetch("/api/v1/lecturer/course", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch courses.");
    return res.json();
}

export async function createClassClient(payload: CreateClassPayload): Promise<ClassSummary> {
    const res = await fetch("/api/v1/lecturer/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to create class.");
    }
    return res.json();
}
 
export async function fetchGradingPageData(classId: string, assignmentId: string, submissionId: string): Promise<GradingPageData> {
    const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment/${assignmentId}/grading/${submissionId}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch grading data.");
    return json.data;
}
 
export async function fetchSubmissionFileUrlForGrading(classId: string, assignmentId: string, submissionId: string): Promise<string> {
    const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment/${assignmentId}/grading/${submissionId}/file`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch file URL.");
    return json.url;
}
 
export async function submitGrade(classId: string, assignmentId: string, submissionId: string, payload: {
    finalScore: number;
    comment: string;
    criterionOverrides: { criterionName: string; pointsAwarded: number }[];
}): Promise<void> {
    const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment/${assignmentId}/grading/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to save grade.");
}

export async function publishGradesClient(classId: string, assignmentId: string): Promise<PublishGradesResult> {
    const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment/${assignmentId}/publish`, {
        method: "POST",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to publish grades.");
    return json;
}