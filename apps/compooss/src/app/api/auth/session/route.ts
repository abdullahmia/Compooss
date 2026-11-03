import { createApiResponse } from "@/lib/utils/api-response.util";
import { AUTH_COOKIE, isAuthEnabled, verifyAuthToken } from "@/lib/utils/auth.util";
import type { AuthSession } from "@compooss/types";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const session: AuthSession = {
    enabled: isAuthEnabled(),
    username: verifyAuthToken(token),
  };
  return NextResponse.json(createApiResponse(session, "Auth session", 200));
}
