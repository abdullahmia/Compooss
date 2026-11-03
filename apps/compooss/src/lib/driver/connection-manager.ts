import type { MongoClientOptions } from "mongodb";
import type { ConnectionStatus, ConnectionTestResult } from "@compooss/types";
import {
  classifyMongoError,
  DOCKER_LOCALHOST_HINT,
  isAuthError,
  isLoopbackUri,
  isRunningInDocker,
  maskUri,
  resolveDockerHostCandidates,
} from "@/lib/utils/connection.util";
import { MongoDriver } from "./mongodb.driver";

class ConnectionManager {
  private static _instance: ConnectionManager | null = null;
  private activeDriver: MongoDriver | null = null;
  private activeUri: string | null = null;

  static getInstance(): ConnectionManager {
    if (!ConnectionManager._instance) {
      ConnectionManager._instance = new ConnectionManager();
    }
    return ConnectionManager._instance;
  }

  /**
   * Opens a pinged driver for `uri`. When a localhost URI is unreachable from
   * inside Docker, retries against the Docker host aliases and returns the URI
   * that worked. Throws an Error with a user-facing message.
   */
  private async openDriver(
    uri: string,
    options?: MongoClientOptions,
  ): Promise<{ driver: MongoDriver; uri: string }> {
    const driver = new MongoDriver(uri, options);
    try {
      await driver.ping();
      return { driver, uri };
    } catch (err) {
      await driver.disconnect();

      if (isAuthError(err)) {
        throw new Error(classifyMongoError(err));
      }

      for (const fallback of await resolveDockerHostCandidates(uri)) {
        const fallbackDriver = new MongoDriver(fallback, options);
        try {
          await fallbackDriver.ping();
          return { driver: fallbackDriver, uri: fallback };
        } catch (fallbackErr) {
          await fallbackDriver.disconnect();
          if (isAuthError(fallbackErr)) {
            throw new Error(classifyMongoError(fallbackErr));
          }
        }
      }

      if (isRunningInDocker() && isLoopbackUri(uri)) {
        throw new Error(`${classifyMongoError(err)} ${DOCKER_LOCALHOST_HINT}`);
      }
      throw new Error(classifyMongoError(err));
    }
  }

  async connect(
    uri: string,
    options?: MongoClientOptions,
  ): Promise<ConnectionStatus> {
    if (this.activeDriver) {
      await this.disconnect();
    }

    const { driver, uri: connectedUri } = await this.openDriver(uri, options);
    this.activeDriver = driver;
    this.activeUri = connectedUri;

    const serverInfo = await driver.getServerInfo();
    return {
      connected: true,
      maskedUri: maskUri(connectedUri),
      ...(connectedUri !== uri && { resolvedUri: connectedUri }),
      serverInfo,
    };
  }

  async disconnect(): Promise<void> {
    if (this.activeDriver) {
      await this.activeDriver.disconnect();
      this.activeDriver = null;
      this.activeUri = null;
    }
  }

  async testConnection(
    uri: string,
    options?: MongoClientOptions,
  ): Promise<ConnectionTestResult> {
    let opened: { driver: MongoDriver; uri: string };
    try {
      opened = await this.openDriver(uri, options);
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Connection failed.",
      };
    }

    try {
      const serverInfo = await opened.driver.getServerInfo();
      return {
        ok: true,
        message: "Connection successful",
        ...(opened.uri !== uri && { resolvedUri: opened.uri }),
        serverInfo,
      };
    } finally {
      await opened.driver.disconnect();
    }
  }

  getActiveDriver(): MongoDriver {
    if (!this.activeDriver) {
      throw new Error("No active MongoDB connection. Connect first.");
    }
    return this.activeDriver;
  }

  isConnected(): boolean {
    return this.activeDriver !== null;
  }

  getStatus(): ConnectionStatus {
    if (!this.activeDriver || !this.activeUri) {
      return { connected: false };
    }
    return {
      connected: true,
      maskedUri: maskUri(this.activeUri),
    };
  }

  getRawUri(): string | null {
    return this.activeUri;
  }
}

const globalForConn = globalThis as unknown as {
  __compooss_connection_manager?: ConnectionManager;
};

export const connectionManager =
  globalForConn.__compooss_connection_manager ??
  ConnectionManager.getInstance();

globalForConn.__compooss_connection_manager = connectionManager;
