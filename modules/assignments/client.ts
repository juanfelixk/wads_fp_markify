import { CalendarAssignment } from "./types";
import { ClassDetail } from "../classes/types";
import type { AssignmentPageData } from "./types";
 
export async function fetchClassDetail(classId: string): Promise<ClassDetail> {
    const res = await fetch(`/api/v1/classes/${classId}/assignments`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch class detail.");
    return json.data;
}

export async function fetchCalendarAssignments(): Promise<CalendarAssignment[]> {
    const res = await fetch("/api/v1/calendar");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch calendar.");
    return json.data;
}

export async function fetchAssignmentPageData(classId: string, assignmentId: string): Promise<AssignmentPageData> {
    const res = await fetch(`/api/v1/classes/${classId}/assignments/${assignmentId}`, {
        cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch assignment.");
    return json.data;
}