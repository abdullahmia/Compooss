import type { MongoDriver } from "@/lib/driver/mongodb.driver";
import { getSessionDriver } from "@/lib/utils/session.util";

/**
 * All repositories extend this class.
 * Resolves the requesting browser's driver from its session cookie and
 * provides a db() helper. Throws if that browser has no active connection.
 */
export abstract class BaseRepository {
  protected getDriver(): Promise<MongoDriver> {
    return getSessionDriver();
  }

  protected async db(dbName: string) {
    return (await this.getDriver()).getDb(dbName);
  }
}
