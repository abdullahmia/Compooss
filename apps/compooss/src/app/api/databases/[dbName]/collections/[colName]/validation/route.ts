import { validationRepository } from "@/lib/core-modules/validation/validation.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { extractErrorMessage, readOnlyResponse } from "@/lib/utils/api-route.util";
import { isProtectedDatabase } from "@compooss/types";
import { NextResponse } from "next/server";

type ValidationParams = { params: Promise<{ dbName: string; colName: string }> };

export async function GET(_req: Request, { params }: ValidationParams) {
  try {
    const { dbName, colName } = await params;
    const result = await validationRepository.getValidation(dbName, colName);

    return NextResponse.json(
      createApiResponse(result, "Validation rules retrieved", 200),
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, extractErrorMessage(error), 500),
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: ValidationParams) {
  try {
    const { dbName, colName } = await params;

    if (isProtectedDatabase(dbName)) {
      return NextResponse.json(
        createApiResponse(null, `Database "${dbName}" is read-only.`, 403),
        { status: 403 },
      );
    }
    if (await isReadOnlySession()) return readOnlyResponse();

    const body = (await req.json()) as {
      validator?: Record<string, unknown>;
      validationLevel?: string;
      validationAction?: string;
    };

    if (!body.validator || typeof body.validator !== "object") {
      return NextResponse.json(
        createApiResponse(null, "validator must be a JSON object.", 400),
        { status: 400 },
      );
    }

    const validLevels = ["off", "moderate", "strict"];
    const validActions = ["error", "warn"];

    const level = validLevels.includes(body.validationLevel ?? "")
      ? (body.validationLevel as "off" | "moderate" | "strict")
      : "strict";
    const action = validActions.includes(body.validationAction ?? "")
      ? (body.validationAction as "error" | "warn")
      : "error";

    const result = await validationRepository.updateValidation({
      databaseName: dbName,
      collectionName: colName,
      validator: body.validator,
      validationLevel: level,
      validationAction: action,
    });

    return NextResponse.json(
      createApiResponse(result, "Validation rules updated", 200),
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, extractErrorMessage(error), 500),
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: ValidationParams) {
  try {
    const { dbName, colName } = await params;
    const body = (await req.json().catch(() => ({}))) as { sampleSize?: number };
    const sampleSize = typeof body?.sampleSize === "number" ? body.sampleSize : undefined;

    const result = await validationRepository.checkDocuments({
      databaseName: dbName,
      collectionName: colName,
      sampleSize,
    });

    return NextResponse.json(
      createApiResponse(result, "Validation check completed", 200),
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, extractErrorMessage(error), 500),
      { status: 500 },
    );
  }
}
