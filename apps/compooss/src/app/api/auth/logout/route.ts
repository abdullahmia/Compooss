import { connectionManager } from "@/lib/driver/connection-manager";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { AUTH_COOKIE, revokeAuthToken } from "@/lib/utils/auth.util";
import { getSessionId } from "@/lib/utils/session.util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  revokeAuthToken((await cookies()).get(AUTH_COOKIE)?.value);
  // Close this browser's database connection along with its login.
  await connectionManager.disconnect(await getSessionId()).catch(() => {});

  const res = NextResponse.json(createApiResponse(null, "Signed out", 200));
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
