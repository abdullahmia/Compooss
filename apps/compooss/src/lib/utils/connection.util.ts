import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import {
  MongoParseError,
  MongoServerError,
  MongoServerSelectionError,
} from "mongodb";

export function classifyMongoError(err: unknown): string {
  if (err instanceof MongoServerError && err.code === 18) {
    return "Authentication failed. Check the username and password in your connection string.";
  }
  if (err instanceof MongoServerSelectionError) {
    return "Could not reach the server. Check the host and port.";
  }
  if (err instanceof MongoParseError) {
    return "Invalid connection string format.";
  }
  return err instanceof Error ? err.message : "Connection failed.";
}

export function isAuthError(err: unknown): boolean {
  return err instanceof MongoServerError && err.code === 18;
}

export function maskUri(uri: string): string {
  try {
    return uri.replace(
      /^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      "mongodb$1://$2:***@",
    );
  } catch {
    return uri;
  }
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const DOCKER_LOCALHOST_HINT =
  "Compooss is running in Docker, where localhost is the Compooss container itself. " +
  "Use your MongoDB container's name or host.docker.internal instead " +
  "(on Linux, start Compooss with --add-host=host.docker.internal:host-gateway).";

export function isRunningInDocker(): boolean {
  return existsSync("/.dockerenv") || existsSync("/run/.containerenv");
}

export function isLoopbackUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === "mongodb:" && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** Reads the container's default gateway, which is the Docker host on a bridge network. */
async function getDefaultGateway(): Promise<string | null> {
  try {
    const table = await readFile("/proc/net/route", "utf8");
    for (const line of table.trim().split("\n").slice(1)) {
      const [, destination, gateway] = line.trim().split(/\s+/);
      if (destination === "00000000" && gateway) {
        // The address is little-endian hex, e.g. 010011AC -> 172.17.0.1
        return gateway
          .match(/../g)!
          .reverse()
          .map((byte) => parseInt(byte, 16))
          .join(".");
      }
    }
  } catch {}
  return null;
}

async function resolves(hostname: string): Promise<boolean> {
  try {
    await lookup(hostname);
    return true;
  } catch {
    return false;
  }
}

/**
 * Inside a container, a localhost URI points at the Compooss container rather
 * than the MongoDB the user means. Returns the URI rewritten to each host that
 * can reach it, in order: a compose service named `mongo`, the Docker host via
 * host.docker.internal, or else the default gateway (Linux without --add-host).
 */
export async function resolveDockerHostCandidates(
  uri: string,
): Promise<string[]> {
  if (!isRunningInDocker() || !isLoopbackUri(uri)) return [];

  const url = new URL(uri);
  // A replica set reached this way usually advertises its members as
  // localhost, which is unreachable from here. Stay on the rewritten host
  // instead of following them.
  if (
    !url.searchParams.has("replicaSet") &&
    !url.searchParams.has("directConnection")
  ) {
    if (!url.pathname) url.pathname = "/";
    url.searchParams.set("directConnection", "true");
  }

  const hosts: string[] = [];
  if (await resolves("mongo")) hosts.push("mongo");
  if (await resolves("host.docker.internal")) {
    hosts.push("host.docker.internal");
  } else {
    const gateway = await getDefaultGateway();
    if (gateway) hosts.push(gateway);
  }

  return hosts.map((host) => {
    url.hostname = host;
    return url.toString();
  });
}
