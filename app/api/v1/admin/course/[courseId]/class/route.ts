import { NextRequest, NextResponse } from "next/server";
import { getCourseClasses } from "@/services/admin/server";
import { getSession } from "@/services/auth/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } 

    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    };

    const { courseId } = await params;
    const institution = session.user.institution ?? "Unknown";
    const classes = await getCourseClasses(courseId, institution);
    return NextResponse.json(classes);
}