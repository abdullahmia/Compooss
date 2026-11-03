import { serverRepository } from "@/lib/core-modules/server/server.repository";
import { createApiResponse } from "@/lib/utils/api-response.util";
import { extractErrorMessage, readOnlyResponse } from "@/lib/utils/api-route.util";
import { isReadOnlySession } from "@/lib/utils/session.util";
import type { ProfilingLevel } from "@compooss/types";
import { NextResponse, type NextRequest } from "next/server";

function badRequest(message: string) {
  return NextResponse.json(createApiResponse(null, message, 400), { status: 400 });
}

/** GET ?db=name — profiling level and recent profiled operations for one database. */
export async function GET(req: NextRequest) {
  const dbName = req.nextUrl.searchParams.get("db");
  if (!dbName) return badRequest("db is required.");
  try {
    const profiler = await serverRepository.getProfiler(dbName);
    return NextResponse.json(createApiResponse(profiler, "Profiler status", 200));
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}

/** PUT { db, level, slowms? } — changes the database's profiling level. */
export async function PUT(req: NextRequest) {
  try {
    if (await isReadOnlySession()) return readOnlyResponse();
    const body = (await req.json().catch(() => ({}))) as {
      db?: unknown;
      level?: unknown;
      slowms?: unknown;
    };
    if (typeof body.db !== "string" || !body.db) return badRequest("db is required.");
    if (body.level !== 0 && body.level !== 1 && body.level !== 2) {
      return badRequest("level must be 0 (off), 1 (slow operations) or 2 (all operations).");
    }
    let slowms: number | undefined;
    if (body.slowms !== undefined) {
      slowms = Number(body.slowms);
      if (!Number.isInteger(slowms) || slowms < 0) {
        return badRequest("slowms must be a whole number of milliseconds.");
      }
    }

    await serverRepository.setProfilingLevel(body.db, body.level as ProfilingLevel, slowms);
    return NextResponse.json(createApiResponse(null, "Profiling level updated", 200));
  } catch (error) {
    return NextResponse.json(createApiResponse(null, extractErrorMessage(error), 500), {
      status: 500,
    });
  }
}
