import { ObjectId, type Db, type Document } from "mongodb";
import type { MongoDriver } from "@/lib/driver/mongodb.driver";
import { hasWriteStage, READ_ONLY_MESSAGE } from "@/lib/utils/read-only.util";
import type { ShellResponse, ShellResponseType } from "@compooss/types";

interface EvalContext {
  database: string;
  /** The requesting browser's connection. */
  driver: MongoDriver;
  rawUri: string | null;
  readOnly: boolean;
}

// What a read-only connection may run. Anything not listed is blocked, so new
// write methods or commands are refused by default.
const READ_ONLY_COLLECTION_METHODS = new Set([
  "find",
  "findOne",
  "countDocuments",
  "estimatedDocumentCount",
  "distinct",
  "aggregate",
  "getIndexes",
  "indexes",
  "stats",
]);

const READ_ONLY_DB_METHODS = new Set([
  "getCollectionNames",
  "getCollectionInfos",
  "stats",
  "serverStatus",
  "hostInfo",
  "currentOp",
  "listCommands",
  "getMongo",
  "getName",
  "runCommand",
  "adminCommand",
]);

const READ_ONLY_COMMANDS = new Set([
  "aggregate",
  "buildInfo",
  "collStats",
  "connectionStatus",
  "count",
  "currentOp",
  "dbStats",
  "distinct",
  "explain",
  "find",
  "getCmdLineOpts",
  "getLog",
  "getParameter",
  "hello",
  "hostInfo",
  "isMaster",
  "listCollections",
  "listCommands",
  "listDatabases",
  "listIndexes",
  "ping",
  "replSetGetStatus",
  "rolesInfo",
  "serverStatus",
  "usersInfo",
]);

function readOnlyError(operation: string): Error {
  return new Error(`${operation} is blocked. ${READ_ONLY_MESSAGE}`);
}

function assertReadOnlyCommand(command: Document): void {
  const name = Object.keys(command)[0] ?? "";
  if (!READ_ONLY_COMMANDS.has(name) || hasWriteStage(command.pipeline)) {
    throw readOnlyError(`The "${name}" command`);
  }
}

function makeResponse(
  type: ShellResponseType,
  result: unknown,
  database: string,
  executionTimeMs: number,
): ShellResponse {
  return { type, result, database, executionTimeMs };
}

function isIncomplete(command: string): boolean {
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let inString: string | null = null;
  let escaped = false;

  for (const ch of command) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (inString) {
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "(") parens++;
    if (ch === ")") parens--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
  }

  return parens > 0 || brackets > 0 || braces > 0 || inString !== null;
}

function parseArgs(argsString: string): unknown[] {
  const trimmed = argsString.trim();
  if (!trimmed) return [];

  const wrapped = `[${trimmed}]`;
  const reviver = (_key: string, value: unknown) => value;

  try {
    const transformed = wrapped
      .replace(/ObjectId\s*\(\s*["']([^"']*)["']\s*\)/g, '{"$oid":"$1"}')
      .replace(/ObjectId\s*\(\s*\)/g, '{"$oid":"new"}')
      .replace(/ISODate\s*\(\s*["']([^"']*)["']\s*\)/g, '{"$date":"$1"}')
      .replace(/ISODate\s*\(\s*\)/g, `{"$date":"${new Date().toISOString()}"}`)
      .replace(/NumberLong\s*\(\s*["']?(\d+)["']?\s*\)/g, '{"$numberLong":"$1"}')
      .replace(/NumberDecimal\s*\(\s*["']?([^"')]+)["']?\s*\)/g, '{"$numberDecimal":"$1"}')
      .replace(/UUID\s*\(\s*["']([^"']*)["']\s*\)/g, '{"$uuid":"$1"}')
      .replace(/\/([^/]+)\/([gimsuy]*)/g, '{"$regex":"$1","$options":"$2"}')
      .replace(/Infinity/g, "1e999")
      .replace(/-Infinity/g, "-1e999")
      .replace(/\bNaN\b/g, "null")
      .replace(/\bundefined\b/g, "null")
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/'\s*/g, '"')
      .replace(/\s*'/g, '"');

    const parsed = JSON.parse(transformed, reviver);
    return resolveSpecialTypes(parsed) as unknown[];
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function(
        "ObjectId",
        "ISODate",
        "NumberLong",
        "NumberDecimal",
        "UUID",
        `return [${trimmed}]`,
      );
      return fn(
        (id?: string) => (id ? new ObjectId(id) : new ObjectId()),
        (d?: string) => (d ? new Date(d) : new Date()),
        (n: string | number) => BigInt(n),
        (n: string | number) => parseFloat(String(n)),
        (u: string) => u,
      ) as unknown[];
    } catch {
      throw new Error(`Failed to parse arguments: ${trimmed}`);
    }
  }
}

function resolveSpecialTypes(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(resolveSpecialTypes);
  if (obj && typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    if ("$oid" in record) {
      const id = record.$oid as string;
      return id === "new" ? new ObjectId() : new ObjectId(id);
    }
    if ("$date" in record) {
      return new Date(record.$date as string);
    }
    if ("$numberLong" in record) {
      return BigInt(record.$numberLong as string);
    }
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) {
      resolved[k] = resolveSpecialTypes(v);
    }
    return resolved;
  }
  return obj;
}

function serializeResult(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (Buffer.isBuffer(value)) return value.toString("hex");
  if (Array.isArray(value)) return value.map(serializeResult);
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = serializeResult(v);
    }
    return result;
  }
  return value;
}

