import { FeedbackPageData } from "./types";

export async function fetchFeedbackPageData(classId: string, assignmentId: string, versionId?: string): Promise<FeedbackPageData> {
    const url = versionId
        ? `/api/v1/classes/${classId}/assignments/${assignmentId}/feedback?versionId=${versionId}`
        : `/api/v1/classes/${classId}/assignments/${assignmentId}/feedback`;
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch feedback.");
    return json.data;
}