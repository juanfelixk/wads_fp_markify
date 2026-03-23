import { ClassSummary } from "./types";

export async function fetchEnrolledClasses(): Promise<ClassSummary[]> {
    const res = await fetch("/api/v1/classes");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch classes");
    return json.data;
}

export async function dropClass(classId: string): Promise<void> {
    const res = await fetch(`/api/v1/classes/${classId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to drop class");
}

export async function enrollInClass(courseCode: string, classCode: string, academicYear: string, enrollmentKey: string): Promise<void> {
    const res = await fetch("/api/v1/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode, classCode, academicYear, enrollmentKey }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to enroll.");
}