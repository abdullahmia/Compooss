import { isProtectedDatabase } from "@compooss/types";
import { collectionRepository } from "@/lib/core-modules/collection/collection.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import {
  extractErrorMessage,
  protectedDbResponse,
  readOnlyResponse,
} from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

type ColParams = { params: Promise<{ dbName: string; colName: string }> };
 
export async function DELETE(_req: Request, { params }: ColParams) {
  try {
    if (await isReadOnlySession()) return readOnlyResponse();
    const { dbName, colName } = await params;
    if (isProtectedDatabase(dbName)) {
      return NextResponse.json(
        createApiResponse(null, "Access to system databases (admin, local, config) is not allowed.", 403),
        { status: 403 },
      );
    }
 
    const dropped = await collectionRepository.deleteCollection({
      databaseName: dbName,
      collectionName: colName,
    });
 
    if (!dropped) {
      return NextResponse.json(createApiResponse(null, `Collection "${colName}" not found`, 404));
    }
 
    return NextResponse.json(createApiResponse(dropped, `Collection "${colName}" deleted successfully`, 200));
  } catch (error) {
    return NextResponse.json(createApiResponse(null, String(error), 500));
  }
}

/** Renames the collection. Body: { newName } */
export async function PATCH(req: Request, { params }: ColParams) {
  try {
    const { dbName, colName } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();

    const body = (await req.json().catch(() => ({}))) as { newName?: unknown };
    const newName = typeof body.newName === "string" ? body.newName.trim() : "";
    if (!newName || newName.includes("$") || newName.startsWith("system.")) {
      return NextResponse.json(
        createApiResponse(null, "Enter a valid collection name.", 400),
        { status: 400 },
      );
    }
    if (newName === colName) {
      return NextResponse.json(createApiResponse({ name: newName }, "Name unchanged", 200));
    }

    await collectionRepository.renameCollection(dbName, colName, newName);
    return NextResponse.json(
      createApiResponse({ name: newName }, `Collection renamed to "${newName}"`, 200),
    );
  } catch (error) {
    const message = extractErrorMessage(error);
    if (/already exists|target namespace exists/i.test(message)) {
      return NextResponse.json(
        createApiResponse(null, "A collection with that name already exists.", 409),
        { status: 409 },
      );
    }
    return NextResponse.json(createApiResponse(null, message, 500), { status: 500 });
  }
}
