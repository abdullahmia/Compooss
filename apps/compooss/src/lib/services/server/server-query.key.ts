export const SERVER_QUERY_KEYS = {
  /** Keyed by connection so history from one server never mixes into another's. */
  status: (connection: string) => ["server", "status", connection] as const,
  operations: (connection: string) => ["server", "operations", connection] as const,
  profiler: (connection: string, db: string) => ["server", "profiler", connection, db] as const,
} as const;
