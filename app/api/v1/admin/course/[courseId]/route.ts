import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { updateCourse } from "@/services/admin/server";
 
/**
 * @swagger
 * /api/v1/admin/course/[courseId]:
 *   patch:
 *     summary: Update an existing course
 *     tags:
 *       - Admin
 *     parameters:
 *       - name: courseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Course identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated course
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Course code and name are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 *       409:
 *         description: Conflict or duplicate course
 */

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