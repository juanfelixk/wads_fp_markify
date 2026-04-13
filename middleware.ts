import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "@/services/auth/config";
import { NextRequest, NextResponse } from "next/server";

type SessionData = typeof auth.$Infer.Session;

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const { data: session } = await betterFetch<SessionData>("/api/v1/auth/get-session", {
        baseURL: req.nextUrl.origin,
        headers: { cookie: req.headers.get("cookie") ?? "" },
    });

    // redirect to login if no session
    if (!session) {
        if (pathname.startsWith("/dashboard")) {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }
        return NextResponse.next();
    }

    const role = session.user.role?.toUpperCase();

    // redirect to their dashboard if session exists but attempt to visit /auth/[...all]
    if (pathname.startsWith("/auth")) {
        if (role === "STUDENT") return NextResponse.redirect(new URL("/dashboard/student", req.url));
        if (role === "LECTURER") return NextResponse.redirect(new URL("/dashboard/lecturer", req.url));
    }

    // role-based route protection
    if (pathname.startsWith("/dashboard/student") && role !== "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (pathname.startsWith("/dashboard/lecturer") && role !== "LECTURER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/auth/((?!login|register).+)"],
};