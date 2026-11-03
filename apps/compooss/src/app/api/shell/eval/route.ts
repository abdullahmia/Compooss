import { evaluateShellCommand } from "@/lib/core-modules/shell/shell.evaluator";
import { connectionManager } from "@/lib/driver/connection-manager";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { getSessionId } from "@/lib/utils/session.util";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      command?: string;
      database?: string;
    };

    const command = body.command?.trim() ?? "";
    const database = body.database?.trim() || "test";

    if (!command) {
      return NextResponse.json(
        createApiResponse(null, "command is required.", 400),
        { status: 400 },
      );
    }

    // Resolve the connection before evaluating anything, so a request without
    // this browser's session cookie is rejected before any input is parsed.
    const sessionId = await getSessionId();
    const driver = connectionManager.getActiveDriver(sessionId);

    const response = await evaluateShellCommand(command, {
      database,
      driver,
      rawUri: connectionManager.getRawUri(sessionId),
      readOnly: connectionManager.isReadOnly(sessionId),
    });

    return NextResponse.json(
      createApiResponse(response, "OK", 200),
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      createApiResponse(null, message, 500),
      { status: 500 },
    );
  }
}
