/**
 * Prepares what the desktop bundle needs besides the Rust app:
 *   .dist/server/                               Next.js standalone server (same for every target)
 *   src-tauri/binaries/compooss-node-<triple>   Node.js runtime for the target
 *
 * Usage: bun scripts/prepare-sidecar.ts [--target <triple>] [--skip-server]
 *
 * Set MONGO_URL (e.g. mongodb://127.0.0.1:27017) to also check a real
 * connection in the smoke test, which runs when the target is this machine.
 */
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import http from "node:http";
import net, { type AddressInfo } from "node:net";
import path from "node:path";
import {
  CACHE_DIR,
  DESKTOP_DIR,
  NODE_VERSION,
  REPO_ROOT,
  SERVER_DIST_DIR,
  argValue,
  hasFlag,
  hostTriple,
  nodeBinaryPath,
  output,
  resolveTarget,
  run,
} from "./shared";

const STAGE_DIR = path.join(CACHE_DIR, "stage");
/** Kept in the stage between runs so installs and builds stay incremental. */
const STAGE_KEEP_DIRS = new Set(["node_modules", ".next", ".turbo"]);
const NATIVE_FILE = /\.(node|dylib|dll|exe|so(\.\d+)*)$/;
/** Leaves room for the install directory within Windows' 260-character limit. */
const MAX_RELATIVE_PATH = 180;

const triple = argValue("target") ?? hostTriple();
resolveTarget(triple);

if (!hasFlag("skip-server")) {
  stageRepo();
  buildServer();
  assembleServer();
}
checkServer();
await fetchNode(triple);
if (triple === hostTriple()) await smokeTest(nodeBinaryPath(triple));
console.log(`\nSidecar ready for ${triple}.`);

/**
 * Copies the working tree (tracked and untracked, minus ignored files) to a
 * stage outside the repo. The stage is installed with Bun's hoisted layout:
 * the default isolated layout is all symlinks, which Tauri's bundler drops.
 */
function stageRepo() {
  const files = output(["git", "ls-files", "-z", "-co", "--exclude-standard"])
    .split("\0")
    .filter((file) => file && existsSync(path.join(REPO_ROOT, file)));
  mkdirSync(STAGE_DIR, { recursive: true });
  removeStaleFiles(STAGE_DIR, new Set(files));
  for (const file of files) {
    const dest = path.join(STAGE_DIR, file);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(path.join(REPO_ROOT, file), dest);
  }
  console.log(`Staged ${files.length} files in ${STAGE_DIR}`);
}

/** Deletes stage files that are gone from the repo, so they can't leak into the build. */
function removeStaleFiles(dir: string, keep: Set<string>, relDir = "") {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!STAGE_KEEP_DIRS.has(entry.name)) removeStaleFiles(path.join(dir, entry.name), keep, rel);
    } else if (!keep.has(rel)) {
      rmSync(path.join(dir, entry.name), { force: true });
    }
  }
}

function buildServer() {
  run([process.execPath, "install", "--frozen-lockfile", "--linker", "hoisted"], { cwd: STAGE_DIR });
  run([process.execPath, "run", "build"], {
    cwd: path.join(STAGE_DIR, "apps", "compooss"),
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  });
}

/** Lays out the server the way the Dockerfile does, plus the desktop entry point. */
function assembleServer() {
  const app = path.join(STAGE_DIR, "apps", "compooss");
  const appOut = path.join(SERVER_DIST_DIR, "apps", "compooss");
  rmSync(SERVER_DIST_DIR, { recursive: true, force: true });
  // Turbopack links external packages from .next/node_modules; copy their
  // targets, since Tauri's bundler drops symlinks.
  cpSync(path.join(app, ".next", "standalone"), SERVER_DIST_DIR, {
    recursive: true,
    dereference: true,
  });
  cpSync(path.join(app, ".next", "static"), path.join(appOut, ".next", "static"), {
    recursive: true,
  });
  cpSync(path.join(app, "public"), path.join(appOut, "public"), { recursive: true });
  copyFileSync(
    path.join(DESKTOP_DIR, "sidecar", "desktop-entry.cjs"),
    path.join(SERVER_DIST_DIR, "desktop-entry.cjs"),
  );

  // sharp is only for next/image, which Compooss doesn't use. Its native
  // binaries match the build machine only and would break code signing.
  const modules = path.join(SERVER_DIST_DIR, "node_modules");
  for (const dir of ["@img", "sharp"]) {
    rmSync(path.join(modules, dir), { recursive: true, force: true });
  }
  walk(modules, (file) => {
    if (file.endsWith(".d.ts") || file.endsWith(".map")) rmSync(file);
  });
}

