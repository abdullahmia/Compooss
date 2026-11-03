import { aggregationRepository } from "@/lib/core-modules/aggregation/aggregation.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { extractErrorMessage, readOnlyResponse } from "@/lib/utils/api-route.util";
import { hasWriteStage } from "@/lib/utils/read-only.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import { isProtectedDatabase } from "@compooss/types";
import { NextResponse } from "next/server";

type AggregateParams = {
  params: Promise<{ dbName: string; colName: string }>;
};

export async function POST(req: Request, { params }: AggregateParams) {
  try {
    const { dbName, colName } = await params;
    const body = (await req.json()) as {
      pipeline?: Record<string, unknown>[];
      action?: "run" | "createView";
      viewName?: string;
      upToIndex?: number;
      options?: {
        maxTimeMS?: number;
        sampleSize?: number;
        limit?: number;
        allowDiskUse?: boolean;
      };
    };

    if (body.action === "createView") {
      if (isProtectedDatabase(dbName)) {
        return NextResponse.json(
          createApiResponse(null, `Database "${dbName}" is read-only.`, 403),
          { status: 403 },
        );
      }
      if (await isReadOnlySession()) return readOnlyResponse();

      if (!body.viewName || typeof body.viewName !== "string") {
        return NextResponse.json(
          createApiResponse(null, "viewName is required.", 400),
          { status: 400 },
        );
      }

      if (!Array.isArray(body.pipeline)) {
        return NextResponse.json(
          createApiResponse(null, "pipeline must be an array.", 400),
          { status: 400 },
        );
      }

      const result = await aggregationRepository.createView(
        dbName,
        body.viewName,
        colName,
        body.pipeline,
      );

      return NextResponse.json(
        createApiResponse(result, "View created successfully", 201),
        { status: 201 },
      );
    }

    if (!Array.isArray(body.pipeline)) {
      return NextResponse.json(
        createApiResponse(null, "pipeline must be an array.", 400),
        { status: 400 },
      );
    }

    if (hasWriteStage(body.pipeline) && (await isReadOnlySession())) {
      return readOnlyResponse();
    }

    const options = body.options ?? {};

    if (typeof body.upToIndex === "number") {
      const result = await aggregationRepository.runPartialPipeline(
        dbName,
        colName,
        body.pipeline,
        body.upToIndex,
        options,
      );
      return NextResponse.json(
        createApiResponse(result, "Partial aggregation completed", 200),
        { status: 200 },
      );
    }

    const result = await aggregationRepository.runPipeline(
      dbName,
      colName,
      body.pipeline,
      options,
    );

    return NextResponse.json(
      createApiResponse(result, "Aggregation completed", 200),
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      createApiResponse(null, extractErrorMessage(error), 500),
      { status: 500 },
    );
  }
}
