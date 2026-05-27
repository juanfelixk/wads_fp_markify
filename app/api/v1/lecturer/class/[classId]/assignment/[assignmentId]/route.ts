import { deleteAssignmentById, getLecturerAssignmentPageData, updateAssignmentById } from "@/services/assignments/server";
import { getSession } from "@/services/auth/server";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/lecturer/class/{classId}/assignment/{assignmentId}:
 *   get:
 *     summary: Get assignment details
 *     description: Retrieve assignment details and page data.
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
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *         example: assignment456
 *     responses:
 *       200:
 *         description: Successfully retrieved assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: assignment456
 *                 title: Final Project
 *                 description: Build a REST API
 *                 dueDate: "2026-06-01T23:59:00.000Z"
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
 *         description: Assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Not found
 *       500:
 *         description: Failed to fetch assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch assignment
 *
 *   patch:
 *     summary: Update assignment
 *     description: Update an existing assignment by assignment ID.
 *     tags:
 *       - Lecturer
 *       - Assignment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *         example: assignment456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: Updated Final Project
 *               description: Build a full-stack REST API
 *               dueDate: "2026-06-05T23:59:00.000Z"
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *       500:
 *         description: Failed to update assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to update assignment
 *
 *   delete:
 *     summary: Delete assignment
 *     description: Delete an assignment by assignment ID.
 *     tags:
 *       - Lecturer
 *       - Assignment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *         example: assignment456
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *       500:
 *         description: Failed to delete assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to delete assignment
 */

export async function DELETE(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignmentId } = await params;

    try {
        await deleteAssignmentById(assignmentId);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ classId: string, assignmentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { classId, assignmentId } = await params;
    try {
        const assignment = await getLecturerAssignmentPageData(classId, assignmentId);
        if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(assignment);
    } catch {
        return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId } = await params;
    const body = await req.json();
    try {
        await updateAssignmentById(assignmentId, body);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
    }
}