import { isProtectedDatabase, type CreateCollectionOptions } from "@compooss/types";
import { collectionRepository } from "@/lib/core-modules/collection/collection.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { parseCollectionOptions } from "@/lib/utils/collection-options.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { readOnlyResponse } from "@/lib/utils/api-route.util";
import { NextResponse, type NextRequest } from "next/server";

interface DbParamProps {
  params: Promise<{ dbName?: string }>;
}

export async function GET(req: NextRequest, { params }: DbParamProps) {
  const { dbName } = await params;
  if (!dbName) {
    return NextResponse.json(
      createApiResponse(null, "Missing dbName parameter", 400),
      { status: 400 },
    );
  }
  const collections = await collectionRepository.getCollections(dbName);
  return NextResponse.json(
    createApiResponse(collections, "Collections fetched successfully", 200),
  );
}

export async function POST(req: NextRequest, { params }: DbParamProps) {
  const { dbName } = await params;
  if (!dbName) {
    return NextResponse.json(
      createApiResponse(null, "Missing dbName parameter", 400),
      { status: 400 },
    );
  }
  if (isProtectedDatabase(dbName)) {
    return NextResponse.json(
      createApiResponse(null, "Access to system databases (admin, local, config) is not allowed.", 403),
      { status: 403 },
    );
  }

  if (await isReadOnlySession()) return readOnlyResponse();
  let body: { collectionName?: string; options?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiResponse(null, "Invalid request body", 400),
      { status: 400 },
    );
  }

  const collectionName = body?.collectionName;
  if (!collectionName || typeof collectionName !== "string") {
    return NextResponse.json(
      createApiResponse(null, "Collection name is required.", 400),
      { status: 400 },
    );
  }

  const trimmed = collectionName.trim();
  if (!trimmed) {
    return NextResponse.json(
      createApiResponse(null, "Collection name is required.", 400),
      { status: 400 },
    );
  }

  let options: CreateCollectionOptions | undefined;
  try {
    options = parseCollectionOptions(body.options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid collection options.";
    return NextResponse.json(createApiResponse(null, message, 400), { status: 400 });
  }

  try {
    const collection = await collectionRepository.createCollection({
      databaseName: dbName,
      collectionName: trimmed,
      options,
    });
    return NextResponse.json(
      createApiResponse(collection, "Collection created successfully.", 201),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create collection.";
    const isConflict = message.toLowerCase().includes("already exists");
    return NextResponse.json(
      createApiResponse(null, message, isConflict ? 409 : 500),
      { status: isConflict ? 409 : 500 },
    );
  }
}
