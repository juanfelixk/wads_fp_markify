import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { createClassAssignment } from "@/services/assignments/server";

/**
 * @swagger
 * /api/v1/lecturer/class/{classId}/assignment:
 *   post:
 *     summary: Create a new assignment
 *     description: Create a new assignment for a class as a lecturer.
 *     tags:
 *       - Lecturer
 *       - Assignment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the class
 *         example: class123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Final Project
 *               instructions:
 *                 type: string
 *                 example: Build a full-stack web application.
 *               maxPoints:
 *                 type: number
 *                 example: 100
 *               lateAllowed:
 *                 type: boolean
 *                 example: true
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-01T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-15T23:59:00.000Z
 *               rubric:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Code Quality
 *                     description:
 *                       type: string
 *                       example: Clean and maintainable code
 *                     maxPoints:
 *                       type: number
 *                       example: 40
 *                     weight:
 *                       type: number
 *                       example: 0.4
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   example:
 *                     id: assignment456
 *                     title: Final Project
 *       400:
 *         description: Invalid request body or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     invalidJson:
 *                       value: Invalid JSON body.
 *                     missingFields:
 *                       value: title, startDate, and endDate are required.
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
 *       404:
 *         description: Class not found or lecturer has no access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Class not found or you do not have access.
 *       422:
 *         description: Failed to create assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to create assignment.
 */

// create new assignment
export async function POST(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    let body: {
        title?: string;
        instructions?: string;
        maxPoints?: number;
        lateAllowed?: boolean;
        startDate?: string;
        endDate?: string;
        rubric?: { name: string; description: string; maxPoints: number; weight: number }[];
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { title, instructions, maxPoints, lateAllowed, startDate, endDate, rubric } = body;

    if (!title || !startDate || !endDate) {
        return NextResponse.json(
            { error: "title, startDate, and endDate are required." },
            { status: 400 }
        );
    }

    let data;
    try {
        data = await createClassAssignment(classId, session.user.id, {
            title,
            instructions,
            maxPoints,
            lateAllowed,
            startDate,
            endDate,
            rubric,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create assignment.";
        return NextResponse.json({ error: message }, { status: 422 });
    }

    if (!data) {
        return NextResponse.json({ error: "Class not found or you do not have access." }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 201 });
}