import { connectionManager } from "@/lib/driver/connection-manager";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { getOrCreateSessionId } from "@/lib/utils/session.util";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { uri, options, readOnly } = await req.json();

    if (!uri || typeof uri !== "string") {
      return NextResponse.json(
        createApiResponse(null, "Connection URI is required", 400),
        { status: 400 },
      );
    }

    const sessionId = await getOrCreateSessionId(req);
    const status = await connectionManager.connect(
      sessionId,
      uri,
      options,
      readOnly === true,
    );
    return NextResponse.json(
      createApiResponse(status, "Connected successfully", 200),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json(
      createApiResponse(null, message, 503),
      { status: 503 },
    );
  }
}
