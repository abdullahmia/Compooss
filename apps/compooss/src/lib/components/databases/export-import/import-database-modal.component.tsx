"use client";

import {
  CollectionChecklist,
  CollectionTypeIcon,
} from "@/lib/components/databases/export-import/collection-checklist.component";
import { parseDatabaseExport } from "@/lib/components/databases/export-import/database-export-file";
import {
  useDatabaseImport,
  type CollectionImportProgress,
} from "@/lib/components/databases/export-import/use-database-import";
import { createDatabaseSchema } from "@/lib/schemas";
import { useGetCollections } from "@/lib/services/collections/collection.service";
import { useGetDatabases } from "@/lib/services/database/database.service";
import { formatBytes } from "@/lib/utils";
import { isProtectedDatabase, type DatabaseExportFile } from "@compooss/types";
import {
  Button,
  cn,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleStop,
  FileJson,
  Loader2,
  TriangleAlert,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Imports into this database. Without it, the user names one. */
  targetDatabase?: string;
};

const plural = (count: number, noun: string, nouns = `${noun}s`) =>
  `${count.toLocaleString()} ${count === 1 ? noun : nouns}`;

function getTargetError(name: string): string | null {
  if (isProtectedDatabase(name)) return `${name} is a system database.`;
  const result = createDatabaseSchema.shape.dbName.safeParse(name);
  return result.success ? null : (result.error.issues[0]?.message ?? "Invalid database name.");
}

const STATE_ICONS: Record<CollectionImportProgress["state"], React.ReactNode> = {
  pending: <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />,
  running: <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />,
  done: <CircleCheck className="h-3.5 w-3.5 text-success" />,
  warning: <TriangleAlert className="h-3.5 w-3.5 text-warning" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  stopped: <CircleStop className="h-3.5 w-3.5 text-muted-foreground" />,
  skipped: <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/60" />,
};

function describeProgress(item: CollectionImportProgress, type: string): string {
  switch (item.state) {
    case "pending":
      return "Waiting";
    case "skipped":
      return "Skipped";
    case "running":
      return item.total > 0
        ? `${item.processed.toLocaleString()} of ${plural(item.total, "document")}`
        : "Creating…";
    default: {
      if (type === "view") {
        return item.state === "failed" ? "Failed" : item.created ? "View created" : "Kept existing view";
      }
      const parts = [`${item.inserted.toLocaleString()} imported`];
      if (item.failed > 0) parts.push(`${item.failed.toLocaleString()} failed`);
      if (item.indexes > 0) parts.push(plural(item.indexes, "index", "indexes"));
      if (!item.created) parts.push("added to existing");
      if (item.state === "stopped") parts.push("stopped");
      return parts.join(" · ");
    }
  }
}

