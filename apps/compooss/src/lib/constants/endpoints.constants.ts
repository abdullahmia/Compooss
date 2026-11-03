export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    session: "/auth/session",
  },
  connection: {
    connect: "/connection/connect",
    disconnect: "/connection/disconnect",
    status: "/connection/status",
    test: "/connection/test",
  },
  databases: {
    root: "/databases",
    byName: (dbName: string) => `/databases/${dbName}`,
  },
  collections: {
    root: (db: string) => `/databases/${db}/collections`,
    byName: (db: string, colName: string) => `/databases/${db}/collections/${colName}`,
  },
  documents: {
    all: (db: string, collection: string) => `/databases/${db}/collections/${collection}/documents`,
    byId: (db: string, collection: string, docId: string) =>
      `/databases/${db}/collections/${collection}/documents/${encodeURIComponent(docId)}`,
    duplicate: (db: string, collection: string, docId: string) =>
      `/databases/${db}/collections/${collection}/documents/${encodeURIComponent(docId)}/duplicate`,
  },
  indexes: {
    root: (db: string, col: string) =>
      `/databases/${db}/collections/${col}/indexes`,
    byName: (db: string, col: string, indexName: string) =>
      `/databases/${db}/collections/${col}/indexes/${encodeURIComponent(indexName)}`,
  },
  schema: {
    root: (db: string, col: string) =>
      `/databases/${db}/collections/${col}/schema`,
  },
  validation: {
    root: (db: string, col: string) =>
      `/databases/${db}/collections/${col}/validation`,
  },
  aggregation: {
    root: (db: string, col: string) =>
      `/databases/${db}/collections/${col}/aggregate`,
  },
  export: {
    root: (db: string, col: string) =>
      `/databases/${db}/collections/${col}/export`,
  },
  import: {
    root: (db: string, col: string) =>
      `/databases/${db}/collections/${col}/import`,
  },
  shell: {
    eval: "/shell/eval",
  },
  server: {
    status: "/server/status",
    operations: "/server/operations",
    operationById: (opid: string | number) =>
      `/server/operations/${encodeURIComponent(String(opid))}`,
    profiler: "/server/profiler",
  },
}