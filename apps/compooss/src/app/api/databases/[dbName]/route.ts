import { isProtectedDatabase } from "@compooss/types";
import { databaseRepository } from "@/lib/core-modules/database/database.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { readOnlyResponse } from "@/lib/utils/api-route.util";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ dbName?: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { dbName } = await params;
  if (!dbName) {
    return NextResponse.json(
      createApiResponse(null, "Missing database name.", 400),
      { status: 400 },
    );
  }
  if (isProtectedDatabase(dbName)) {
    return NextResponse.json(
      createApiResponse(null, "Access to system databases is not allowed.", 403),
      { status: 403 },
    );
  }
  const database = await databaseRepository.getDatabase(dbName);
  if (!database) {
    return NextResponse.json(
      createApiResponse(null, "Database not found.", 404),
      { status: 404 },
    );
  }
  return NextResponse.json(
    createApiResponse(database, "Database found.", 200),
    { status: 200 },
  );
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  if (await isReadOnlySession()) return readOnlyResponse();
  const { dbName } = await params;
  if (!dbName) {
    return NextResponse.json(
      createApiResponse(null, "Missing database name.", 400),
      { status: 400 },
    );
  }

  try {
    await databaseRepository.deleteDatabase(dbName);
    return NextResponse.json(
      createApiResponse(null, "Database deleted successfully.", 200),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    const isProhibited = message.toLowerCase().includes("prohibited");
    const isValidation = message.toLowerCase().includes("already exists") || message.toLowerCase().includes("does not exist");

    if (isProhibited) {
      return NextResponse.json(
        createApiResponse(null, message, 403),
        { status: 403 },
      );
    }
    if (isValidation) {
      return NextResponse.json(
        createApiResponse(null, message, 400),
        { status: 400 },
      );
    }

    console.error("[DELETE /api/databases/[dbName]]", error);
    return NextResponse.json(
      createApiResponse(null, "Failed to delete database. Please try again.", 500),
      { status: 500 },
    );
  }
}
