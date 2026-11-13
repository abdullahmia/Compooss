import { DATABASE_EXPORT_FORMAT } from "@/lib/constants";
import type { DatabaseExportCollection, DatabaseExportFile } from "@compooss/types";

const COLLECTION_TYPES = new Set(["collection", "timeseries", "view"]);

const MAX_BATCH_DOCUMENTS = 1000;
/** Counted in characters, not bytes, leaving room under the proxy's 10 MB body limit for multi-byte text. */
const MAX_BATCH_CHARACTERS = 2_500_000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function checkCollection(value: unknown, index: number): DatabaseExportCollection {
  const label = isObject(value) && typeof value.name === "string" ? `"${value.name}"` : `#${index + 1}`;
  if (!isObject(value) || typeof value.name !== "string" || !value.name) {
    throw new Error(`Collection ${label} has no name.`);
  }
  if (typeof value.type !== "string" || !COLLECTION_TYPES.has(value.type)) {
    throw new Error(`Collection ${label} has an unknown type.`);
  }
  if (!isObject(value.options) || !Array.isArray(value.indexes)) {
    throw new Error(`Collection ${label} is missing its options or indexes.`);
  }
  if (value.documents !== undefined && !Array.isArray(value.documents)) {
    throw new Error(`Collection ${label} has documents that aren't an array.`);
  }
  return value as unknown as DatabaseExportCollection;
}

/** Reads a database export, or throws a message saying what's wrong with the file. */
export function parseDatabaseExport(text: string): DatabaseExportFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON.");
  }

  if (!isObject(data) || data.format !== DATABASE_EXPORT_FORMAT) {
    throw new Error(
      "This isn't a Compooss database export. To import one collection's JSON or CSV, use Import in that collection's Documents tab.",
    );
  }
  if (data.version !== 1) {
    throw new Error(`This export uses format version ${String(data.version)}, which this version of Compooss can't read.`);
  }
  if (typeof data.database !== "string" || !Array.isArray(data.collections)) {
    throw new Error("The export is missing its database name or collections.");
  }

  return { ...(data as unknown as DatabaseExportFile), collections: data.collections.map(checkCollection) };
}

/** Splits documents into batches small enough for one request each. */
export function* documentBatches(
  documents: Record<string, unknown>[],
): Generator<Record<string, unknown>[]> {
  let batch: Record<string, unknown>[] = [];
  let characters = 0;
  for (const document of documents) {
    const size = JSON.stringify(document).length;
    if (batch.length > 0 && (batch.length >= MAX_BATCH_DOCUMENTS || characters + size > MAX_BATCH_CHARACTERS)) {
      yield batch;
      batch = [];
      characters = 0;
    }
    batch.push(document);
    characters += size;
  }
  if (batch.length > 0) yield batch;
}
