import { connectionManager } from "@/lib/driver/connection-manager";
import type { MongoDriver } from "@/lib/driver/mongodb.driver";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

/** Identifies this browser's MongoDB connection on the server. */
export const SESSION_COOKIE = "compooss_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Cookie options shared by Compooss cookies. SameSite=Lax keeps them off
 * cross-site requests, so another website can't act on this browser's
 * connection or login.
 */
export function cookieOptions(req: NextRequest, maxAge: number) {
  const secure =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge };
}

export async function getSessionId(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Returns this browser's session id, creating the cookie on first connect. */
export async function getOrCreateSessionId(req: NextRequest): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(SESSION_COOKIE, id, cookieOptions(req, SESSION_MAX_AGE_SECONDS));
  return id;
}

/** The current browser's driver. Throws if it hasn't connected. */
export async function getSessionDriver(): Promise<MongoDriver> {
  return connectionManager.getActiveDriver(await getSessionId());
}

export async function isReadOnlySession(): Promise<boolean> {
  return connectionManager.isReadOnly(await getSessionId());
}