function checkServer() {
  if (!existsSync(SERVER_DIST_DIR)) {
    throw new Error(`No server tree at ${SERVER_DIST_DIR}; run without --skip-server first.`);
  }
  const problems: string[] = [];
  let totalBytes = 0;
  let longest = "";
  walk(SERVER_DIST_DIR, (file, isSymlink) => {
    const rel = path.relative(SERVER_DIST_DIR, file);
    if (isSymlink) problems.push(`symlink: ${rel}`);
    else totalBytes += statSync(file).size;
    if (NATIVE_FILE.test(rel)) problems.push(`native binary: ${rel}`);
    if (/(^|[\\/])\.env/.test(rel)) problems.push(`env file: ${rel}`);
    if (rel.length > longest.length) longest = rel;
  });
  if (longest.length > MAX_RELATIVE_PATH) problems.push(`path too long (${longest.length}): ${longest}`);
  for (const required of [
    "desktop-entry.cjs",
    "apps/compooss/server.js",
    "apps/compooss/.next/BUILD_ID",
    "apps/compooss/public/monaco/vs/loader.js",
    "node_modules/mongodb/package.json",
    "node_modules/next/package.json",
  ]) {
    if (!existsSync(path.join(SERVER_DIST_DIR, required))) problems.push(`missing: ${required}`);
  }
  if (problems.length > 0) {
    throw new Error(`Server tree failed checks:\n  ${problems.join("\n  ")}`);
  }
  console.log(`Server tree OK: ${(totalBytes / 1024 / 1024).toFixed(1)} MB in ${SERVER_DIST_DIR}`);
}

/** Downloads the official Node.js build for the target and checks its SHA-256. */
async function fetchNode(targetTriple: string) {
  const { nodeDist, archive, exe } = resolveTarget(targetTriple);
  const name = `node-v${NODE_VERSION}-${nodeDist}`;
  const file = `${name}.${archive}`;
  const baseUrl = `https://nodejs.org/dist/v${NODE_VERSION}`;
  const cache = path.join(CACHE_DIR, "node");
  mkdirSync(cache, { recursive: true });

  const sumsPath = path.join(cache, `SHASUMS256-v${NODE_VERSION}.txt`);
  if (!existsSync(sumsPath)) await download(`${baseUrl}/SHASUMS256.txt`, sumsPath);
  const archivePath = path.join(cache, file);
  if (!existsSync(archivePath)) await download(`${baseUrl}/${file}`, archivePath);

  const expected = (await Bun.file(sumsPath).text())
    .split("\n")
    .find((line) => line.endsWith(`  ${file}`))
    ?.split(/\s+/)[0];
  const actual = new Bun.CryptoHasher("sha256")
    .update(await Bun.file(archivePath).arrayBuffer())
    .digest("hex");
  if (!expected || expected !== actual) {
    rmSync(archivePath, { force: true });
    throw new Error(`Checksum mismatch for ${file}; deleted it, run again to re-download.`);
  }

  const extractDir = path.join(cache, "extract");
  rmSync(extractDir, { recursive: true, force: true });
  mkdirSync(extractDir, { recursive: true });
  const inArchive = exe ? `${name}/node.exe` : `${name}/bin/node`;
  if (archive === "zip") run(["unzip", "-q", archivePath, inArchive, "-d", extractDir]);
  else run(["tar", "-xzf", archivePath, "-C", extractDir, inArchive]);

  const dest = nodeBinaryPath(targetTriple);
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(path.join(extractDir, inArchive), dest);
  chmodSync(dest, 0o755);
  rmSync(extractDir, { recursive: true, force: true });
  console.log(`Node.js ${NODE_VERSION} (${nodeDist}) -> ${path.relative(DESKTOP_DIR, dest)}`);
}

async function download(url: string, dest: string) {
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  await Bun.write(`${dest}.part`, res);
  cpSync(`${dest}.part`, dest);
  rmSync(`${dest}.part`);
}

/**
 * Starts the assembled server the way the desktop app does and checks the
 * desktop lock. Uses a read-only copy, because installed app files are.
 */
