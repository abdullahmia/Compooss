import { createApiResponse } from "@/lib/utils/api-response.util";
import {
  AUTH_COOKIE,
  AUTH_MAX_AGE_SECONDS,
  AUTH_MISCONFIGURED_MESSAGE,
  createAuthToken,
  isAuthConfigured,
  isAuthEnabled,
  verifyCredentials,
} from "@/lib/utils/auth.util";
import { cookieOptions } from "@/lib/utils/session.util";
import { NextResponse, type NextRequest } from "next/server";

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isLockedOut(key: string): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  if (failedAttempts.size > 1000) {
    for (const [k, e] of failedAttempts) if (e.resetAt < now) failedAttempts.delete(k);
  }
  const entry = failedAttempts.get(key);
  if (entry && entry.resetAt > now) {
    entry.count++;
  } else {
    failedAttempts.set(key, { count: 1, resetAt: now + LOCKOUT_WINDOW_MS });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      createApiResponse(null, "Login is not enabled on this server.", 404),
      { status: 404 },
    );
  }
  if (!isAuthConfigured()) {
    return NextResponse.json(
      createApiResponse(null, AUTH_MISCONFIGURED_MESSAGE, 500),
      { status: 500 },
    );
  }

  const key = clientKey(req);
  if (isLockedOut(key)) {
    return NextResponse.json(
      createApiResponse(
        null,
        "Too many failed sign-in attempts. Try again in 15 minutes.",
        429,
      ),
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    username?: unknown;
    password?: unknown;
  };
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyCredentials(username, password)) {
    recordFailure(key);
    return NextResponse.json(
      createApiResponse(null, "Incorrect username or password.", 401),
      { status: 401 },
    );
  }

  failedAttempts.delete(key);
  const res = NextResponse.json(
    createApiResponse({ username }, "Signed in", 200),
  );
  res.cookies.set(
    AUTH_COOKIE,
    createAuthToken(username),
    cookieOptions(req, AUTH_MAX_AGE_SECONDS),
  );
  return res;
}
