import { ClassSummary } from "./types";

// student-side
export async function fetchEnrolledClasses(): Promise<ClassSummary[]> {
    const res = await fetch("/api/v1/student/class");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch classes");
    return json.data;
}

// student-side
export async function dropClass(classId: string): Promise<void> {
    const res = await fetch(`/api/v1/student/class/${classId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to drop class");
}

// student-side
export async function enrollInClass(courseCode: string, classCode: string, academicYear: string, enrollmentKey: string): Promise<void> {
    const res = await fetch("/api/v1/student/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode, classCode, academicYear, enrollmentKey }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to enroll.");
}

// lecturer-side
export async function fetchOwnedClasses(): Promise<ClassSummary[]> {
    const res = await fetch("/api/v1/lecturer/class", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch classes");
    return res.json();
}

// lecturer-side
export async function deleteOwnedClass(classId: string): Promise<void> {
    const res = await fetch(`/api/v1/lecturer/class/${classId}`, { method: "DELETE" });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to delete class.");
    }
}