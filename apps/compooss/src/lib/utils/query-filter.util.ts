/**
 * Parsing for the query bar's filter, sort and projection strings. The
 * Documents tab and bulk update/delete share this, so a bulk operation always
 * targets exactly the documents the filter shows.
 */

/**
 * Converts JS-style object keys (unquoted) to valid JSON by quoting them.
 * e.g. { email: "x" } -> { "email": "x" }
 */
function relaxToJson(str: string): string {
  return str.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
}

function isEmptyObjectLiteral(str: string): boolean {
  return str === "" || str === "{}" || str === "{ }";
}

/** Parses strict or relaxed JSON. Returns undefined when neither works. */
function parseRelaxedJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    try {
      return JSON.parse(relaxToJson(str));
    } catch {
      return undefined;
    }
  }
}

export function parseJsonParam(
  value: string | null,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  const trimmed = value?.trim();
  if (!trimmed || isEmptyObjectLiteral(trimmed)) return fallback;
  const parsed = parseRelaxedJson(trimmed);
  return typeof parsed === "object" && parsed !== null
    ? (parsed as Record<string, unknown>)
    : fallback;
}

/** Escape special regex characters so the string is matched literally as a substring. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts string values in the filter to partial, case-insensitive matches using MongoDB $regex.
 * e.g. { email: "gmail" } -> { email: { $regex: "gmail", $options: "i" } }
 */
function filterStringsToPartialMatch(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = { $regex: escapeRegex(value), $options: "i" };
    } else if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof RegExp)) {
      result[key] = filterStringsToPartialMatch(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Parses a filter for reading. Invalid input falls back to matching every document. */
export function parseDocumentFilter(raw: string | null): Record<string, unknown> {
  return filterStringsToPartialMatch(parseJsonParam(raw, {}));
}

/**
 * Parses a filter for a bulk write. Unlike parseDocumentFilter it throws on
 * invalid input, so a typo can never turn into "update/delete everything".
 */
export function parseDocumentFilterStrict(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "string") throw new Error("filter must be a string.");

  const trimmed = raw.trim();
  if (isEmptyObjectLiteral(trimmed)) return {};

  const parsed = parseRelaxedJson(trimmed);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("The filter is not a valid JSON object. Fix it and try again.");
  }
  return filterStringsToPartialMatch(parsed as Record<string, unknown>);
}
