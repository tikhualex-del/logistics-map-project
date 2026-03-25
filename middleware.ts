import { NextRequest, NextResponse } from "next/server";
import {
  buildTraceHeaders,
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from "@/lib/observability/request-trace";

const PROTECTED_PATHS = ["/map", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { headers: tracedRequestHeaders, trace } = buildTraceHeaders(request.headers);

  const isProtectedPath = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtectedPath) {
    const response = NextResponse.next({
      request: {
        headers: tracedRequestHeaders,
      },
    });

    response.headers.set(REQUEST_ID_HEADER, trace.requestId);
    response.headers.set(CORRELATION_ID_HEADER, trace.correlationId);

    return response;
  }

  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    const response = NextResponse.redirect(loginUrl);
    response.headers.set(REQUEST_ID_HEADER, trace.requestId);
    response.headers.set(CORRELATION_ID_HEADER, trace.correlationId);

    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: tracedRequestHeaders,
    },
  });

  response.headers.set(REQUEST_ID_HEADER, trace.requestId);
  response.headers.set(CORRELATION_ID_HEADER, trace.correlationId);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};