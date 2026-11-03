import type { CollectionInfo, CreateCollectionOptions as DriverCreateOptions } from "mongodb";
import { BaseRepository } from "../base.repository";
import type {
  Collection,
  CreateCollectionInput,
  DeleteCollectionInput,
} from "@compooss/types";

export class CollectionRepository extends BaseRepository {
  /**
   * Returns stats for a single collection (document count, sizes, index count).
   */
  async getCollectionStats(
    databaseName: string,
    collectionName: string,
  ): Promise<{
    documentCount: number;
    storageSize: number;
    size: number;
    avgObjSize: number;
    indexCount: number;
    totalIndexSize: number;
  }> {
    const db = await this.db(databaseName);
    const stats = (await db.command({
      collStats: collectionName,
    })) as Record<string, unknown> | null;

    if (!stats || typeof stats !== "object") {
      const documentCount = await db.collection(collectionName).countDocuments();
      return {
        documentCount,
        storageSize: 0,
        size: 0,
        avgObjSize: 0,
        indexCount: 0,
        totalIndexSize: 0,
      };
    }

    return {
      documentCount: Number(stats.count) || 0,
      storageSize: Number(stats.storageSize) || 0,
      size: Number(stats.size) || 0,
      avgObjSize: Number(stats.avgObjSize) || 0,
      indexCount: Number(stats.nindexes) || 0,
      totalIndexSize: Number(stats.totalIndexSize) || 0,
    };
  }

  /**
   * Lists all collections inside a database with stats (storage size, data size, document count, avg size, indexes).
   */
  async getCollections(databaseName: string): Promise<Collection[]> {
    const db = await this.db(databaseName);
    const collections = await db.listCollections().toArray();
    const withStats = await Promise.all(
      collections.map(async (col) => {
        const options = (col as CollectionInfo).options ?? {};
        const type = col.type ?? "collection";
        let storageSize = 0;
        let size = 0;
        let documentCount = 0;
        let avgObjSize = 0;
        let indexCount = 0;
        let totalIndexSize = 0;

        try {
          const stats = (await db.command({ collStats: col.name })) as Record<string, unknown> | null;
          if (stats && typeof stats === "object") {
            storageSize = Number(stats.storageSize) || 0;
            size = Number(stats.size) || 0;
            documentCount = Number(stats.count) || 0;
            avgObjSize = Number(stats.avgObjSize) || 0;
            indexCount = Number(stats.nindexes) || 0;
            totalIndexSize = Number(stats.totalIndexSize) || 0;
          }
        } catch {
          documentCount = await db.collection(col.name).countDocuments();
        }

        return {
          name: col.name,
          type,
          documentCount,
          options,
          storageSize,
          size,
          avgObjSize,
          indexCount,
          totalIndexSize,
        };
      }),
    );
    return withStats;
  }

  /**
   * Creates a new collection inside an existing database.
   */
  async createCollection(input: CreateCollectionInput): Promise<Collection> {
    const { databaseName, collectionName, options = {} } = input;

    const db = await this.db(databaseName);
    const existing = await db
      .listCollections({ name: collectionName })
      .hasNext();

    if (existing) {
      throw new Error(
        `Collection "${collectionName}" already exists in "${databaseName}".`,
      );
    }

    const driverOptions: DriverCreateOptions = {};
    if (options.capped) {
      driverOptions.capped = true;
      driverOptions.size = options.capped.size;
      if (options.capped.max) driverOptions.max = options.capped.max;
    }
    if (options.timeseries) {
      driverOptions.timeseries = options.timeseries;
      if (options.expireAfterSeconds) {
        driverOptions.expireAfterSeconds = options.expireAfterSeconds;
      }
    }

    const collection = await db.createCollection(collectionName, driverOptions);

    return {
      name: collection.collectionName,
      type: options.timeseries ? "timeseries" : "collection",
      documentCount: 0,
      options: { ...driverOptions },
      storageSize: 0,
      size: 0,
      avgObjSize: 0,
      indexCount: 0,
      totalIndexSize: 0,
    };
  }

  /**
   * Drops a collection from a database.
   */
  /** Renames a collection within its database. Fails if the new name is taken. */
  async renameCollection(
    databaseName: string,
    collectionName: string,
    newName: string,
  ): Promise<void> {
    const db = await this.db(databaseName);
    await db.collection(collectionName).rename(newName);
  }

  async deleteCollection(input: DeleteCollectionInput): Promise<boolean> {
    const { databaseName, collectionName } = input;
    const db = await this.db(databaseName);
    const collection = db.collection(collectionName);
    return collection.drop();
  }
}

export const collectionRepository = new CollectionRepository();
