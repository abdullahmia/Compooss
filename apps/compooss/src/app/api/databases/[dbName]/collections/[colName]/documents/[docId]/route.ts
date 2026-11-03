import { isProtectedDatabase } from "@compooss/types";
import { documentRepository } from "@/lib/core-modules/document/document.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { protectedDbResponse, readOnlyResponse } from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

type DocMutationParams = {
  params: Promise<{ dbName: string; colName: string; docId: string }>;
};

export async function PATCH(req: Request, { params }: DocMutationParams) {
  try {
    const { dbName, colName, docId } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
    const body = await req.json();

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return NextResponse.json(
        createApiResponse(null, "A non-empty update object is required", 400),
        { status: 400 },
      );
    }

    const { _id: _omit, ...payload } = body as Record<string, unknown>;
    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        createApiResponse(null, "Update must contain at least one field besides _id", 400),
        { status: 400 },
      );
    }

    const updated = await documentRepository.updateDocument({
      databaseName: dbName,
      collectionName: colName,
      documentId: docId,
      payload,
    });
 
    if (!updated) {
      return NextResponse.json(
        createApiResponse(null, `Document "${docId}" not found`, 404),
        { status: 404 },
      );
    }
    return NextResponse.json(createApiResponse(updated, "Document updated successfully", 200));
  } catch (error) {
    return NextResponse.json(createApiResponse(null, String(error), 500), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: DocMutationParams) {
  try {
    const { dbName, colName, docId } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();
 
    const deleted = await documentRepository.deleteDocument({
      databaseName: dbName,
      collectionName: colName,
      documentId: docId,
    });
 
    if (!deleted) {
      return NextResponse.json(
        createApiResponse(null, `Document "${docId}" not found`, 404),
        { status: 404 },
      );
    }
 
    return NextResponse.json(
      createApiResponse(deleted, "Document deleted successfully", 200),
    );
  } catch (error) {
    return NextResponse.json(createApiResponse(null, String(error), 500));
  }
}