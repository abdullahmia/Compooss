import { DATABASE_EXPORT_FORMAT } from "@/lib/constants/export.constants";
import type {
  DatabaseExportCollection,
  ExportedCollectionType,
  ImportCollectionStepResult,
  ImportIndexesStepResult,
  ImportResult,
} from "@compooss/types";
import {
  BSON,
  MongoBulkWriteError,
  type CollectionInfo,
  type CreateCollectionOptions,
  type Db,
  type Document,
  type IndexDescription,
} from "mongodb";
import { BaseRepository } from "../base.repository";

/** Canonical Extended JSON keeps every BSON type, including Int64 and Decimal128. */
const CANONICAL = { relaxed: false } as const;

/** The export stream is flushed about every 64 KB rather than once per document. */
const CHUNK_SIZE = 64 * 1024;

/** Index fields the server fills in itself. */
const SERVER_INDEX_FIELDS = new Set(["v", "ns"]);

/** Write errors returned per batch. Re-importing into a full collection fails every document. */
const MAX_BATCH_ERRORS = 20;

/** system.views, system.buckets.*, system.profile and friends are managed by MongoDB. */
const isSystemCollection = (name: string) => name.startsWith("system.");

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function exportedType(type: string | undefined): ExportedCollectionType {
  return type === "view" || type === "timeseries" ? type : "collection";
}

/**
 * Writes the export file by hand so documents stream one at a time instead of
 * the whole database sitting in memory.
 */
async function* exportChunks(
  db: Db,
  infos: CollectionInfo[],
  includeDocuments: boolean,
): AsyncGenerator<string> {
  const header = {
    format: DATABASE_EXPORT_FORMAT,
    version: 1,
    database: db.databaseName,
    exportedAt: new Date().toISOString(),
  };
  // Reopen the header object to append the collections array.
  yield `${JSON.stringify(header, null, 2).slice(0, -2)},\n  "collections": [`;

  for (const [index, info] of infos.entries()) {
    const type = exportedType(info.type);
    const indexes = type === "view" ? [] : await db.collection(info.name).indexes();
    const entry: Omit<DatabaseExportCollection, "documents"> = {
      name: info.name,
      type,
      options: BSON.EJSON.serialize(info.options ?? {}, CANONICAL),
      indexes: indexes
        .filter((spec) => spec.name !== "_id_")
        .map((spec) =>
          BSON.EJSON.serialize(
            Object.fromEntries(Object.entries(spec).filter(([key]) => !SERVER_INDEX_FIELDS.has(key))),
            CANONICAL,
          ),
        ),
    };
    // Leave the object open so the documents can follow.
    yield `${index === 0 ? "" : ","}\n    ${JSON.stringify(entry).slice(0, -1)}`;

    if (type !== "view" && includeDocuments) {
      yield `, "documents": [`;
      let buffer = "";
      let count = 0;
      // Without promoteValues the driver keeps Int32, Int64 and Double apart
      // instead of turning them all into JS numbers.
      for await (const doc of db.collection(info.name).find({}, { promoteValues: false })) {
        buffer += `${count === 0 ? "" : ","}\n      ${BSON.EJSON.stringify(doc, CANONICAL)}`;
        count++;
        if (buffer.length >= CHUNK_SIZE) {
          yield buffer;
          buffer = "";
        }
      }
      yield `${buffer}${count === 0 ? "" : "\n    "}]`;
    }
    yield "}";
  }

  yield "\n  ]\n}\n";
}

/**
 * Time series options as listCollections reports them include bucket settings
 * derived from the granularity, which createCollection rejects alongside it.
 */
function creatableOptions(options: Document): CreateCollectionOptions {
  const timeseries = options.timeseries as Document | undefined;
  if (!timeseries?.granularity) return options as CreateCollectionOptions;
  const settings = Object.entries(timeseries).filter(
    ([key]) => key !== "bucketMaxSpanSeconds" && key !== "bucketRoundingSeconds",
  );
  return { ...options, timeseries: Object.fromEntries(settings) } as CreateCollectionOptions;
}

