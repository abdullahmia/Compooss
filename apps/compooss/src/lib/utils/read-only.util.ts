export const READ_ONLY_MESSAGE =
  "This connection is read-only. Reconnect without read-only mode to make changes.";

/** True when an aggregation pipeline writes its output with $out or $merge. */
export function hasWriteStage(pipeline: unknown): boolean {
  return (
    Array.isArray(pipeline) &&
    pipeline.some(
      (stage) =>
        stage !== null &&
        typeof stage === "object" &&
        ("$out" in stage || "$merge" in stage),
    )
  );
}
