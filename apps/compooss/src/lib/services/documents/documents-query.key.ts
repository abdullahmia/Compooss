export const DOCUMENTS_QUERY_KEYS = {
  byDatabase: (db: string) => ["documents", db] as const,
  list: (db: string, collection: string, params?: Record<string, unknown>) =>
    params ? (["documents", db, collection, params] as const) : (["documents", db, collection] as const),
} as const;
