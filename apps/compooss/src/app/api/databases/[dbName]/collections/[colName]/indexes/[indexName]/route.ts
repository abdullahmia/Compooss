import { isProtectedDatabase } from "@compooss/types";
import { indexRepository } from "@/lib/core-modules/index/index.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { protectedDbResponse, readOnlyResponse } from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

type IndexNameParams = {
  params: Promise<{ dbName: string; colName: string; indexName: string }>;
};

export async function DELETE(_req: Request, { params }: IndexNameParams) {
  try {
    const { dbName, colName, indexName } = await params;
    const decodedName = decodeURIComponent(indexName);
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
    const result = await indexRepository.dropIndex({
      databaseName: dbName,
      collectionName: colName,
      indexName: decodedName,
    });
    return NextResponse.json(
      createApiResponse(result, "Index dropped successfully", 200),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("_id_") ? 400 : 500;
    return NextResponse.json(
      createApiResponse(null, message, status),
      { status },
    );
  }
}

export async function PATCH(req: Request, { params }: IndexNameParams) {
  try {
    const { dbName, colName, indexName } = await params;
    const decodedName = decodeURIComponent(indexName);
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
    const body = await req.json();
    const hidden = Boolean(body?.hidden);
    await indexRepository.hideIndex({
      databaseName: dbName,
      collectionName: colName,
      indexName: decodedName,
      hidden,
    });
    return NextResponse.json(
      createApiResponse(
        { ok: true, hidden },
        hidden ? "Index hidden successfully" : "Index unhidden successfully",
        200,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, String(error), 500),
      { status: 500 },
    );
  }
}
