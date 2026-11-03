import { createApiResponse } from "@/lib/utils/api-response.util";
import { AUTH_COOKIE, isAuthEnabled, verifyAuthToken } from "@/lib/utils/auth.util";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login"]);

/**
 * When COMPOOSS_USERNAME / COMPOOSS_PASSWORD are set, every page and API route
 * requires a valid login cookie. Without them the app stays open, as before.
 */
export function proxy(req: NextRequest) {
  if (!isAuthEnabled()) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  const isSignedIn = verifyAuthToken(req.cookies.get(AUTH_COOKIE)?.value) !== null;

  if (pathname === "/login" && isSignedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isSignedIn || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      createApiResponse(null, "Sign in to use Compooss.", 401),
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif|txt)$).*)",
  ],
};
