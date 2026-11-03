import { connectionManager } from "@/lib/driver/connection-manager";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { getSessionId } from "@/lib/utils/session.util";
import { connection, NextResponse } from "next/server";

export async function GET() {
  // With cacheComponents enabled, a GET handler that reads no runtime data is
  // prerendered at build time, freezing the status as `{ connected: false }`.
  // Opt into request-time rendering so the live in-memory state is returned.
  await connection();

  try {
    const status = connectionManager.getStatus(await getSessionId());
    return NextResponse.json(
      createApiResponse(status, "Connection status retrieved", 200),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get status";
    return NextResponse.json(
      createApiResponse(null, message, 500),
      { status: 500 },
    );
  }
}
