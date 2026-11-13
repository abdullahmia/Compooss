import { isProtectedDatabase, type DatabaseImportRequest } from "@compooss/types";
import { databaseExportRepository } from "@/lib/core-modules/export/database-export.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import {
  extractErrorMessage,
  protectedDbResponse,
  readOnlyResponse,
} from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ dbName: string }> };

const COLLECTION_TYPES = new Set(["collection", "timeseries", "view"]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Checks the request shape. Throws with a user-facing message. */
function parseImportRequest(raw: unknown): DatabaseImportRequest {
  if (!isObject(raw)) throw new Error("Expected a JSON object.");
  const { step, name } = raw;
  if (typeof name !== "string" || !name.trim()) throw new Error("A collection name is required.");
  if (name.startsWith("system.")) throw new Error(`"${name}" is a system collection.`);

  switch (step) {
    case "collection":
      if (typeof raw.type !== "string" || !COLLECTION_TYPES.has(raw.type)) {
        throw new Error(`"${name}" has an unknown type.`);
      }
      if (!isObject(raw.options)) throw new Error(`"${name}" has no options object.`);
      return raw as DatabaseImportRequest;
    case "documents":
      if (!Array.isArray(raw.documents) || !raw.documents.every(isObject)) {
        throw new Error("documents must be an array of objects.");
      }
      return raw as DatabaseImportRequest;
    case "indexes":
      if (!Array.isArray(raw.indexes) || !raw.indexes.every(isObject)) {
        throw new Error("indexes must be an array of index specs.");
      }
      return raw as DatabaseImportRequest;
    default:
      throw new Error("step must be collection, documents or indexes.");
  }
}

/**
 * POST /api/databases/[dbName]/import
 *
 * Body: DatabaseImportRequest. The client sends one step at a time: create the
 * collection, insert its documents in batches, then create its indexes.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { dbName } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();

    let request: DatabaseImportRequest;
    try {
      request = parseImportRequest(await req.json());
    } catch (error) {
      return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 400), {
        status: 400,
      });
    }

    switch (request.step) {
      case "collection": {
        const result = await databaseExportRepository.prepareCollection(dbName, request);
        return NextResponse.json(createApiResponse(result, "Collection ready", 200));
      }
      case "documents": {
        const result = await databaseExportRepository.insertDocuments(
          dbName,
          request.name,
          request.documents,
        );
        return NextResponse.json(createApiResponse(result, "Batch imported", 200));
      }
      case "indexes": {
        const result = await databaseExportRepository.createIndexes(
          dbName,
          request.name,
          request.indexes,
        );
        return NextResponse.json(createApiResponse(result, "Indexes created", 200));
      }
    }
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}
