import { CourseSummary, CourseClass } from "./types";

export async function createLecturerClient(email: string, name: string) {
    const res = await fetch("/api/v1/admin/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
}

export async function fetchAllLecturers() {
    const res = await fetch("/api/v1/admin/lecturer");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
}

export async function fetchAllStudents() {
    const res = await fetch("/api/v1/admin/student");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
}

export async function fetchLecturerClasses(lecturerId: string) {
    const res = await fetch(`/api/v1/admin/lecturer/${lecturerId}/class`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
}

export async function fetchStudentEnrollments(studentId: string) {
    const res = await fetch(`/api/v1/admin/student/${studentId}/enrollment`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
}

export async function registerCourseClient(data: {
    code: string;
    name: string;
}): Promise<void> {
    const res = await fetch("/api/v1/admin/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
 
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to register course.");
    }
}

export async function fetchCourses(): Promise<CourseSummary[]> {
    const res = await fetch("/api/v1/admin/course", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch courses.");
    return res.json();
}
 
export async function fetchCourseClasses(courseId: string): Promise<CourseClass[]> {
    const res = await fetch(`/api/v1/admin/course/${courseId}/class`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch classes.");
    return res.json();
}
 
export async function updateCourseClient(courseId: string, data: { code: string; name: string }): Promise<void> {
    const res = await fetch(`/api/v1/admin/course/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to update course.");
    }
}