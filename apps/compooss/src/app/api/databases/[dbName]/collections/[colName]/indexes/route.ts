import { isProtectedDatabase } from "@compooss/types";
import { indexRepository } from "@/lib/core-modules/index/index.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { protectedDbResponse, readOnlyResponse } from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";
import type { IndexDefinition } from "@compooss/types";

type IndexParams = { params: Promise<{ dbName: string; colName: string }> };

export type IndexWithStats = IndexDefinition & {
  usage?: { ops: number; since: string };
};

export async function GET(_req: Request, { params }: IndexParams) {
  try {
    const { dbName, colName } = await params;
    const [indexes, stats] = await Promise.all([
      indexRepository.getIndexes(dbName, colName),
      indexRepository.getIndexStats(dbName, colName),
    ]);
    const statsByName = new Map(
      stats.map((s) => [s.name, { ops: s.accesses.ops, since: s.accesses.since }]),
    );
    const withStats: IndexWithStats[] = indexes.map((idx) => ({
      ...idx,
      usage: statsByName.get(idx.name),
    }));
    return NextResponse.json(
      createApiResponse(withStats, "Indexes fetched successfully", 200),
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, String(error), 500),
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: IndexParams) {
  try {
    const { dbName, colName } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
    const body = await req.json();
    const {
      fields,
      name,
      unique,
      sparse,
      hidden,
      expireAfterSeconds,
      partialFilterExpression,
    } = body ?? {};
    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        createApiResponse(null, "At least one index field is required.", 400),
        { status: 400 },
      );
    }
    const result = await indexRepository.createIndex({
      databaseName: dbName,
      collectionName: colName,
      fields,
      name: name ?? undefined,
      unique: Boolean(unique),
      sparse: Boolean(sparse),
      hidden: Boolean(hidden),
      expireAfterSeconds:
        typeof expireAfterSeconds === "number" ? expireAfterSeconds : undefined,
      partialFilterExpression:
        partialFilterExpression &&
        typeof partialFilterExpression === "object" &&
        Object.keys(partialFilterExpression).length > 0
          ? partialFilterExpression
          : undefined,
    });
    return NextResponse.json(
      createApiResponse(result, "Index created successfully", 201),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, String(error), 500),
      { status: 500 },
    );
  }
}