async function execCollectionMethod(
  db: Db,
  collectionName: string,
  method: string,
  args: unknown[],
  readOnly: boolean,
): Promise<unknown> {
  if (
    readOnly &&
    (!READ_ONLY_COLLECTION_METHODS.has(method) ||
      (method === "aggregate" && hasWriteStage(args[0])))
  ) {
    throw readOnlyError(`${method}()`);
  }

  const col = db.collection(collectionName);

  switch (method) {
    case "find": {
      const filter = (args[0] as Document) ?? {};
      const projection = (args[1] as Document) ?? undefined;
      const opts: Record<string, unknown> = {};
      if (projection) opts.projection = projection;
      const cursor = col.find(filter, opts);
      return cursor.limit(100).toArray();
    }
    case "findOne": {
      const filter = (args[0] as Document) ?? {};
      const projection = (args[1] as Document) ?? undefined;
      const opts: Record<string, unknown> = {};
      if (projection) opts.projection = projection;
      return col.findOne(filter, opts);
    }
    case "insertOne": {
      if (!args[0]) throw new Error("insertOne requires a document argument");
      return col.insertOne(args[0] as Document);
    }
    case "insertMany": {
      if (!Array.isArray(args[0]))
        throw new Error("insertMany requires an array of documents");
      return col.insertMany(args[0] as Document[]);
    }
    case "updateOne": {
      if (!args[0] || !args[1])
        throw new Error("updateOne requires filter and update arguments");
      return col.updateOne(
        args[0] as Document,
        args[1] as Document,
        (args[2] as Document) ?? {},
      );
    }
    case "updateMany": {
      if (!args[0] || !args[1])
        throw new Error("updateMany requires filter and update arguments");
      return col.updateMany(
        args[0] as Document,
        args[1] as Document,
        (args[2] as Document) ?? {},
      );
    }
    case "replaceOne": {
      if (!args[0] || !args[1])
        throw new Error("replaceOne requires filter and replacement arguments");
      return col.replaceOne(
        args[0] as Document,
        args[1] as Document,
        (args[2] as Document) ?? {},
      );
    }
    case "deleteOne": {
      const filter = (args[0] as Document) ?? {};
      return col.deleteOne(filter);
    }
    case "deleteMany": {
      const filter = (args[0] as Document) ?? {};
      return col.deleteMany(filter);
    }
    case "countDocuments": {
      const filter = (args[0] as Document) ?? {};
      return col.countDocuments(filter);
    }
    case "estimatedDocumentCount": {
      return col.estimatedDocumentCount();
    }
    case "distinct": {
      if (typeof args[0] !== "string")
        throw new Error("distinct requires a field name");
      return col.distinct(args[0], (args[1] as Document) ?? {});
    }
    case "aggregate": {
      if (!Array.isArray(args[0]))
        throw new Error("aggregate requires a pipeline array");
      return col
        .aggregate(args[0] as Document[], (args[1] as Document) ?? {})
        .toArray();
    }
    case "createIndex": {
      if (!args[0]) throw new Error("createIndex requires index specification");
      return col.createIndex(
        args[0] as Document,
        (args[1] as Document) ?? {},
      );
    }
    case "createIndexes": {
      if (!Array.isArray(args[0]))
        throw new Error("createIndexes requires an array of index specs");
      return col.createIndexes(
        args[0] as Array<{ key: Document; [key: string]: unknown }>,
      );
    }
    case "dropIndex": {
      if (!args[0]) throw new Error("dropIndex requires an index name or spec");
      return col.dropIndex(args[0] as string);
    }
    case "dropIndexes": {
      return col.dropIndexes();
    }
    case "getIndexes":
    case "indexes": {
      return col.indexes();
    }
    case "drop": {
      return col.drop();
    }
    case "renameCollection":
    case "rename": {
      if (typeof args[0] !== "string")
        throw new Error("rename requires a new collection name");
      return col.rename(args[0]);
    }
    case "stats": {
      return db.command({ collStats: collectionName });
    }
    case "bulkWrite": {
      if (!Array.isArray(args[0]))
        throw new Error("bulkWrite requires an array of operations");
      return col.bulkWrite(args[0] as Parameters<typeof col.bulkWrite>[0]);
    }
    case "findOneAndUpdate": {
      if (!args[0] || !args[1])
        throw new Error(
          "findOneAndUpdate requires filter and update arguments",
        );
      return col.findOneAndUpdate(
        args[0] as Document,
        args[1] as Document,
        (args[2] as Document) ?? {},
      );
    }
    case "findOneAndReplace": {
      if (!args[0] || !args[1])
        throw new Error(
          "findOneAndReplace requires filter and replacement arguments",
        );
      return col.findOneAndReplace(
        args[0] as Document,
        args[1] as Document,
        (args[2] as Document) ?? {},
      );
    }
    case "findOneAndDelete": {
      return col.findOneAndDelete(
        (args[0] as Document) ?? {},
        (args[1] as Document) ?? {},
      );
    }
    default:
      throw new Error(
        `Unsupported collection method: ${method}`,
      );
  }
}

