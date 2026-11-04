"use client";

import { ENDPOINTS } from "@/lib/constants";
import { saveFile } from "@/lib/platform/platform";
import type { TMutationOptions } from "@/lib/query.types";
import { COLLECTION_QUERY_KEYS } from "@/lib/services/collections/collection-query.key";
import { DOCUMENTS_QUERY_KEYS } from "@/lib/services/documents/documents-query.key";
import type { ExportFormat, ImportResult, JsonExportMode } from "@compooss/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type ExportVariables = {
  db: string;
  collection: string;
  format: ExportFormat;
  /** Only used when format === "json". Defaults to "default" on the server. */
  jsonMode?: JsonExportMode;
  /** Current filter as a JSON string, e.g. '{"status":"active"}' */
  filter?: string;
  /** 0 = all (server hard-cap applies) */
  limit?: number;
};

/**
 * Fetches the export file and saves it (browser download or desktop save dialog).
 * Uses raw fetch because the response is a binary/text file, not JSON.
 */
export const useExportCollection = (
  options: TMutationOptions<void, ExportVariables> = {},
) => {
  return useMutation({
    ...options,
    mutationFn: async ({ db, collection, format, jsonMode, filter, limit }: ExportVariables) => {
      const params = new URLSearchParams({ format });
      if (format === "json" && jsonMode) {
        params.set("jsonMode", jsonMode);
      }
      if (filter && filter.trim() !== "{}" && filter.trim() !== "") {
        params.set("filter", filter);
      }
      if (limit && limit > 0) {
        params.set("limit", String(limit));
      }

      const url = `${ENDPOINTS.export.root(db, collection)}?${params.toString()}`;
      const res = await fetch(`/api${url}`);

      if (!res.ok) {
        const text = await res.text();
        let message = `Export failed (${res.status})`;
        try {
          const json = JSON.parse(text) as { message?: string };
          if (json.message) message = json.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      await saveFile(`${collection}-export.${format}`, await res.blob());
    },
  });
};

export type ImportVariables = {
  db: string;
  collection: string;
  file: File;
};

/**
 * Uploads a JSON or CSV file and inserts the parsed documents.
 * Returns an ImportResult with inserted/failed counts and error messages.
 */
export const useImportCollection = (
  options: TMutationOptions<ImportResult, ImportVariables> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ db, collection, file }: ImportVariables) => {
      const formData = new FormData();
      formData.append("file", file);

      const url = `/api${ENDPOINTS.import.root(db, collection)}`;
      const res = await fetch(url, { method: "POST", body: formData });

      const json = (await res.json()) as { data: ImportResult; message: string };

      if (!res.ok) {
        throw new Error(json.message ?? `Import failed (${res.status})`);
      }

      return json.data;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENTS_QUERY_KEYS.list(variables.db, variables.collection),
      });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.list(variables.db),
      });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};
