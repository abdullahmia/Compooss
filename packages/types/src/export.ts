export type ExportFormat = "json" | "csv";

/**
 * Controls how BSON types are serialised in a JSON export.
 * Mirrors MongoDB Compass's three Extended JSON variants.
 *
 * - "default":   legacy v1 EJSON (e.g. Long → $numberLong, plain Int32/Double).
 * - "relaxed":   v2 relaxed — numbers serialise as plain JS numbers (loses > 2^53).
 * - "canonical": v2 canonical — every numeric type is fully tagged.
 */
export type JsonExportMode = "default" | "relaxed" | "canonical";

export interface ExportOptions {
  format: ExportFormat;
  /** Only used when format === "json". Defaults to "default" (legacy v1). */
  jsonMode?: JsonExportMode;
  /** MongoDB filter object. Defaults to {} (all documents). */
  filter?: Record<string, unknown>;
  /** Max documents to export. 0 = no cap (server applies a hard limit). */
  limit?: number;
}

export interface ImportResult {
  inserted: number;
  failed: number;
  errors: string[];
}

/** "timeseries" and "view" come straight from listCollections. */
export type ExportedCollectionType = "collection" | "timeseries" | "view";

/** A collection or view in a database export. Values are canonical Extended JSON. */
export interface DatabaseExportCollection {
  name: string;
  type: ExportedCollectionType;
  /** Options from listCollections: validator, capped, timeseries, viewOn, pipeline… */
  options: Record<string, unknown>;
  /** Index specs from listIndexes, without the _id index. */
  indexes: Record<string, unknown>[];
  /** Missing for views and for structure-only exports. */
  documents?: Record<string, unknown>[];
}

/** The file written by a database export and read by a database import. */
export interface DatabaseExportFile {
  format: "compooss-database-export";
  version: 1;
  database: string;
  exportedAt: string;
  collections: DatabaseExportCollection[];
}

export interface DatabaseExportRequest {
  /** Collections and views to export. All of them when omitted. */
  collections?: string[];
  /** False writes only the structure: collections, views, options and indexes. */
  includeDocuments?: boolean;
}

/**
 * A database import runs as a series of small requests, so no single request
 * hits the proxy's body size limit and the client can show progress.
 */
export type DatabaseImportRequest =
  | {
      step: "collection";
      name: string;
      type: ExportedCollectionType;
      options: Record<string, unknown>;
      /** Drop the collection first if it already exists. */
      replace: boolean;
    }
  | { step: "documents"; name: string; documents: Record<string, unknown>[] }
  | { step: "indexes"; name: string; indexes: Record<string, unknown>[] };

export interface ImportCollectionStepResult {
  /** False when the collection already existed and was kept. */
  created: boolean;
}

export interface ImportIndexesStepResult {
  created: number;
  errors: string[];
}
