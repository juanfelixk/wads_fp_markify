import { NextResponse } from "next/server";

/**
 * @swagger
 * /logout: 
 *  post:
 *    summary: User logout
 *    description: Clears the session cookie and logs the user out
 *    tags: 
 *      - Authentication
 *    responses:
 *      200:
 *        description: Logout successful
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Logged out
 */

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });

  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
