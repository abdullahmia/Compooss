import type { ServerStatusSample } from "@compooss/types";

export const PERFORMANCE_POLL_INTERVAL_MS = 2000;
/** Two minutes of history at the poll interval. */
const MAX_POINTS = 60;

export const OPERATION_TYPES = [
  "insert",
  "query",
  "update",
  "delete",
  "getmore",
  "command",
] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

/** Per-second rates between two consecutive serverStatus samples. */
export interface PerformancePoint {
  /** Server time of the later sample, in ms. */
  time: number;
  ops: Record<OperationType, number>;
  totalOps: number;
  bytesInPerSec: number;
  bytesOutPerSec: number;
  connections: number;
  residentMB: number;
}

export interface PerformanceHistory {
  latest: ServerStatusSample;
  points: PerformancePoint[];
}

/**
 * Adds a sample to the history. serverStatus counters are cumulative, so each
 * point is the change since the previous sample divided by the time between
 * them. A counter going backwards means the server restarted, so that gap is
 * skipped rather than charted as a negative rate.
 */
export function appendSample(
  history: PerformanceHistory | undefined,
  sample: ServerStatusSample,
): PerformanceHistory {
  const previous = history?.latest;
  const points = history?.points ?? [];
  if (!previous || previous.host !== sample.host) {
    return { latest: sample, points: [] };
  }

  const time = new Date(sample.localTime).getTime();
  const seconds = (time - new Date(previous.localTime).getTime()) / 1000;
  const restarted = sample.uptimeSeconds < previous.uptimeSeconds;
  if (seconds <= 0 || restarted) return { latest: sample, points };

  const rate = (current: number, before: number) =>
    Math.max(0, (current - before) / seconds);

  const ops = Object.fromEntries(
    OPERATION_TYPES.map((type) => [
      type,
      rate(sample.opcounters[type], previous.opcounters[type]),
    ]),
  ) as Record<OperationType, number>;

  const point: PerformancePoint = {
    time,
    ops,
    totalOps: OPERATION_TYPES.reduce((sum, type) => sum + ops[type], 0),
    bytesInPerSec: rate(sample.network.bytesIn, previous.network.bytesIn),
    bytesOutPerSec: rate(sample.network.bytesOut, previous.network.bytesOut),
    connections: sample.connections.current,
    residentMB: sample.memory.residentMB,
  };

  return { latest: sample, points: [...points, point].slice(-MAX_POINTS) };
}

export function formatRate(value: number): string {
  if (value >= 100) return Math.round(value).toLocaleString();
  // Number() drops trailing zeros, so axis ticks read 1, 1.5, 2 rather than 1.00.
  return String(Number(value.toFixed(value >= 10 ? 1 : 2)));
}

/** Rounds a raw step up to 1, 2, 2.5 or 5 times a power of ten. */
function niceStep(raw: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / magnitude;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * magnitude;
}

/**
 * Round y-axis ticks from 0 to just above max, about four steps. For byte
 * values the step is chosen in the display unit (KB, MB, ...), so ticks land
 * on 10 KB rather than 10,000 bytes.
 */
export function niceTicks(max: number, kind: "number" | "bytes" = "number"): number[] {
  const unit = kind === "bytes" && max >= 1024 ? 1024 ** Math.floor(Math.log(max) / Math.log(1024)) : 1;
  const scaledMax = max / unit;
  if (scaledMax <= 0) return [0, unit];
  const step = niceStep(scaledMax / 4);
  const ticks: number[] = [];
  for (let tick = 0; tick < scaledMax + step; tick += step) {
    ticks.push(Number((tick * unit).toFixed(6)));
  }
  return ticks;
}

export function formatDuration(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${Math.floor(totalSeconds % 60)}s`;
  return `${Math.floor(totalSeconds)}s`;
}
