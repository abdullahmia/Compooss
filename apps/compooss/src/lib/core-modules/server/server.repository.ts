import type {
  CurrentOperation,
  ProfilerStatus,
  ProfilingLevel,
  ServerStatusSample,
} from "@compooss/types";
import { BSON, type Document } from "mongodb";
import { BaseRepository } from "../base.repository";

const COMMAND_PREVIEW_LENGTH = 400;

/** Compact, readable JSON for showing a command in a table cell. */
function previewCommand(value: unknown): string {
  try {
    const json = BSON.EJSON.stringify(value ?? {}, { relaxed: true });
    return json.length > COMMAND_PREVIEW_LENGTH
      ? `${json.slice(0, COMMAND_PREVIEW_LENGTH)}…`
      : json;
  } catch {
    return "";
  }
}

/** killOp takes numeric opids on a single server and "shard:opid" strings on mongos. */
function parseOpid(opid: string): string | number {
  return /^\d+$/.test(opid) ? Number(opid) : opid;
}

export class ServerRepository extends BaseRepository {
  private async admin() {
    return (await this.getDriver()).getAdmin();
  }

  async getStatus(): Promise<ServerStatusSample> {
    const status = await (await this.admin()).serverStatus();
    const opcounters = status.opcounters ?? {};
    return {
      host: String(status.host ?? ""),
      version: String(status.version ?? ""),
      uptimeSeconds: Number(status.uptime ?? 0),
      localTime: new Date(status.localTime ?? Date.now()).toISOString(),
      connections: {
        current: Number(status.connections?.current ?? 0),
        available: Number(status.connections?.available ?? 0),
        active:
          status.connections?.active !== undefined
            ? Number(status.connections.active)
            : undefined,
      },
      opcounters: {
        insert: Number(opcounters.insert ?? 0),
        query: Number(opcounters.query ?? 0),
        update: Number(opcounters.update ?? 0),
        delete: Number(opcounters.delete ?? 0),
        getmore: Number(opcounters.getmore ?? 0),
        command: Number(opcounters.command ?? 0),
      },
      network: {
        bytesIn: Number(status.network?.bytesIn ?? 0),
        bytesOut: Number(status.network?.bytesOut ?? 0),
      },
      memory: {
        residentMB: Number(status.mem?.resident ?? 0),
        virtualMB: Number(status.mem?.virtual ?? 0),
      },
    };
  }

  /**
   * Active client operations, longest-running first. Left out: idle internal
   * threads, this currentOp itself, and drivers' hello heartbeats, which wait
   * up to maxAwaitTimeMS by design and would always look slow.
   */
  async getCurrentOperations(): Promise<CurrentOperation[]> {
    const result = await (await this.admin()).command({ currentOp: 1, active: true });
    const ops = (result.inprog ?? []) as Document[];
    const isNoise = (op: Document) => {
      const command = op.command ?? {};
      return (
        op.op === "none" ||
        "currentOp" in command ||
        "hello" in command ||
        "isMaster" in command ||
        "ismaster" in command
      );
    };
    return ops
      .filter((op) => !isNoise(op))
      .map((op) => ({
        opid: op.opid,
        op: String(op.op ?? ""),
        ns: String(op.ns ?? ""),
        secsRunning: Number(
          op.secs_running ?? Math.floor(Number(op.microsecs_running ?? 0) / 1e6),
        ),
        client: op.client ?? op.client_s,
        appName: op.appName,
        description: op.desc,
        planSummary: op.planSummary,
        waitingForLock: Boolean(op.waitingForLock),
        command: previewCommand(op.command ?? op.query),
      }))
      .sort((a, b) => b.secsRunning - a.secsRunning);
  }

  async killOperation(opid: string): Promise<void> {
    await (await this.admin()).command({ killOp: 1, op: parseOpid(opid) });
  }

  /** The database's profiling level and its most recent profiled operations. */
  async getProfiler(databaseName: string, limit = 50): Promise<ProfilerStatus> {
    const db = await this.db(databaseName);
    const [status, entries] = await Promise.all([
      db.command({ profile: -1 }),
      db
        .collection("system.profile")
        .find({}, { sort: { ts: -1 }, limit })
        .toArray(),
    ]);
    return {
      level: Number(status.was ?? 0) as ProfilingLevel,
      slowms: Number(status.slowms ?? 100),
      entries: entries.map((entry) => ({
        ts: new Date(entry.ts).toISOString(),
        op: String(entry.op ?? ""),
        ns: String(entry.ns ?? ""),
        millis: Number(entry.millis ?? 0),
        planSummary: entry.planSummary,
        docsExamined: entry.docsExamined,
        keysExamined: entry.keysExamined,
        nreturned: entry.nreturned,
        command: previewCommand(entry.command ?? entry.query),
      })),
    };
  }

  /** 0 = off, 1 = operations slower than slowms, 2 = everything. */
  async setProfilingLevel(
    databaseName: string,
    level: ProfilingLevel,
    slowms?: number,
  ): Promise<void> {
    const db = await this.db(databaseName);
    const command: Document = { profile: level };
    if (slowms !== undefined) command.slowms = slowms;
    await db.command(command);
  }
}

export const serverRepository = new ServerRepository();
