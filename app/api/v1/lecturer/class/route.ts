import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server"; 
import { getLecturerClasses } from "@/services/classes/server";
import { ClassSummary } from "@/services/classes/types";
import { createClass, generateUniqueEnrollmentKey } from "@/services/lecturer/server";

/**
 * @swagger
 * /api/v1/lecturer/class:
 *   get:
 *     summary: Get lecturer classes
 *     description: Retrieve all classes owned by the authenticated lecturer.
 *     tags:
 *       - Lecturer
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved lecturer classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   classId:
 *                     type: string
 *                     example: class123
 *                   courseCode:
 *                     type: string
 *                     example: CS101
 *                   classCode:
 *                     type: string
 *                     example: A
 *                   courseName:
 *                     type: string
 *                     example: Web Development
 *                   institution:
 *                     type: string
 *                     example: Example University
 *                   academicYear:
 *                     type: string
 *                     example: 2025/2026
 *                   lecturer:
 *                     type: string
 *                     example: John Doe
 *                   students:
 *                     type: number
 *                     example: 35
 *                   enrollmentKey:
 *                     type: string
 *                     example: ABC12345
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *
 *   post:
 *     summary: Create a new class
 *     description: Create a new lecturer class with a generated enrollment key.
 *     tags:
 *       - Lecturer
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - code
 *               - academicYear
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: course123
 *               code:
 *                 type: string
 *                 example: A
 *               academicYear:
 *                 type: string
 *                 example: 2025/2026
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: class123
 *                 code: A
 *                 academicYear: 2025/2026
 *                 enrollmentKey: ABC12345
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     missingFields:
 *                       value: Missing required fields.
 *                     invalidCode:
 *                       value: Class code must be alphanumeric.
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Forbidden
 *       409:
 *         description: Failed to create class or class conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to create class.
 */

export async function GET() {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await getLecturerClasses(session.user.id);

    const classes: ClassSummary[] = raw.map((c) => ({
        classId: c.id,
        courseCode: c.course.code,
        classCode: c.code,
        courseName: c.course.name,
        institution: session.user.institution ?? "",
        academicYear: c.academicYear,
        lecturer: session.user.name ?? "",
        students: c._count.enrollments,
        enrollmentKey: c.enrollmentKey,
    }));

    return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, code, academicYear } = body;

    if (!courseId || !code || !academicYear) {
        return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!/^[A-Za-z0-9]+$/.test(code.trim())) {
        return NextResponse.json({ error: "Class code must be alphanumeric." }, { status: 400 });
    }

    try {
        const enrollmentKey = await generateUniqueEnrollmentKey();
        const newClass = await createClass({
            courseId,
            code: code.trim(),
            academicYear: academicYear.trim(),
            enrollmentKey,
            lecturerId: session.user.id,
            institution: session.user.institution ?? "Unknown",
        });
        return NextResponse.json(newClass, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create class.";
        return NextResponse.json({ error: message }, { status: 409 });
    }
}