export class DatabaseExportRepository extends BaseRepository {
  /**
   * Streams a DatabaseExportFile. Views come last, after the collections they
   * read from. The database handle is resolved up front because the session
   * lookup only works while the request is being handled.
   */
  async createExportStream(
    dbName: string,
    options: { collections?: string[]; includeDocuments: boolean },
  ): Promise<ReadableStream<Uint8Array>> {
    const db = await this.db(dbName);
    const selected = options.collections ? new Set(options.collections) : null;
    const infos = ((await db.listCollections().toArray()) as CollectionInfo[])
      .filter((info) => !isSystemCollection(info.name) && (!selected || selected.has(info.name)))
      .sort(
        (a, b) =>
          Number(a.type === "view") - Number(b.type === "view") || a.name.localeCompare(b.name),
      );

    if (selected) {
      const missing = [...selected].filter((name) => !infos.some((info) => info.name === name));
      if (missing.length > 0) {
        throw new Error(`Not found in ${dbName}: ${missing.join(", ")}`);
      }
    }

    const chunks = exportChunks(db, infos, options.includeDocuments);
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { value, done } = await chunks.next();
          if (done) controller.close();
          else controller.enqueue(encoder.encode(value));
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        await chunks.return(undefined);
      },
    });
  }

  /**
   * Creates a collection or view before its documents arrive. An existing one
   * is kept, or with `replace`, dropped and created again.
   */
  async prepareCollection(
    dbName: string,
    input: { name: string; type: ExportedCollectionType; options: Document; replace: boolean },
  ): Promise<ImportCollectionStepResult> {
    const db = await this.db(dbName);
    const options = BSON.EJSON.deserialize(input.options, CANONICAL) as Document;
    if (input.type === "view" && typeof options.viewOn !== "string") {
      throw new Error(`View "${input.name}" has no viewOn in the export.`);
    }

    const exists = (await db.listCollections({ name: input.name }, { nameOnly: true }).toArray()).length > 0;
    if (exists && !input.replace) return { created: false };
    if (exists) await db.dropCollection(input.name);

    await db.createCollection(input.name, creatableOptions(options));
    return { created: true };
  }

  /** Inserts a batch, keeping each _id. Duplicates and other bad documents are counted, not fatal. */
  async insertDocuments(
    dbName: string,
    collectionName: string,
    documents: Document[],
  ): Promise<ImportResult> {
    if (documents.length === 0) return { inserted: 0, failed: 0, errors: [] };
    const db = await this.db(dbName);
    const docs = BSON.EJSON.deserialize(documents, CANONICAL) as Document[];

    try {
      const result = await db.collection(collectionName).insertMany(docs, { ordered: false });
      return { inserted: result.insertedCount, failed: 0, errors: [] };
    } catch (error) {
      if (!(error instanceof MongoBulkWriteError)) throw error;
      const writeErrors = Array.isArray(error.writeErrors) ? error.writeErrors : [error.writeErrors];
      return {
        inserted: error.insertedCount,
        failed: docs.length - error.insertedCount,
        errors: writeErrors.slice(0, MAX_BATCH_ERRORS).map((writeError) => writeError.errmsg ?? "Insert failed"),
      };
    }
  }

  /** Creates indexes one at a time so one bad spec doesn't stop the rest. */
  async createIndexes(
    dbName: string,
    collectionName: string,
    indexes: Document[],
  ): Promise<ImportIndexesStepResult> {
    const collection = (await this.db(dbName)).collection(collectionName);
    let created = 0;
    const errors: string[] = [];

    for (const raw of indexes) {
      const spec = BSON.EJSON.deserialize(raw, CANONICAL) as IndexDescription;
      try {
        await collection.createIndexes([spec]);
        created++;
      } catch (error) {
        errors.push(`Index ${spec.name ?? JSON.stringify(spec.key)}: ${errorMessage(error)}`);
      }
    }
    return { created, errors };
  }
}

export const databaseExportRepository = new DatabaseExportRepository();