async function execDbMethod(
  db: Db,
  method: string,
  args: unknown[],
  ctx: EvalContext,
): Promise<{ result: unknown; switchDb?: string }> {
  const { database } = ctx;
  if (ctx.readOnly) {
    if (!READ_ONLY_DB_METHODS.has(method)) throw readOnlyError(`db.${method}()`);
    if ((method === "runCommand" || method === "adminCommand") && args[0]) {
      assertReadOnlyCommand(args[0] as Document);
    }
  }

  switch (method) {
    case "getCollectionNames": {
      const cols = await db.listCollections().toArray();
      return { result: cols.map((c) => c.name).sort() };
    }
    case "createCollection": {
      if (typeof args[0] !== "string")
        throw new Error("createCollection requires a name");
      await db.createCollection(args[0], (args[1] as Document) ?? {});
      return { result: { ok: 1 } };
    }
    case "dropDatabase": {
      await db.dropDatabase();
      return { result: { ok: 1, dropped: database } };
    }
    case "stats": {
      const result = await db.command({ dbStats: 1 });
      return { result };
    }
    case "serverStatus": {
      const admin = await ctx.driver.getAdmin();
      const result = await admin.serverStatus();
      return { result };
    }
    case "hostInfo": {
      const result = await db.admin().command({ hostInfo: 1 });
      return { result };
    }
    case "currentOp": {
      const result = await db.admin().command({ currentOp: 1 });
      return { result };
    }
    case "killOp": {
      if (args[0] === undefined) throw new Error("killOp requires an opid");
      const result = await db.admin().command({ killOp: 1, op: args[0] });
      return { result };
    }
    case "runCommand": {
      if (!args[0]) throw new Error("runCommand requires a command document");
      const result = await db.command(args[0] as Document);
      return { result };
    }
    case "adminCommand": {
      if (!args[0])
        throw new Error("adminCommand requires a command document");
      const result = await db.admin().command(args[0] as Document);
      return { result };
    }
    case "getMongo": {
      const rawUri = ctx.rawUri ?? "";
      return { result: rawUri.replace(/:([^@]+)@/, ":****@") };
    }
    case "getName": {
      return { result: database };
    }
    case "getCollectionInfos": {
      const cols = await db.listCollections().toArray();
      return { result: cols };
    }
    case "listCommands": {
      const result = await db.command({ listCommands: 1 });
      return { result };
    }
    default:
      throw new Error(`Unsupported database method: ${method}`);
  }
}

