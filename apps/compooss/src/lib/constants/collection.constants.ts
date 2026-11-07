export type ViewTab =
  | "documents"
  | "aggregations"
  | "schema"
  | "explain"
  | "indexes"
  | "validation";

export const VALID_TABS: ViewTab[] = [
  "documents",
  "aggregations",
  "schema",
  "explain",
  "indexes",
  "validation",
];
