import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/map", "/settings"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtectedPath = PROTECTED_PATHS.some((path) =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!isProtectedPath) {
        return NextResponse.next();
    }

    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/map/:path*", "/settings/:path*"],
};