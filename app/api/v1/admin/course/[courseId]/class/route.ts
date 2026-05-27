import { NextRequest, NextResponse } from "next/server";
import { getCourseClasses } from "@/services/admin/server";
import { getSession } from "@/services/auth/server";

/**
 * @swagger
 * /api/v1/admin/course/[courseId]/class:
 *   get:
 *     summary: Retrieve all classes associated with a course
 *     tags:
 *       - Admin
 *     parameters:
 *       - name: courseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Course identifier
 *     responses:
 *       200:
 *         description: List of classes for the course
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

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