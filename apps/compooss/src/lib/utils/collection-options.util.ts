import type { CreateCollectionOptions } from "@compooss/types";

const GRANULARITIES = new Set(["seconds", "minutes", "hours"]);

function positiveInteger(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${field} must be a positive whole number.`);
  return n;
}

/** Validates the create-collection options sent by the client. Throws with a user-facing message. */
export function parseCollectionOptions(raw: unknown): CreateCollectionOptions | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object") throw new Error("options must be an object.");
  const { capped, timeseries, expireAfterSeconds } = raw as Record<string, unknown>;

  if (capped && timeseries) {
    throw new Error("A collection can be capped or time series, not both.");
  }

  const options: CreateCollectionOptions = {};

  if (capped) {
    const { size, max } = capped as Record<string, unknown>;
    options.capped = { size: positiveInteger(size, "Capped size") };
    if (max !== undefined && max !== null && max !== "") {
      options.capped.max = positiveInteger(max, "Maximum documents");
    }
  }

  if (timeseries) {
    const { timeField, metaField, granularity } = timeseries as Record<string, unknown>;
    if (typeof timeField !== "string" || !timeField.trim()) {
      throw new Error("A time series collection needs a time field.");
    }
    options.timeseries = { timeField: timeField.trim() };
    if (typeof metaField === "string" && metaField.trim()) {
      options.timeseries.metaField = metaField.trim();
    }
    if (granularity !== undefined && granularity !== null && granularity !== "") {
      if (typeof granularity !== "string" || !GRANULARITIES.has(granularity)) {
        throw new Error("Granularity must be seconds, minutes or hours.");
      }
      options.timeseries.granularity = granularity as "seconds" | "minutes" | "hours";
    }
    if (expireAfterSeconds !== undefined && expireAfterSeconds !== null && expireAfterSeconds !== "") {
      options.expireAfterSeconds = positiveInteger(expireAfterSeconds, "Expire after seconds");
    }
  } else if (expireAfterSeconds !== undefined && expireAfterSeconds !== null && expireAfterSeconds !== "") {
    throw new Error("Expire after seconds only applies to time series collections.");
  }

  return options;
}