async function smokeTest(nodeBinary: string) {
  const dir = path.join(CACHE_DIR, "smoke");
  const makeWritable = () => {
    if (existsSync(dir) && process.platform !== "win32") run(["chmod", "-R", "u+w", dir]);
  };
  makeWritable();
  rmSync(dir, { recursive: true, force: true });
  cpSync(SERVER_DIST_DIR, dir, { recursive: true });
  if (process.platform !== "win32") run(["chmod", "-R", "a-w", dir]);

  const port = await freePort();
  const token = crypto.randomUUID();
  const child = Bun.spawn([nodeBinary, "desktop-entry.cjs"], {
    cwd: dir,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      COMPOOSS_DESKTOP_TOKEN: token,
      COMPOOSS_USERNAME: "",
      COMPOOSS_PASSWORD: "",
      NODE_OPTIONS: "",
    },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
  });

  try {
    const started = Date.now();
    await waitForReady(child.stdout, 20_000);
    console.log(`Smoke test: server ready in ${Date.now() - started} ms`);

    const get = (p: string, headers: Record<string, string> = {}) =>
      request(port, "GET", p, headers);
    const expect = (label: string, actual: number, expected: number) => {
      if (actual !== expected) throw new Error(`Smoke test "${label}": got ${actual}, expected ${expected}`);
      console.log(`  ok  ${label} (${actual})`);
    };

    expect("health", (await get("/__desktop/health")).status, 200);
    expect("page without cookie", (await get("/")).status, 403);
    expect("API without cookie", (await get("/api/connection/status")).status, 401);
    expect("foreign Host header", (await get("/__desktop/health", { host: `evil.test:${port}` })).status, 403);
    expect("wrong token", (await get("/__desktop?token=wrong")).status, 403);

    const bootstrap = await get(`/__desktop?token=${token}`);
    expect("bootstrap redirect", bootstrap.status, 307);
    const cookie = cookiesFrom(bootstrap.headers);
    if (!cookie.includes("compooss_desktop=")) throw new Error("Smoke test: bootstrap set no cookie");

    expect("API with cookie", (await get("/api/connection/status", { cookie })).status, 200);
    expect("page with cookie", (await get("/connect", { cookie })).status, 200);
    expect("self-hosted Monaco", (await get("/monaco/vs/loader.js", { cookie })).status, 200);

    const mongoUrl = process.env.MONGO_URL;
    if (mongoUrl) {
      const json = { cookie, "content-type": "application/json" };
      const connect = await request(port, "POST", "/api/connection/connect", json, JSON.stringify({ uri: mongoUrl }));
      expect("connect to MONGO_URL", connect.status, 200);
      const session = `${cookie}; ${cookiesFrom(connect.headers)}`;
      expect("list databases", (await get("/api/databases", { cookie: session })).status, 200);
      await request(port, "POST", "/api/connection/disconnect", { cookie: session });
    } else {
      console.log("  --  set MONGO_URL to also test a MongoDB connection");
    }
  } finally {
    child.kill();
    await child.exited;
    makeWritable();
    rmSync(dir, { recursive: true, force: true });
  }
}

async function waitForReady(stream: ReadableStream<Uint8Array>, timeoutMs: number) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let seen = "";
  let timer: Timer | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Server not ready after ${timeoutMs} ms:\n${seen}`)), timeoutMs);
  });
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), timeout]);
      if (done) throw new Error(`Server exited before it was ready:\n${seen}`);
      seen += decoder.decode(value);
      if (seen.includes("__COMPOOSS_READY__")) break;
      const error = seen.match(/__COMPOOSS_ERROR__ (\S+)/);
      if (error) throw new Error(`Server failed to start: ${error[1]}`);
    }
  } finally {
    clearTimeout(timer);
  }
  // Keep draining so the server never blocks on a full pipe.
  void (async () => {
    while (!(await reader.read()).done);
  })();
}

/** node:http, because fetch won't let us send a foreign Host header. */
function request(
  port: number,
  method: string,
  pathname: string,
  headers: Record<string, string> = {},
  body?: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, method, path: pathname, headers: { host: `127.0.0.1:${port}`, ...headers } },
      (res) => {
        res.resume();
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers }));
      },
    );
    req.on("error", reject);
    req.end(body);
  });
}

function cookiesFrom(headers: http.IncomingHttpHeaders): string {
  return (headers["set-cookie"] ?? []).map((c) => c.split(";")[0]).join("; ");
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

/** Calls `visit` for every file and symlink under `dir`. */
function walk(dir: string, visit: (file: string, isSymlink: boolean) => void) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) visit(full, true);
    else if (entry.isDirectory()) walk(full, visit);
    else visit(full, false);
  }
}
