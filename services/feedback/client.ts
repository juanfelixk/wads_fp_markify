import { FeedbackPageData } from "./types";

export async function fetchFeedbackPageData(classId: string, assignmentId: string): Promise<FeedbackPageData> {
    const res = await fetch(`/api/v1/classes/${classId}/assignments/${assignmentId}/feedback`, {
        cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch feedback.");
    return json.data;
}