import type { CreateDatabaseInput, Database } from "@compooss/types";
import { isProtectedDatabase } from "@compooss/types";
import { BaseRepository } from "../base.repository";

export class DatabaseRepository extends BaseRepository {

  /**
   * Returns a list of all databases with size info (including system databases; they are read-only in the UI).
   */
  async getAllDatabases(): Promise<Database[]> {
    return (await this.getDriver()).listDatabases();
  }

  /**
   * Returns a single database by name, or null if it doesn't exist.
   */
  async getDatabase(databaseName: string): Promise<Database | null> {
    const databases = await (await this.getDriver()).listDatabases();
    return databases.find((db) => db.name === databaseName) ?? null;
  }

  /**
   * Creates a new database by inserting an initial collection.
   * MongoDB doesn't persist empty databases — a collection is required.
   */
  async createDatabase(input: CreateDatabaseInput): Promise<Database> {
    const { databaseName, initialCollection } = input;

    if (isProtectedDatabase(databaseName)) {
      throw new Error(`Creating a database named "${databaseName}" is prohibited (reserved for system use).`);
    }

    const existing = await this.getDatabase(databaseName);
    if (existing) {
      throw new Error(`Database "${databaseName}" already exists.`);
    }

    const db = await this.db(databaseName);
    await db.createCollection(initialCollection);

    const created = await this.getDatabase(databaseName);
    if (!created) {
      throw new Error(`Failed to create database "${databaseName}".`);
    }

    return created;
  }

  /**
   * Drops an entire database and all its collections.
   * Throws if the database is a protected system database (admin, local, config).
   */
  async deleteDatabase(databaseName: string): Promise<boolean> {
    if (isProtectedDatabase(databaseName)) {
      throw new Error(`Dropping the '${databaseName}' database is prohibited.`);
    }

    const db = await this.db(databaseName);
    const result = await db.dropDatabase();
    return result;
  }
}

// Singleton export
export const databaseRepository = new DatabaseRepository();