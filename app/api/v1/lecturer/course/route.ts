import { getSession } from "@/services/auth/server";
import { getCourses } from "@/services/lecturer/server";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/lecturer/course:
 *   get:
 *     summary: Get available courses
 *     description: Retrieve all available courses for the lecturer's institution.
 *     tags:
 *       - Lecturer
 *       - Course
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 example:
 *                   id: course123
 *                   code: CS101
 *                   name: Web Development
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
 */

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