import { isProtectedDatabase } from "@compooss/types";
import { documentRepository } from "@/lib/core-modules/document/document.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { protectedDbResponse, readOnlyResponse } from "@/lib/utils/api-route.util";
import { NextResponse, type NextRequest } from "next/server";

type DocParams = { params: Promise<{ dbName: string; colName: string }> };

/**
 * Converts JS-style object keys (unquoted) to valid JSON by quoting them.
 * e.g. { email: "x" } -> { "email": "x" }
 */
function relaxToJson(str: string): string {
  return str.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
}

function parseJsonParam(value: string | null, fallback: Record<string, unknown>): Record<string, unknown> {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "" || trimmed === "{}" || trimmed === "{ }") {
    return fallback;
  }
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null ? parsed : fallback;
  } catch {
    try {
      const relaxed = relaxToJson(trimmed);
      const parsed = JSON.parse(relaxed);
      return typeof parsed === "object" && parsed !== null ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
}

/** Escape special regex characters so the string is matched literally as a substring. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts string values in the filter to partial, case-insensitive matches using MongoDB $regex.
 * e.g. { email: "gmail" } -> { email: { $regex: "gmail", $options: "i" } }
 */
function filterStringsToPartialMatch(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = { $regex: escapeRegex(value), $options: "i" };
    } else if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof RegExp)) {
      result[key] = filterStringsToPartialMatch(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function GET(req: NextRequest, { params }: DocParams) {
  const { dbName, colName } = await params;
  const searchParams = req.nextUrl.searchParams;

  const filterRaw = searchParams.get("filter");
  const sortRaw = searchParams.get("sort");
  const projectRaw = searchParams.get("project");
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? 20)), 1000);
  const skip = Math.max(0, Number(searchParams.get("skip") ?? 0));

  const filterParsed = parseJsonParam(filterRaw, {});
  const filter = filterStringsToPartialMatch(filterParsed as Record<string, unknown>);
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
