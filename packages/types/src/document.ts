export interface Document {
  _id: string;
  [key: string]: unknown;
}

export type DocumentRecord = Record<string, unknown>;

export interface InsertDocumentsResult {
  insertedCount: number;
  /** The `_id` of each inserted document, as a string. */
  insertedIds: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
