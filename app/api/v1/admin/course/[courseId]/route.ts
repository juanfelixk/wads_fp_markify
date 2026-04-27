import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { updateCourse } from "@/services/admin/server";
 
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } 

    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } 
 
    const body = await req.json();
    const { code, name } = body;

    if (!code?.trim() || !name?.trim()) {
        return NextResponse.json({ error: "Course code and name are required." }, { status: 400 });
    }
 
    const { courseId } = await params;
    const institution = session.user.institution ?? "Unknown";
 
    try {
        const updated = await updateCourse(courseId, institution, { code, name });
        if (!updated) return NextResponse.json({ error: "Course not found." }, { status: 404 });
        return NextResponse.json(updated);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update course.";
        return NextResponse.json({ error: message }, { status: 409 });
    }
}