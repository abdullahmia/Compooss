export interface Collection {
  name: string;
  type: string;
  documentCount: number;
  options: Record<string, unknown>;
  /** Storage size in bytes (disk space allocated). */
  storageSize: number;
  /** Data size in bytes (uncompressed document data). */
  size: number;
  /** Average document size in bytes. */
  avgObjSize: number;
  /** Number of indexes. */
  indexCount: number;
  /** Total index size in bytes. */
  totalIndexSize: number;
}

export type CollectionKind = "standard" | "capped" | "timeseries";

export interface CreateCollectionOptions {
  capped?: { size: number; max?: number };
  timeseries?: {
    timeField: string;
    metaField?: string;
    granularity?: "seconds" | "minutes" | "hours";
  };
  /** Time-series only: delete documents this many seconds after their timeField. */
  expireAfterSeconds?: number;
}
