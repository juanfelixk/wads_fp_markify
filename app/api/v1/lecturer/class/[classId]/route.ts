import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth/server";
import { deleteClass, getLecturerClassPageData } from "@/services/classes/server";

/**
 * @swagger
 * /api/v1/lecturer/class/{classId}:
 *   get:
 *     summary: Get lecturer class details
 *     description: Retrieve detailed class page data for a lecturer.
 *     tags:
 *       - Lecturer
 *       - Class
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
 *     responses:
 *       200:
 *         description: Successfully retrieved class data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   example:
 *                     id: class123
 *                     name: Web Development
 *                     code: CS101
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
 *         description: Class not found or no access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Class not found or you do not have access.
 *
 *   delete:
 *     summary: Delete class
 *     description: Delete a lecturer-owned class by class ID.
 *     tags:
 *       - Lecturer
 *       - Class
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
 *     responses:
 *       204:
 *         description: Class deleted successfully
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
 *         description: Class not found or lecturer does not own it
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Class not found or you do not own it
 */
 
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;
    const deleted = await deleteClass(classId, session.user.id);

    if (!deleted) {
        return NextResponse.json(
            { error: "Class not found or you do not own it" },
            { status: 404 }
        );
    }
 
    return new NextResponse(null, { status: 204 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
    const session = await getSession();
    if (!session || session.user.role !== "LECTURER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const { classId } = await params;
    const data = await getLecturerClassPageData(classId, session.user.id);
 
    if (!data) {
        return NextResponse.json(
            { error: "Class not found or you do not have access." },
            { status: 404 }
        );
    }
 
    return NextResponse.json({ data });
}