import { isProtectedDatabase } from "@compooss/types";
import { documentRepository } from "@/lib/core-modules/document/document.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import {
  extractErrorMessage,
  protectedDbResponse,
  readOnlyResponse,
} from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

type DuplicateParams = {
  params: Promise<{ dbName: string; colName: string; docId: string }>;
};

/** Inserts a copy of the document under a new _id. */
export async function POST(_req: Request, { params }: DuplicateParams) {
  try {
    const { dbName, colName, docId } = await params;
    if (isProtectedDatabase(dbName)) return protectedDbResponse();
    if (await isReadOnlySession()) return readOnlyResponse();

    const copy = await documentRepository.duplicateDocument({
      databaseName: dbName,
      collectionName: colName,
      documentId: docId,
    });
    if (!copy) {
      return NextResponse.json(
        createApiResponse(null, `Document "${docId}" not found`, 404),
        { status: 404 },
      );
    }
    return NextResponse.json(
      createApiResponse(copy, "Document duplicated", 201),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}
