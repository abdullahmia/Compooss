import { serverRepository } from "@/lib/core-modules/server/server.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { extractErrorMessage } from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const operations = await serverRepository.getCurrentOperations();
    return NextResponse.json(createApiResponse(operations, "Current operations", 200));
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}
