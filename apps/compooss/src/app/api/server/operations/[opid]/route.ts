import { serverRepository } from "@/lib/core-modules/server/server.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { extractErrorMessage, readOnlyResponse } from "@/lib/utils/api-route.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { NextResponse } from "next/server";

type OpParams = { params: Promise<{ opid: string }> };

/** Kills a running operation. */
export async function DELETE(_req: Request, { params }: OpParams) {
  try {
    if (await isReadOnlySession()) return readOnlyResponse();
    const { opid } = await params;
    await serverRepository.killOperation(decodeURIComponent(opid));
    return NextResponse.json(createApiResponse(null, "Kill requested", 200));
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}
