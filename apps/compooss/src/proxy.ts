import { createApiResponse } from "@/lib/utils/api-response.util";
import { AUTH_COOKIE, isAuthEnabled, verifyAuthToken } from "@/lib/utils/auth.util";
import { handleDesktopRequest } from "@/lib/utils/desktop.util";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login"]);

/**
 * When COMPOOSS_USERNAME / COMPOOSS_PASSWORD are set, every page and API route
 * requires a valid login cookie. Without them the app stays open, as before.
 * The desktop app's bundled server is locked to its own window first.
 */
export function proxy(req: NextRequest) {
  const desktopResponse = handleDesktopRequest(req);
  if (desktopResponse) return desktopResponse;

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
    // Skips build assets, the self-hosted Monaco files and top-level files in
    // public/. Only single-segment paths count as files, so API routes like
    // /api/databases/x.png still go through the checks above.
    "/((?!_next/static|_next/image|monaco/|favicon.ico|[^/]+\\.(?:png|jpg|jpeg|svg|ico|webp|gif|txt)$).*)",
  ],
};
