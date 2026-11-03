import { connectionManager } from "@/lib/driver/connection-manager";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { getSessionId } from "@/lib/utils/session.util";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectionManager.disconnect(await getSessionId());
    return NextResponse.json(
      createApiResponse({ connected: false }, "Disconnected successfully", 200),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Disconnect failed";
    return NextResponse.json(
      createApiResponse(null, message, 500),
      { status: 500 },
    );
  }
}
