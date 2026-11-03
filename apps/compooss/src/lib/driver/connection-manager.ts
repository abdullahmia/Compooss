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

type Session = {
  driver: MongoDriver;
  uri: string;
  readOnly: boolean;
  lastUsedAt: number;
};

/** Connections unused for this long are closed, e.g. from browsers that never disconnected. */
const SESSION_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const IDLE_SWEEP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Holds one MongoDB connection per browser session (see session.util.ts), so
 * people sharing a Compooss instance don't switch or close each other's
 * connections.
 */
class ConnectionManager {
  private static _instance: ConnectionManager | null = null;
  private sessions = new Map<string, Session>();

  constructor() {
    setInterval(() => void this.closeIdleSessions(), IDLE_SWEEP_INTERVAL_MS).unref();
  }

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
    sessionId: string,
    uri: string,
    options?: MongoClientOptions,
    readOnly = false,
  ): Promise<ConnectionStatus> {
    await this.disconnect(sessionId);

    const { driver, uri: connectedUri } = await this.openDriver(uri, options);
    this.sessions.set(sessionId, {
      driver,
      uri: connectedUri,
      readOnly,
      lastUsedAt: Date.now(),
    });

    const serverInfo = await driver.getServerInfo();
    return {
      connected: true,
      maskedUri: maskUri(connectedUri),
      readOnly,
      ...(connectedUri !== uri && { resolvedUri: connectedUri }),
      serverInfo,
    };
  }

  async disconnect(sessionId: string | null): Promise<void> {
    const session = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!session) return;
    this.sessions.delete(sessionId!);
    await session.driver.disconnect();
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

  /** Looks up a session and marks it as recently used. */
  private getSession(sessionId: string | null): Session | undefined {
    const session = sessionId ? this.sessions.get(sessionId) : undefined;
    if (session) session.lastUsedAt = Date.now();
    return session;
  }

  getActiveDriver(sessionId: string | null): MongoDriver {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("No active MongoDB connection. Connect first.");
    }
    return session.driver;
  }

  isReadOnly(sessionId: string | null): boolean {
    return this.getSession(sessionId)?.readOnly ?? false;
  }

  getStatus(sessionId: string | null): ConnectionStatus {
    const session = this.getSession(sessionId);
    if (!session) {
      return { connected: false };
    }
    return {
      connected: true,
      maskedUri: maskUri(session.uri),
      readOnly: session.readOnly,
    };
  }

  getRawUri(sessionId: string | null): string | null {
    return this.getSession(sessionId)?.uri ?? null;
  }

  private async closeIdleSessions(): Promise<void> {
    const cutoff = Date.now() - SESSION_IDLE_TIMEOUT_MS;
    for (const [sessionId, session] of this.sessions) {
      if (session.lastUsedAt < cutoff) {
        await this.disconnect(sessionId).catch(() => {});
      }
    }
  }
}

// Stored on globalThis so every route bundle and dev reload shares one instance.
const globalForConn = globalThis as unknown as {
  __compooss_session_connections?: ConnectionManager;
};

export const connectionManager =
  globalForConn.__compooss_session_connections ??
  ConnectionManager.getInstance();

globalForConn.__compooss_session_connections = connectionManager;
