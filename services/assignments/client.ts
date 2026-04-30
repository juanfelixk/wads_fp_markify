import { CalendarAssignment } from "./types";
import { ClassDetail } from "@/services/classes/types";
import type { AssignmentPageData, CreateAssignmentPayload, CreatedAssignment } from "./types";
 
export async function fetchClassDetail(classId: string): Promise<ClassDetail> {
    const res = await fetch(`/api/v1/student/class/${classId}/assignment`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch class detail.");
    return json.data;
}

export async function fetchCalendarAssignments(): Promise<CalendarAssignment[]> {
    const res = await fetch("/api/v1/student/calendar");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch calendar.");
    return json.data;
}

export async function fetchAssignmentPageData(classId: string, assignmentId: string): Promise<AssignmentPageData> {
    const res = await fetch(`/api/v1/student/class/${classId}/assignment/${assignmentId}`, {
        cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch assignment.");
    return json.data;
}

// lecturer-side
export async function createAssignment(classId: string, payload: CreateAssignmentPayload): Promise<CreatedAssignment> {
    const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to create assignment.");
    return json.data;
}

// lecturer-side
export async function deleteAssignment(classId: string, assignmentId: string): Promise<void> {
  const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment/${assignmentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete assignment");
}

// lecturer-side
export async function fetchAssignment(classId: string, assignmentId: string) {
    const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment/${assignmentId}`);
    if (!res.ok) throw new Error("Failed to fetch assignment");
    return res.json();
}

// lecturer-side
export async function updateAssignment(classId: string, assignmentId: string, body: CreateAssignmentPayload) {
    const res = await fetch(`/api/v1/lecturer/class/${classId}/assignment/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to update assignment");
}