/** The query bar fields, as typed by the user. */
export interface QueryBarValues {
  filter: string;
  project: string;
  sort: string;
  limit: number;
  skip: number;
}

export interface QueryHistoryEntry extends QueryBarValues {
  id: string;
  executedAt: string;
}

export interface SavedQuery extends QueryBarValues {
  id: string;
  name: string;
  createdAt: string;
}

export interface BulkUpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

export interface BulkDeleteResult {
  deletedCount: number;
}

/** Result of a bulk operation sent with `dryRun: true`. */
export interface BulkPreviewResult {
  matchedCount: number;
}
