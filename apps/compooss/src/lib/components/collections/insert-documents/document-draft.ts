import { generateId } from "@/lib/utils/generate-id.util";
import { stripJsonComments } from "@/lib/utils/strip-json-comments.util";
import type { SchemaField } from "@compooss/types";

export const FIELD_TYPES = [
  "String",
  "Number",
  "Int64",
  "Decimal128",
  "Boolean",
  "Date",
  "ObjectId",
  "Object",
  "Array",
  "Null",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** A field of a document in the Fields view, or an item of an array. */
export type DraftField = {
  id: string;
  /** Unused for array items. */
  key: string;
  type: FieldType;
  /** Text form of a scalar value. Unused for Object, Array and Null. */
  value: string;
  /** Fields of an Object or items of an Array. Kept when switching to another type. */
  children: DraftField[];
};

export type DraftDocument = { id: string; fields: DraftField[] };

export type FieldError = {
  target: "key" | "value";
  message: string;
  /** Shown while typing. The rest wait until the first insert attempt. */
  eager: boolean;
};

export const isContainerType = (type: FieldType) => type === "Object" || type === "Array";

export function createField(init: Partial<Omit<DraftField, "id">> = {}): DraftField {
  return { id: generateId(), key: "", type: "String", value: "", children: [], ...init };
}

export function createDocument(fields: DraftField[] = [createField()]): DraftDocument {
  return { id: generateId(), fields };
}

/** A row nobody has typed into. Left out of the insert instead of failing validation. */
export function isBlankField(field: DraftField): boolean {
  return field.key === "" && field.type === "String" && field.value === "";
}

let objectIdCounter = -1;
let objectIdRandom = "";

/** A new ObjectId as hex: seconds since epoch, a per-page random value, a counter. */
export function newObjectId(): string {
  if (objectIdCounter < 0) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    objectIdRandom = Array.from(bytes.subarray(0, 5), (b) => b.toString(16).padStart(2, "0")).join("");
    objectIdCounter = (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
  }
  objectIdCounter = (objectIdCounter + 1) % 0x1000000;
  const seconds = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  return seconds + objectIdRandom + objectIdCounter.toString(16).padStart(6, "0");
}

const INT64_MIN = -BigInt("9223372036854775808");
const INT64_MAX = BigInt("9223372036854775807");

/** Why a scalar value doesn't fit its type, or null. */
function getValueError(type: FieldType, value: string): string | null {
  const text = value.trim();
  switch (type) {
    case "Number":
      return text !== "" && Number.isFinite(Number(text)) ? null : "Enter a number";
    case "Int64":
      return /^-?\d+$/.test(text) && BigInt(text) >= INT64_MIN && BigInt(text) <= INT64_MAX
        ? null
        : "Enter a whole number that fits in 64 bits";
    case "Decimal128":
      return /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(text) ? null : "Enter a decimal number";
    case "Date":
      return text !== "" && !Number.isNaN(Date.parse(text))
        ? null
        : "Enter a date, e.g. 2026-01-31T09:30:00Z";
    case "ObjectId":
      return /^[0-9a-f]{24}$/i.test(text) ? null : "An ObjectId is 24 hex characters";
    default:
      return null;
  }
}

function getKeyError(key: string, siblingKeys: Set<string>): FieldError | null {
  if (key === "") return { target: "key", message: "Name this field", eager: false };
  if (siblingKeys.has(key)) {
    return { target: "key", message: "Another field already has this name", eager: true };
  }
  if (key.startsWith("$")) {
    return { target: "key", message: "Field names can't start with $", eager: true };
  }
  return null;
}

/** Problems keyed by field id. Blank rows are skipped. */
export function validateDraft(documents: DraftDocument[]): Map<string, FieldError> {
  const errors = new Map<string, FieldError>();
  const visit = (fields: DraftField[], isArray: boolean) => {
    const keys = new Set<string>();
    for (const field of fields) {
      if (isBlankField(field)) continue;
      const keyError = isArray ? null : getKeyError(field.key, keys);
      keys.add(field.key);
      const valueError = getValueError(field.type, field.value);
      if (keyError) {
        errors.set(field.id, keyError);
      } else if (valueError) {
        errors.set(field.id, {
          target: "value",
          message: valueError,
          eager: field.value.trim() !== "",
        });
      }
      if (isContainerType(field.type)) visit(field.children, field.type === "Array");
    }
  };
  for (const document of documents) visit(document.fields, false);
  return errors;
}

/** Switches a field's type, keeping its value when the new type can use it. */
export function changeFieldType(field: DraftField, type: FieldType): DraftField {
  const value = field.value.trim();
  switch (type) {
    case "String":
    case "Null":
      return { ...field, type };
    case "Boolean":
      return { ...field, type, value: value === "true" ? "true" : "false" };
    case "Date":
      return { ...field, type, value: getValueError(type, value) ? new Date().toISOString() : value };
    case "ObjectId":
      return { ...field, type, value: getValueError(type, value) ? newObjectId() : value };
    case "Object":
    case "Array":
      return {
        ...field,
        type,
        children: field.children.length > 0 ? field.children : [createField()],
      };
    default:
      return { ...field, type, value: getValueError(type, value) ? "" : value };
  }
}

/** Applies `update` to the field with this id, however deeply it's nested. */
export function updateField(
  fields: DraftField[],
  id: string,
  update: (field: DraftField) => DraftField,
): DraftField[] {
  return fields.map((field) => {
    if (field.id === id) return update(field);
    if (field.children.length === 0) return field;
    return { ...field, children: updateField(field.children, id, update) };
  });
}

export function removeField(fields: DraftField[], id: string): DraftField[] {
  return fields
    .filter((field) => field.id !== id)
    .map((field) =>
      field.children.length === 0 ? field : { ...field, children: removeField(field.children, id) },
    );
}

export function insertFieldAfter(
  fields: DraftField[],
  afterId: string,
  newField: DraftField,
): DraftField[] {
  const index = fields.findIndex((field) => field.id === afterId);
  if (index !== -1) return [...fields.slice(0, index + 1), newField, ...fields.slice(index + 1)];
  return fields.map((field) =>
    field.children.length === 0
      ? field
      : { ...field, children: insertFieldAfter(field.children, afterId, newField) },
  );
}

/** A copy with fresh ids. A top-level ObjectId _id gets a new value so both can be inserted. */
export function duplicateDocument(document: DraftDocument): DraftDocument {
  const clone = (fields: DraftField[]): DraftField[] =>
    fields.map((field) => ({ ...field, id: generateId(), children: clone(field.children) }));
  return createDocument(
    clone(document.fields).map((field) =>
      field.key === "_id" && field.type === "ObjectId" ? { ...field, value: newObjectId() } : field,
    ),
  );
}

function toValue(field: DraftField): unknown {
  const text = field.value.trim();
  switch (field.type) {
    case "String":
      return field.value;
    case "Number":
      // Invalid input stays as text so a switch to JSON doesn't lose it.
      return getValueError("Number", text) ? field.value : Number(text);
    case "Int64":
      return { $numberLong: text };
    case "Decimal128":
      return { $numberDecimal: text };
    case "Boolean":
      return field.value === "true";
    case "Date": {
      const date = new Date(text);
      return { $date: Number.isNaN(date.getTime()) ? text : date.toISOString() };
    }
    case "ObjectId":
      return { $oid: text.toLowerCase() };
    case "Null":
      return null;
    case "Array":
      return field.children.filter((item) => !isBlankField(item)).map(toValue);
    case "Object":
      return toObject(field.children);
  }
}

function toObject(fields: DraftField[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.filter((field) => !isBlankField(field)).map((field) => [field.key, toValue(field)]),
  );
}

/** The documents as Extended JSON, ready to insert or show in the JSON view. */
export function draftToDocuments(documents: DraftDocument[]): Record<string, unknown>[] {
  return documents.map((document) => toObject(document.fields));
}

export function documentsToText(documents: Record<string, unknown>[]): string {
  return JSON.stringify(documents.length === 1 ? documents[0] : documents, null, 2);
}

function fromExtendedJson(wrapper: string, inner: unknown): Pick<DraftField, "type" | "value"> | null {
  switch (wrapper) {
    case "$oid":
      return typeof inner === "string" ? { type: "ObjectId", value: inner } : null;
    case "$numberLong":
      return typeof inner === "string" ? { type: "Int64", value: inner } : null;
    case "$numberDecimal":
      return typeof inner === "string" ? { type: "Decimal128", value: inner } : null;
    case "$numberInt":
    case "$numberDouble":
      return typeof inner === "string" ? { type: "Number", value: inner } : null;
    case "$date": {
      // Relaxed Extended JSON has an ISO string, canonical has { "$numberLong": "<ms>" }.
      if (typeof inner === "string") return { type: "Date", value: inner };
      const millis =
        typeof inner === "number" ? inner : Number((inner as { $numberLong?: unknown } | null)?.$numberLong);
      const date = new Date(millis);
      return Number.isNaN(date.getTime()) ? null : { type: "Date", value: date.toISOString() };
    }
    default:
      return null;
  }
}

function toField(key: string, value: unknown): DraftField {
  if (value === null) return createField({ key, type: "Null" });
  if (typeof value === "string") return createField({ key, value });
  if (typeof value === "number") return createField({ key, type: "Number", value: String(value) });
  if (typeof value === "boolean") return createField({ key, type: "Boolean", value: String(value) });
  if (Array.isArray(value)) {
    return createField({ key, type: "Array", children: value.map((item) => toField("", item)) });
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 1 && entries[0][0].startsWith("$")) {
    const [wrapper, inner] = entries[0];
    const scalar = fromExtendedJson(wrapper, inner);
    if (!scalar) {
      throw new Error(`The Fields view can't edit ${wrapper} values. Keep using JSON for this one.`);
    }
    return createField({ key, ...scalar });
  }
  return createField({
    key,
    type: "Object",
    children: entries.map(([childKey, child]) => toField(childKey, child)),
  });
}

/** Fields view documents from parsed JSON. Throws on values the Fields view has no type for. */
export function documentsToDraft(documents: Record<string, unknown>[]): DraftDocument[] {
  return documents.map((document) => {
    const fields = Object.entries(document).map(([key, value]) => toField(key, value));
    return createDocument(fields.length > 0 ? fields : undefined);
  });
}

const TEMPLATE_TYPES = new Set<string>(FIELD_TYPES);

/** Empty fields for what at least half the sampled documents have, without _id. */
export function schemaToFields(fields: SchemaField[], isRoot = true): DraftField[] {
  return fields
    .filter((field) => field.frequency >= 0.5 && !(isRoot && field.name === "_id"))
    .map((field) => {
      const common = [...field.types].sort((a, b) => b.count - a.count)[0]?.type ?? "String";
      const type = (TEMPLATE_TYPES.has(common) ? common : "String") as FieldType;
      return createField({
        key: field.name,
        type,
        value: type === "Date" ? new Date().toISOString() : type === "Boolean" ? "false" : "",
        children: type === "Object" ? schemaToFields(field.children ?? [], false) : [],
      });
    });
}

/** Adds the fields a document doesn't have yet, dropping its blank rows. */
export function mergeFields(fields: DraftField[], additions: DraftField[]): DraftField[] {
  const kept = fields.filter((field) => !isBlankField(field));
  const keys = new Set(kept.map((field) => field.key));
  return [...kept, ...additions.filter((field) => !keys.has(field.key))];
}

type JsonError = { message: string; line?: number; column?: number };

export type JsonParseResult =
  | { ok: true; documents: Record<string, unknown>[] }
  | ({ ok: false } & JsonError);

/** JSON.parse's message, plus the line and column when the browser gives a location. */
function describeJsonError(error: unknown, json: string): JsonError {
  const raw = error instanceof Error ? error.message : String(error);
  // Chrome: "... in JSON at position 12 (line 2 column 3)"
  // Firefox: "JSON.parse: ... at line 2 column 3 of the JSON data"
  const lineColumn = raw.match(/line (\d+) column (\d+)/);
  const position = raw.match(/at position (\d+)/);
  let line: number | undefined;
  let column: number | undefined;
  if (lineColumn) {
    line = Number(lineColumn[1]);
    column = Number(lineColumn[2]);
  } else if (position) {
    const lines = json.slice(0, Number(position[1])).split("\n");
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  }
  const message = raw
    .replace(/^JSON(\.parse:| Parse error:) /, "")
    .replace(/ in JSON at position \d+.*$/, "")
    .replace(/ at line \d+ column \d+ of the JSON data$/, "");
  return { message: message.charAt(0).toUpperCase() + message.slice(1), line, column };
}

/** Parses the JSON view: one document or an array of them. Comments are allowed. */
export function parseDocumentsJson(text: string): JsonParseResult {
  // Comments become spaces, so error positions still match the editor.
  const json = stripJsonComments(text);
  if (json.trim() === "") {
    return { ok: false, message: "Enter a document, or an array of documents" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return { ok: false, ...describeJsonError(error, json) };
  }

  const documents = Array.isArray(parsed) ? parsed : [parsed];
  if (documents.length === 0) {
    return { ok: false, message: "The array is empty. Add at least one document" };
  }
  if (documents.some((doc) => !doc || typeof doc !== "object" || Array.isArray(doc))) {
    return {
      ok: false,
      message: Array.isArray(parsed)
        ? "Every item in the array must be a document, like { ... }"
        : "A document must be an object, like { ... }",
    };
  }
  return { ok: true, documents: documents as Record<string, unknown>[] };
}
