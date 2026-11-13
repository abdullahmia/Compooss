import { isProtectedDatabase, type DatabaseExportRequest } from "@compooss/types";
import { databaseExportRepository } from "@/lib/core-modules/export/database-export.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { extractErrorMessage, protectedDbResponse } from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ dbName: string }> };

/**
 * POST /api/databases/[dbName]/export
 *
 * Body: DatabaseExportRequest
 * Returns: a DatabaseExportFile, streamed as JSON
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { dbName } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();

    const body = (await req.json().catch(() => ({}))) as DatabaseExportRequest;
    const collections = Array.isArray(body.collections)
      ? body.collections.filter((name): name is string => typeof name === "string")
      : undefined;

    const stream = await databaseExportRepository.createExportStream(dbName, {
      collections,
      includeDocuments: body.includeDocuments !== false,
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dbName}-export.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 400), {
      status: 400,
    });
  }
}
