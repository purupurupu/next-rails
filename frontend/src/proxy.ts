import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name (must match AUTH_CONFIG.TOKEN_COOKIE_NAME)
const TOKEN_COOKIE_NAME = "auth_token";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/auth"];

// API paths (handled separately)
const API_PATHS = ["/api/"];

/**
 * Proxy for authentication check
 *
 * Runs on Node.js Runtime for authentication checks.
 * Only checks token existence, not validity.
 * Full token validation happens in Server Components or BFF.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes (handled by BFF Route Handlers)
  if (API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip static assets
  if (
    pathname.startsWith("/_next")
    || pathname.startsWith("/favicon")
    || pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Skip public paths
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    // Redirect to login page with return URL
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