async function handleHelperCommand(
  command: string,
  ctx: EvalContext,
): Promise<ShellResponse | null> {
  const trimmed = command.trim();
  const start = performance.now();

  if (/^show\s+(dbs|databases)\s*$/i.test(trimmed)) {
    const dbs = await ctx.driver.listDatabases();
    const result = dbs.map((d) => ({
      name: d.name,
      sizeOnDisk: d.sizeOnDisk,
    }));
    return makeResponse("result", result, ctx.database, performance.now() - start);
  }

  if (/^show\s+collections\s*$/i.test(trimmed)) {
    const db = await ctx.driver.getDb(ctx.database);
    const cols = await db.listCollections().toArray();
    const names = cols.map((c) => c.name).sort();
    return makeResponse("result", names, ctx.database, performance.now() - start);
  }

  if (/^show\s+users\s*$/i.test(trimmed)) {
    const db = await ctx.driver.getDb(ctx.database);
    const result = await db.command({ usersInfo: 1 });
    return makeResponse("result", result.users, ctx.database, performance.now() - start);
  }

  if (/^show\s+roles\s*$/i.test(trimmed)) {
    const db = await ctx.driver.getDb(ctx.database);
    const result = await db.command({ rolesInfo: 1, showBuiltinRoles: true });
    return makeResponse("result", result.roles, ctx.database, performance.now() - start);
  }

  if (/^show\s+profile\s*$/i.test(trimmed)) {
    const db = await ctx.driver.getDb(ctx.database);
    const result = await db.collection("system.profile").find().limit(5).toArray();
    return makeResponse("result", result, ctx.database, performance.now() - start);
  }

  if (/^show\s+log\s*$/i.test(trimmed) || /^show\s+logs\s*$/i.test(trimmed)) {
    const admin = await ctx.driver.getAdmin();
    const result = await admin.command({ getLog: "global" });
    return makeResponse("result", result, ctx.database, performance.now() - start);
  }

  const useMatch = trimmed.match(/^use\s+(\S+)\s*$/i);
  if (useMatch) {
    const newDb = useMatch[1];
    return makeResponse("switchDb", `switched to db ${newDb}`, newDb, performance.now() - start);
  }

  if (/^(cls|clear)\s*$/i.test(trimmed)) {
    return makeResponse("info", "__clear__", ctx.database, 0);
  }

  if (/^help\s*$/i.test(trimmed)) {
    const helpText = [
      "Shell Help:",
      "  show dbs                     Show databases",
      "  show collections             Show collections in current db",
      "  show users                   Show users in current db",
      "  show roles                   Show roles in current db",
      "  use <db>                     Switch database",
      "  db.collection.find()         Query documents",
      "  db.collection.insertOne()    Insert a document",
      "  db.collection.updateOne()    Update a document",
      "  db.collection.deleteOne()    Delete a document",
      "  db.collection.aggregate()    Run aggregation pipeline",
      "  db.collection.createIndex()  Create an index",
      "  db.collection.getIndexes()   List indexes",
      "  db.collection.drop()         Drop collection",
      "  db.collection.stats()        Collection statistics",
      "  db.collection.bulkWrite()    Bulk operations",
      "  db.getCollectionNames()      List collection names",
      "  db.createCollection()        Create a collection",
      "  db.dropDatabase()            Drop current database",
      "  db.stats()                   Database statistics",
      "  db.serverStatus()            Server status",
      "  db.runCommand()              Run a database command",
      "  db.adminCommand()            Run an admin command",
      "  cls / clear                  Clear shell output",
      "  help                         Show this help",
    ].join("\n");
    return makeResponse("info", helpText, ctx.database, 0);
  }

  if (/^it\s*$/i.test(trimmed)) {
    return makeResponse("info", "no cursor", ctx.database, 0);
  }

  if (/^exit\s*$/i.test(trimmed) || /^quit\s*$/i.test(trimmed)) {
    return makeResponse("info", "Use the close button to close the shell.", ctx.database, 0);
  }

  return null;
}

