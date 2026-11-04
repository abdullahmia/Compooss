import { createApiResponse } from "@/lib/utils/api-response.util";
import { safeEqual } from "@/lib/utils/auth.util";
import { NextResponse, type NextRequest } from "next/server";

export const DESKTOP_COOKIE = "compooss_desktop";
export const DESKTOP_BOOTSTRAP_PATH = "/__desktop";
export const DESKTOP_HEALTH_PATH = "/__desktop/health";

/**
 * Set by the desktop app (apps/desktop) when it starts the bundled server, and
 * changes on every launch. Never set in Docker.
 */
function getDesktopToken(): string | null {
  return process.env.COMPOOSS_DESKTOP_TOKEN || null;
}

/**
 * Locks the bundled desktop server to the desktop app's own window. The shell
 * runs code with full Node access, so other local processes and websites
 * reaching 127.0.0.1 (e.g. via DNS rebinding) must be turned away.
 *
 * The app opens `/__desktop?token=…` once per launch, which stores the token in
 * a cookie; every other request must carry it. Returns the response to send,
 * or null to let the request through.
 */
export function handleDesktopRequest(req: NextRequest): NextResponse | null {
  const token = getDesktopToken();
  if (!token) return null;

  // A rebinding domain still sends its own name as the Host header.
  if (req.headers.get("host") !== `127.0.0.1:${process.env.PORT}`) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { pathname, searchParams } = req.nextUrl;

  if (pathname === DESKTOP_HEALTH_PATH) {
    return new NextResponse("ok");
  }

  if (pathname === DESKTOP_BOOTSTRAP_PATH) {
    if (!safeEqual(searchParams.get("token") ?? "", token)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const res = NextResponse.redirect(new URL("/", req.url));
    // Lax, not Strict: the redirect follows a navigation from the app's
    // splash page (tauri://), which Strict would treat as cross-site.
    res.cookies.set(DESKTOP_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    return res;
  }

  if (safeEqual(req.cookies.get(DESKTOP_COOKIE)?.value ?? "", token)) {
    return null;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      createApiResponse(null, "Open Compooss from the desktop app.", 401),
      { status: 401 },
    );
  }
  return new NextResponse("Open Compooss from the desktop app.", { status: 403 });
}
