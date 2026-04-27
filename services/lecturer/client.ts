import type { ClassSummary } from "../classes/types";
import { CourseSummary, CreateClassPayload } from "./types";

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