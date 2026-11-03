/** The parts of serverStatus the Performance view charts. Counters are cumulative. */
export interface ServerStatusSample {
  host: string;
  version: string;
  uptimeSeconds: number;
  /** Server clock when the sample was taken (ISO string). */
  localTime: string;
  connections: { current: number; available: number; active?: number };
  opcounters: {
    insert: number;
    query: number;
    update: number;
    delete: number;
    getmore: number;
    command: number;
  };
  network: { bytesIn: number; bytesOut: number };
  memory: { residentMB: number; virtualMB: number };
}

export interface CurrentOperation {
  opid: string | number;
  op: string;
  ns: string;
  secsRunning: number;
  client?: string;
  appName?: string;
  description?: string;
  planSummary?: string;
  waitingForLock: boolean;
  /** JSON summary of the command, truncated. */
  command: string;
}

export type ProfilingLevel = 0 | 1 | 2;

export interface ProfilerEntry {
  ts: string;
  op: string;
  ns: string;
  millis: number;
  planSummary?: string;
  docsExamined?: number;
  keysExamined?: number;
  nreturned?: number;
  /** JSON summary of the command, truncated. */
  command: string;
}

export interface ProfilerStatus {
  level: ProfilingLevel;
  slowms: number;
  entries: ProfilerEntry[];
}
