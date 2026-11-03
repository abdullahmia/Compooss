import { isProtectedDatabase } from "@compooss/types";
import {
  exportRepository,
  csvToDocuments,
} from "@/lib/core-modules/export/export.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { extractErrorMessage, protectedDbResponse, readOnlyResponse } from "@/lib/utils/api-route.util";
import { BSON } from "mongodb";
import { NextResponse, type NextRequest } from "next/server";

type Params = { params: Promise<{ dbName: string; colName: string }> };

/**
 * POST /api/databases/[dbName]/collections/[colName]/import
 *
 * Body: multipart/form-data
 *   file - .json or .csv file
 *
 * Returns: ImportResult { inserted, failed, errors }
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { dbName, colName } = await params;

    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        createApiResponse(null, "No file provided.", 400),
        { status: 400 },
      );
    }

    const text = await file.text();
    const fileName = file.name.toLowerCase();
    let docs: Record<string, unknown>[];

    if (fileName.endsWith(".csv")) {
      docs = csvToDocuments(text);
      if (docs.length === 0) {
        return NextResponse.json(
          createApiResponse(null, "CSV file is empty or has no data rows.", 400),
          { status: 400 },
        );
      }
    } else {
      // Treat as JSON — use EJSON.parse so BSON types (ObjectId, Long, Decimal128,
      // Date, etc.) are properly restored instead of stored as plain objects.
      let parsed: unknown;
      try {
        parsed = BSON.EJSON.parse(text, { relaxed: true });
      } catch {
        return NextResponse.json(
          createApiResponse(null, "Invalid JSON: could not parse file.", 400),
          { status: 400 },
        );
      }

      if (Array.isArray(parsed)) {
        docs = parsed as Record<string, unknown>[];
      } else if (typeof parsed === "object" && parsed !== null) {
        docs = [parsed as Record<string, unknown>];
      } else {
        return NextResponse.json(
          createApiResponse(
            null,
            "JSON file must contain an array of documents or a single document object.",
            400,
          ),
          { status: 400 },
        );
      }

      if (docs.length === 0) {
        return NextResponse.json(
          createApiResponse(null, "JSON array is empty.", 400),
          { status: 400 },
        );
      }
    }

    const result = await exportRepository.importDocuments(dbName, colName, docs);

    return NextResponse.json(
      createApiResponse(result, "Import complete.", 200),
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, extractErrorMessage(error), 500),
      { status: 500 },
    );
  }
}
