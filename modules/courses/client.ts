import { Course } from "./types";

export async function fetchEnrolledCourses(): Promise<Course[]> {
    const res = await fetch("/api/v1/courses");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch courses");
    return json.data;
}

export async function dropCourse(courseId: string): Promise<void> {
    const res = await fetch(`/api/v1/enrollments/${courseId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to drop course");
}