const DB_COMMAND_PATTERN = /^db\.(\w+)\s*\(([\s\S]*)\)\s*$/;
const COLLECTION_METHOD_PATTERN =
  /^db\.([\w$.]+)\.([\w]+)\s*\(([\s\S]*)\)\s*$/;

export async function evaluateShellCommand(
  command: string,
  ctx: EvalContext,
): Promise<ShellResponse> {
  const trimmed = command.trim();
  if (!trimmed) {
    return makeResponse("info", "", ctx.database, 0);
  }

  if (isIncomplete(trimmed)) {
    return makeResponse("error", "Incomplete command — check brackets/parentheses.", ctx.database, 0);
  }

  const start = performance.now();

  try {
    const helperResult = await handleHelperCommand(trimmed, ctx);
    if (helperResult) return helperResult;

    const db = await ctx.driver.getDb(ctx.database);

    if (/^db\s*$/i.test(trimmed)) {
      return makeResponse("result", ctx.database, ctx.database, performance.now() - start);
    }

    const colMethodMatch = trimmed.match(COLLECTION_METHOD_PATTERN);
    if (colMethodMatch) {
      const [, collectionName, method, rawArgs] = colMethodMatch;
      const args = parseArgs(rawArgs);
      const result = await execCollectionMethod(
        db,
        collectionName,
        method,
        args,
        ctx.readOnly,
      );
      return makeResponse(
        "result",
        serializeResult(result),
        ctx.database,
        performance.now() - start,
      );
    }

    const dbMethodMatch = trimmed.match(DB_COMMAND_PATTERN);
    if (dbMethodMatch) {
      const [, method, rawArgs] = dbMethodMatch;
      const args = parseArgs(rawArgs);
      const { result, switchDb } = await execDbMethod(db, method, args, ctx);
      if (switchDb) {
        return makeResponse("switchDb", result, switchDb, performance.now() - start);
      }
      return makeResponse(
        "result",
        serializeResult(result),
        ctx.database,
        performance.now() - start,
      );
    }

    // Attempt JS evaluation with db context as a last resort
    const jsResult = await evalWithContext(trimmed, db, ctx);
    return makeResponse(
      "result",
      serializeResult(jsResult),
      ctx.database,
      performance.now() - start,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);
    return makeResponse("error", message, ctx.database, performance.now() - start);
  }
}

async function evalWithContext(
  code: string,
  db: Db,
  ctx: EvalContext,
): Promise<unknown> {
  const dbName = ctx.database;
  const collectionNames = (await db.listCollections().toArray()).map(
    (c) => c.name,
  );

  const dbProxy: Record<string, unknown> = {
    getName: () => dbName,
    getCollectionNames: async () => collectionNames,
  };

  for (const name of collectionNames) {
    dbProxy[name] = new Proxy(
      {},
      {
        get(_, method: string) {
          return async (...args: unknown[]) =>
            execCollectionMethod(db, name, method, args, ctx.readOnly);
        },
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    "db",
    "ObjectId",
    "ISODate",
    "NumberLong",
    "NumberDecimal",
    "UUID",
    `return (async () => { ${code.includes("return") ? code : `return (${code})`} })()`,
  );

  const result = await fn(
    dbProxy,
    (id?: string) => (id ? new ObjectId(id) : new ObjectId()),
    (d?: string) => (d ? new Date(d) : new Date()),
    (n: string | number) => BigInt(n),
    (n: string | number) => parseFloat(String(n)),
    (u: string) => u,
  );

  return result;
}
