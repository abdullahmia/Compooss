import { isProtectedDatabase } from "@compooss/types";
import { documentRepository } from "@/lib/core-modules/document/document.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import {
  extractErrorMessage,
  protectedDbResponse,
  readOnlyResponse,
} from "@/lib/utils/api-route.util";
import {
  parseDocumentFilter,
  parseDocumentFilterStrict,
  parseJsonParam,
} from "@/lib/utils/query-filter.util";
import { BSON, type Document } from "mongodb";
import { NextResponse, type NextRequest } from "next/server";

type DocParams = { params: Promise<{ dbName: string; colName: string }> };

export async function GET(req: NextRequest, { params }: DocParams) {
  const { dbName, colName } = await params;
  const searchParams = req.nextUrl.searchParams;

  const filterRaw = searchParams.get("filter");
  const sortRaw = searchParams.get("sort");
  const projectRaw = searchParams.get("project");
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? 20)), 1000);
  const skip = Math.max(0, Number(searchParams.get("skip") ?? 0));

  const filter = parseDocumentFilter(filterRaw);
  const sort = parseJsonParam(sortRaw, {});
  const project = parseJsonParam(projectRaw, {});

  const result = await documentRepository.queryDocuments({
    databaseName: dbName,
    collectionName: colName,
    filter,
    sort: Object.keys(sort).length > 0 ? sort : undefined,
    project: Object.keys(project).length > 0 ? project : undefined,
    skip,
    limit,
  });

  return NextResponse.json(createApiResponse(result, "Documents fetched successfully", 200));
}

export async function POST(req: Request, { params }: DocParams) {
  try {
    const { dbName, colName } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
    const body = await req.json();
    const document = body?.document ?? body;
    const inserted = await documentRepository.addDocument({
      databaseName: dbName,
      collectionName: colName,
      document: document ?? {},
    });
    return NextResponse.json(createApiResponse(inserted, "Document inserted successfully", 201));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      createApiResponse(null, message, 400),
      { status: 400 },
    );
  }
}

type BulkBody = { filter?: unknown; update?: unknown; dryRun?: boolean };

/**
 * Accepts update operators ({ $set: ... }) or an aggregation pipeline. A plain
 * replacement document is rejected so it can't overwrite every match.
 * Extended JSON values such as { "$date": ... } become real BSON types.
 */
function parseUpdate(raw: unknown): Document | Document[] {
  if (Array.isArray(raw)) {
    const isPipeline =
      raw.length > 0 &&
      raw.every((stage) => stage && typeof stage === "object" && !Array.isArray(stage));
    if (!isPipeline) {
      throw new Error("An update pipeline must be a non-empty array of stages.");
    }
    return BSON.EJSON.deserialize(raw) as Document[];
  }

  const keys = raw && typeof raw === "object" ? Object.keys(raw) : [];
  if (keys.length === 0 || keys.some((key) => !key.startsWith("$"))) {
    throw new Error(
      'Use update operators such as $set or $unset, e.g. { "$set": { "status": "archived" } }.',
    );
  }
  return BSON.EJSON.deserialize(raw as Document) as Document;
}

function badRequest(error: unknown) {
  return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 400), {
    status: 400,
  });
}

/** Updates every document matching the filter. With dryRun, only counts the matches. */
export async function PATCH(req: Request, { params }: DocParams) {
  try {
    const { dbName, colName } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
    const body = (await req.json().catch(() => ({}))) as BulkBody;

    let filter: Document;
    let update: Document | Document[] | undefined;
    try {
      filter = parseDocumentFilterStrict(body.filter);
      if (!body.dryRun || body.update !== undefined) update = parseUpdate(body.update);
    } catch (error) {
      return badRequest(error);
    }

    if (body.dryRun || !update) {
      const matchedCount = await documentRepository.countDocuments(dbName, colName, filter);
      return NextResponse.json(createApiResponse({ matchedCount }, "Preview ready", 200));
    }

    const result = await documentRepository.updateMany(dbName, colName, filter, update);
    return NextResponse.json(
      createApiResponse(result, `Updated ${result.modifiedCount} documents`, 200),
    );
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}

/** Deletes every document matching the filter. With dryRun, only counts the matches. */
export async function DELETE(req: Request, { params }: DocParams) {
  try {
    const { dbName, colName } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
    const body = (await req.json().catch(() => ({}))) as BulkBody;

    let filter: Document;
    try {
      filter = parseDocumentFilterStrict(body.filter);
    } catch (error) {
      return badRequest(error);
    }

    if (body.dryRun) {
      const matchedCount = await documentRepository.countDocuments(dbName, colName, filter);
      return NextResponse.json(createApiResponse({ matchedCount }, "Preview ready", 200));
    }

    const result = await documentRepository.deleteMany(dbName, colName, filter);
    return NextResponse.json(
      createApiResponse(result, `Deleted ${result.deletedCount} documents`, 200),
    );
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}
