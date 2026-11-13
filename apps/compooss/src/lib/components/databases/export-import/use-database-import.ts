"use client";

import { documentBatches } from "@/lib/components/databases/export-import/database-export-file";
import { COLLECTION_QUERY_KEYS } from "@/lib/services/collections/collection-query.key";
import { DATABASE_QUERY_KEYS } from "@/lib/services/database/database-query.key";
import { DOCUMENTS_QUERY_KEYS } from "@/lib/services/documents/documents-query.key";
import { sendDatabaseImportStep } from "@/lib/services/export/export.service";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import type { DatabaseExportCollection } from "@compooss/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

export type CollectionImportState =
  | "pending"
  | "running"
  | "done"
  /** Finished, but some documents or indexes failed. */
  | "warning"
  | "failed"
  /** Stopped partway through. */
  | "stopped"
  /** Never started because the import was stopped. */
  | "skipped";

export type CollectionImportProgress = {
  state: CollectionImportState;
  /** Documents sent so far, whether or not they were inserted. */
  processed: number;
  total: number;
  inserted: number;
  failed: number;
  indexes: number;
  /** False when the collection already existed and was kept. */
  created: boolean;
  errors: string[];
};

export type ImportStatus = "idle" | "running" | "finished";

const MAX_ERRORS = 50;

/**
 * Imports collections one at a time: create the collection, insert its
 * documents in batches, then create its indexes. Views go last.
 */
export function useDatabaseImport() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState<Record<string, CollectionImportProgress>>({});
  const stopRequested = useRef(false);

  const update = (name: string, patch: Partial<CollectionImportProgress>) =>
    setProgress((current) => ({ ...current, [name]: { ...current[name], ...patch } }));

  const importCollection = async (target: string, collection: DatabaseExportCollection, replace: boolean) => {
    const { name } = collection;
    const tally = { processed: 0, inserted: 0, failed: 0, indexes: 0, errors: [] as string[] };
    update(name, { state: "running" });

    try {
      const { created } = await sendDatabaseImportStep(target, {
        step: "collection",
        name,
        type: collection.type,
        options: collection.options,
        replace,
      });
      update(name, { created });

      for (const documents of documentBatches(collection.documents ?? [])) {
        if (stopRequested.current) break;
        const result = await sendDatabaseImportStep(target, { step: "documents", name, documents });
        tally.processed += documents.length;
        tally.inserted += result.inserted;
        tally.failed += result.failed;
        tally.errors.push(...result.errors);
        update(name, { ...tally, errors: tally.errors.slice(0, MAX_ERRORS) });
      }

      if (collection.indexes.length > 0 && !stopRequested.current) {
        const result = await sendDatabaseImportStep(target, {
          step: "indexes",
          name,
          indexes: collection.indexes,
        });
        tally.indexes = result.created;
        tally.errors.push(...result.errors);
      }

      update(name, {
        ...tally,
        errors: tally.errors.slice(0, MAX_ERRORS),
        state: stopRequested.current
          ? "stopped"
          : tally.failed > 0 || tally.errors.length > 0
            ? "warning"
            : "done",
      });
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "Import failed.";
      tally.errors.push(getApiErrorMessage(error, fallback));
      update(name, { ...tally, state: "failed", errors: tally.errors.slice(0, MAX_ERRORS) });
    }
  };

  const run = async (target: string, collections: DatabaseExportCollection[], replace: boolean) => {
    stopRequested.current = false;
    setStatus("running");
    setProgress(
      Object.fromEntries(
        collections.map((collection) => [
          collection.name,
          {
            state: "pending",
            processed: 0,
            total: collection.documents?.length ?? 0,
            inserted: 0,
            failed: 0,
            indexes: 0,
            created: true,
            errors: [],
          },
        ]),
      ),
    );

    const ordered = [...collections].sort(
      (a, b) => Number(a.type === "view") - Number(b.type === "view"),
    );
    for (const collection of ordered) {
      if (stopRequested.current) update(collection.name, { state: "skipped" });
      else await importCollection(target, collection, replace);
    }

    setStatus("finished");
    queryClient.invalidateQueries({ queryKey: DATABASE_QUERY_KEYS.all() });
    queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.list(target) });
    queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEYS.byDatabase(target) });
  };

  const stop = () => {
    stopRequested.current = true;
  };

  const reset = () => {
    setStatus("idle");
    setProgress({});
  };

  return { status, progress, run, stop, reset };
}
