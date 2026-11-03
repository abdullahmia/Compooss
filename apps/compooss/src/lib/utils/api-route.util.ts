import { createApiResponse } from "@/lib/utils/api-response.util";
import { READ_ONLY_MESSAGE } from "@/lib/utils/read-only.util";
import { NextResponse } from "next/server";

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    const causedBy = msg.match(/caused by :: (.+)/);
    if (causedBy) return causedBy[1].trim();
    return msg;
  }
  return String(error);
}

export function readOnlyResponse() {
  return NextResponse.json(createApiResponse(null, READ_ONLY_MESSAGE, 403), {
    status: 403,
  });
}

export function protectedDbResponse() {
  return NextResponse.json(
    createApiResponse(
      null,
      "Access to system databases (admin, local, config) is not allowed.",
      403,
    ),
    { status: 403 },
  );
}
