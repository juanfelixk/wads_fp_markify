import { auth } from "@/services/auth/config";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname === "/") {
        return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    const session = await auth.api.getSession({
        headers: req.headers,
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
        if (role === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }

    // role-based route protection
    if (pathname.startsWith("/dashboard/student") && role !== "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (pathname.startsWith("/dashboard/lecturer") && role !== "LECTURER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*", "/auth/((?!login|register).+)"],
};