function ProgressRow({
  name,
  type,
  item,
}: {
  name: string;
  type: string;
  item: CollectionImportProgress;
}) {
  const showBar = item.total > 0 && item.state !== "pending" && item.state !== "skipped";
  return (
    <li className="px-3 py-2">
      <div className="flex items-center gap-2.5 text-xs">
        {STATE_ICONS[item.state]}
        <CollectionTypeIcon type={type} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-mono text-foreground">{name}</span>
        <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
          {describeProgress(item, type)}
        </span>
      </div>
      {showBar && (
        <div className="ml-6 mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              item.state === "failed" ? "bg-destructive" : item.failed > 0 ? "bg-warning" : "bg-primary",
            )}
            style={{ width: `${(item.processed / item.total) * 100}%` }}
          />
        </div>
      )}
      {item.errors.length > 0 && (
        <ul className="ml-6 mt-1.5 space-y-0.5">
          {item.errors.slice(0, 3).map((error, index) => (
            <li key={index} className="truncate font-mono text-[11px] text-destructive/90" title={error}>
              {error}
            </li>
          ))}
          {item.errors.length > 3 && (
            <li className="text-[11px] text-muted-foreground">
              {plural(item.errors.length - 3, "more error")}
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

function ImportDatabaseDialog({ onClose, targetDatabase }: Omit<Props, "open">) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [exportFile, setExportFile] = useState<DatabaseExportFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [targetName, setTargetName] = useState(targetDatabase ?? "");
  const [replace, setReplace] = useState(false);
  const [stopping, setStopping] = useState(false);
  const { status, progress, run, stop } = useDatabaseImport();

  const target = (targetDatabase ?? targetName).trim();
  const targetError = targetDatabase ? null : getTargetError(target);
  const { data: databases = [] } = useGetDatabases();
  const targetExists = databases.some((database) => database.name === target);
  const { data: targetCollections = [] } = useGetCollections(target, {
    enabled: targetExists && !targetError,
  });
  const existingNames = useMemo(
    () => new Set(targetExists ? targetCollections.map((collection) => collection.name) : []),
    [targetExists, targetCollections],
  );

  const collections = exportFile?.collections ?? [];
  const selected = collections.filter((collection) => !excluded.has(collection.name));
  const conflicts = selected.filter((collection) => existingNames.has(collection.name));
  const documentTotal = selected.reduce((sum, collection) => sum + (collection.documents?.length ?? 0), 0);
  const typeByName = new Map(collections.map((collection) => [collection.name, collection.type]));

  const results = Object.values(progress);
  const importedTotal = results.reduce((sum, item) => sum + item.inserted, 0);
  const failedTotal = results.reduce((sum, item) => sum + item.failed, 0);
  const problemCount = results.filter((item) => item.state === "failed" || item.state === "warning").length;
  const wasStopped = results.some((item) => item.state === "stopped" || item.state === "skipped");
  const needsAttention = problemCount > 0 || wasStopped;
  const runningName = Object.entries(progress).find(([, item]) => item.state === "running")?.[0];
  const finishedCount = results.filter((item) => item.state !== "pending" && item.state !== "running").length;

  const loadFile = async (picked: File) => {
    setFile({ name: picked.name, size: picked.size });
    setExportFile(null);
    setFileError(null);
    setExcluded(new Set());
    setReplace(false);
    setIsReading(true);
    try {
      const parsed = parseDatabaseExport(await picked.text());
      setExportFile(parsed);
      if (!targetDatabase) setTargetName(parsed.database);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsReading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setExportFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleStop = () => {
    setStopping(true);
    stop();
  };

  const isRunning = status === "running";
  const canImport = !!exportFile && selected.length > 0 && !targetError && !isReading;
  const replacing = replace && conflicts.length > 0;

  return (
    <Modal open onClose={isRunning ? () => {} : onClose}>
      <ModalContent size="xl" className="flex max-h-[88vh] max-w-2xl flex-col">
        <ModalHeader
          title={targetDatabase ? `Import into ${targetDatabase}` : "Import database"}
          icon={<Upload className="h-4 w-4" />}
          onClose={isRunning ? undefined : onClose}
        />

        <ModalBody className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {status !== "idle" ? (
            <>
              {status === "finished" && (
                <div
                  className={cn(
                    "flex items-start gap-2.5 rounded-sm border px-3 py-3",
                    needsAttention
                      ? "border-warning/30 bg-warning/10"
                      : "border-success/30 bg-success/10",
                  )}
                >
                  {needsAttention ? (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  ) : (
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  )}
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      {wasStopped ? "Stopped after importing" : "Imported"}{" "}
                      {plural(importedTotal, "document")} into {target}
                    </p>
                    {(problemCount > 0 || failedTotal > 0) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {failedTotal > 0 && `${plural(failedTotal, "document")} failed. `}
                        {problemCount > 0 && `${plural(problemCount, "collection")} had problems, shown below.`}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {Object.entries(progress).map(([name, item]) => (
                  <ProgressRow key={name} name={name} type={typeByName.get(name) ?? "collection"} item={item} />
                ))}
              </ul>
            </>
          ) : !file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const dropped = event.dataTransfer.files[0];
                if (dropped) void loadFile(dropped);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed px-6 py-10 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary hover:border-primary/50 hover:bg-secondary/80",
              )}
            >
              <Upload className="h-7 w-7 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop a database export here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A .json file made with Export on a database page
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-sm border border-border bg-secondary px-3 py-3">
                <FileJson className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exportFile
                      ? `${exportFile.database} · exported ${new Date(exportFile.exportedAt).toLocaleString()} · ${formatBytes(file.size)}`
                      : isReading
                        ? `Reading ${formatBytes(file.size)}…`
                        : formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Choose another file"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {fileError && (
                <p className="rounded-sm bg-destructive/10 px-3 py-2 text-xs text-destructive">{fileError}</p>
              )}

              {exportFile && (
                <>
                  {!targetDatabase && (
                    <div>
                      <label htmlFor="import-target" className="mb-1.5 block text-xs font-medium text-foreground">
                        Into database
                      </label>
                      <Input
                        id="import-target"
                        variant="compact"
                        value={targetName}
                        onChange={(event) => setTargetName(event.target.value)}
                        aria-invalid={!!targetError}
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <p
                        className={cn(
                          "mt-1 text-[11px]",
                          targetError ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {targetError ??
                          (targetExists
                            ? "This database exists. Collections it already has are marked below."
                            : "A new database will be created.")}
                      </p>
                    </div>
                  )}

                  {collections.length === 0 ? (
                    <p className="text-xs text-muted-foreground">This export has no collections.</p>
                  ) : (
                    <CollectionChecklist
                      items={collections.map((collection) => ({
                        name: collection.name,
                        type: collection.type,
                        badge: existingNames.has(collection.name) ? "exists" : undefined,
                        detail:
                          collection.type === "view"
                            ? "view"
                            : collection.documents
                              ? plural(collection.documents.length, "document")
                              : "structure only",
                      }))}
                      excluded={excluded}
                      onChange={setExcluded}
                    />
                  )}

                  {conflicts.length > 0 && (
                    <fieldset className="space-y-2">
                      <legend className="mb-2 text-xs font-medium text-foreground">
                        {conflicts.length === 1
                          ? `1 selected collection already exists in ${target}`
                          : `${conflicts.length} selected collections already exist in ${target}`}
                      </legend>
                      {[
                        {
                          value: false,
                          title: "Add to them",
                          description:
                            "Their documents stay. Documents whose _id is already there are skipped and counted as failed.",
                        },
                        {
                          value: true,
                          title: "Replace them",
                          description:
                            "Drops them, with their documents and indexes, before importing.",
                        },
                      ].map((option) => (
                        <label
                          key={option.title}
                          className={cn(
                            "flex cursor-pointer items-start gap-2.5 rounded-sm border px-3 py-2.5 transition-colors",
                            replace === option.value
                              ? option.value
                                ? "border-destructive/50 bg-destructive/5"
                                : "border-primary/50 bg-primary/5"
                              : "border-border hover:border-primary/30",
                          )}
                        >
                          <input
                            type="radio"
                            name="conflicts"
                            checked={replace === option.value}
                            onChange={() => setReplace(option.value)}
                            className="mt-0.5 accent-primary"
                          />
                          <span>
                            <span className="block text-xs font-medium text-foreground">{option.title}</span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  )}
                </>
              )}
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              if (picked) void loadFile(picked);
            }}
          />
        </ModalBody>

        <ModalFooter className="justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">
            {isRunning
              ? `${finishedCount + 1} of ${results.length}${runningName ? ` · ${runningName}` : ""}`
              : status === "idle" && exportFile
                ? `${plural(selected.length, "collection")} · ${plural(documentTotal, "document")}`
                : ""}
          </span>
          <div className="flex items-center gap-2">
            {status === "finished" ? (
              <>
                {!targetDatabase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(`/databases/${encodeURIComponent(target)}`);
                      onClose();
                    }}
                  >
                    Open {target}
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={onClose}>
                  Done
                </Button>
              </>
            ) : isRunning ? (
              <Button variant="outline" size="sm" onClick={handleStop} disabled={stopping}>
                {stopping ? "Stopping…" : "Stop"}
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant={replacing ? "destructive" : "primary"}
                  size="sm"
                  icon={<Upload className="h-3.5 w-3.5" />}
                  disabled={!canImport}
                  onClick={() => void run(target, selected, replace)}
                >
                  {replacing ? "Replace and import" : `Import ${plural(selected.length, "collection")}`}
                </Button>
              </>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Imports a database export: collections, views, indexes and documents. */
export const ImportDatabaseModal: React.FC<Props> = ({ open, ...props }) =>
  open ? <ImportDatabaseDialog {...props} /> : null;
