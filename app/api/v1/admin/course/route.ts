import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { getCourses, registerCourse } from "@/services/admin/server"; 

/**
 * @swagger
 * /api/v1/admin/course:
 *   post:
 *     summary: Register a new course
 *     tags:
 *       - Admin
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
 *       201:
 *         description: Course created successfully
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
 *       409:
 *         description: Conflict or duplicate course
 *   get:
 *     summary: Get all courses for the authenticated admin's institution
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // verify role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { code, name } = body;

    // verify empty fields
    if (!code?.trim() || !name?.trim()) {
        return NextResponse.json({ error: "Course code and name are required." }, { status: 400 });
    }

    try {
        const course = await registerCourse({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            institution: session.user.institution ?? "Unknown",
        });
        return NextResponse.json(course, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to register course.";
        return NextResponse.json({ error: message }, { status: 409 });
    }
}

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } 
 
    const courses = await getCourses(session.user.institution ?? "Unknown");
    return NextResponse.json(courses);
}