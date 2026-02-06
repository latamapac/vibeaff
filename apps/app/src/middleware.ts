import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api"];

function isTokenStructureValid(token: string): boolean {
  // JWT has 3 base64url parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    // Decode the payload (middle part) and check expiration
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths to pass through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow the root page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check for auth cookie on protected paths
  const token = request.cookies.get("vibeaff_token")?.value;

  if (!token || !isTokenStructureValid(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*", "/affiliate/:path*"],
};
