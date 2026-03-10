import { adminAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /session:
 *   post:
 *     summary: Create session
 *     description: Verifies a Firebase ID token and creates a secure session cookie.
 *     tags: 
 *      - Authentication
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: Firebase ID token in the format `Bearer <token>`
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
 *     responses:
 *       200:
 *         description: Session successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authorization.split("Bearer ")[1];

  await adminAuth.verifyIdToken(idToken, true);

  const response = NextResponse.json({ status: "success" });

  response.cookies.set("session", idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return response;
}