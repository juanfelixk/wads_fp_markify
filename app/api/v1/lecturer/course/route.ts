import { getSession } from "@/services/auth/server";
import { getCourses } from "@/services/lecturer/server";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } 
 
    const courses = await getCourses(session.user.institution ?? "Unknown");
    return NextResponse.json(courses);
}