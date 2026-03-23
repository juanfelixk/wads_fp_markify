import { ClassDetail } from "./types";
 
export async function fetchClassDetail(classId: string): Promise<ClassDetail> {
    const res = await fetch(`/api/v1/classes/${classId}/assignments`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch class detail.");
    return json.data;
}