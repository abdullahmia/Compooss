"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Button,
} from "@compooss/ui";
import { useExportCollection } from "@/lib/services/export/export.service";
import type { ExportFormat, JsonExportMode } from "@compooss/types";
import { ChevronRight, Download, FileJson, FileText } from "lucide-react";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  dbName: string;
  collectionName: string;
  /** Current query-bar filter string, e.g. '{"status":"active"}' */
  currentFilter?: string;
  /** Total documents that match the current filter */
  totalDocuments?: number;
};

type LimitMode = "all" | "custom";

const JSON_MODE_OPTIONS: { value: JsonExportMode; label: string; example: string }[] = [
  {
    value: "default",
    label: "Default Extended JSON",
    example: '{ "fortyTwo": 42, "oneHalf": 0.5, "bignumber": { "$numberLong": "5000000000" } }',
  },
  {
    value: "relaxed",
    label: "Relaxed Extended JSON",
    example:
      '{ "fortyTwo": 42, "oneHalf": 0.5, "bignumber": 5000000000 }. Large numbers (>= 2^53) will change with this format.',
  },
  {
    value: "canonical",
    label: "Canonical Extended JSON",
    example:
      '{ "fortyTwo": { "$numberInt": "42" }, "oneHalf": { "$numberDouble": "0.5" }, "bignumber": { "$numberLong": "5000000000" } }',
  },
];

export const ExportModal: React.FC<Props> = ({
  open,
  onClose,
  dbName,
  collectionName,
  currentFilter,
  totalDocuments = 0,
}) => {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [jsonMode, setJsonMode] = useState<JsonExportMode>("default");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [applyFilter, setApplyFilter] = useState(false);
  const [limitMode, setLimitMode] = useState<LimitMode>("all");
  const [customLimit, setCustomLimit] = useState("1000");

  const hasActiveFilter =
    !!currentFilter &&
    currentFilter.trim() !== "{}" &&
    currentFilter.trim() !== "";

  const { mutateAsync: exportCollection, isPending, error } = useExportCollection({
    onSuccess: onClose,
  });

  const handleExport = async () => {
    const limit = limitMode === "custom" ? Math.max(1, parseInt(customLimit, 10) || 1000) : 0;
    await exportCollection({
      db: dbName,
      collection: collectionName,
      format,
      jsonMode: format === "json" ? jsonMode : undefined,
      filter: applyFilter && hasActiveFilter ? currentFilter : undefined,
      limit,
    });
  };

  const selectedModeLabel = JSON_MODE_OPTIONS.find((o) => o.value === jsonMode)?.label ?? "";

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="md">
        <ModalHeader
          title="Export collection"
          icon={<Download className="h-4 w-4" />}
          onClose={onClose}
        />

        <ModalBody className="space-y-5">
          {/* Format */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Format</p>
            <div className="grid grid-cols-2 gap-2">
              {(["json", "csv"] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={[
                    "flex items-center gap-2.5 px-3 py-3 rounded-sm border text-sm font-medium transition-colors text-left",
                    format === fmt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-foreground hover:border-primary/50",
                  ].join(" ")}
                >
                  {fmt === "json" ? (
                    <FileJson className="h-4 w-4 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0" />
                  )}
                  <span className="uppercase">{fmt}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {format === "json"
                ? "Exports a JSON array of documents. Nested fields are preserved."
                : "Exports a flat CSV. Nested fields use dot notation; arrays are serialised as JSON strings."}
            </p>
          </div>

          {/* Advanced JSON Format */}
          {format === "json" && (
            <div>
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors w-full text-left"
              >
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${advancedOpen ? "rotate-90" : ""}`}
                />
                Advanced JSON Format
                {!advancedOpen && (
                  <span className="ml-1 text-muted-foreground font-normal">— {selectedModeLabel}</span>
                )}
              </button>

              {advancedOpen && (
                <div className="mt-2 space-y-2 animate-reveal">
                  {JSON_MODE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-start gap-2.5 cursor-pointer rounded-sm border border-border bg-secondary px-3 py-2.5 hover:border-primary/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="jsonMode"
                        value={opt.value}
                        checked={jsonMode === opt.value}
                        onChange={() => setJsonMode(opt.value)}
                        className="mt-0.5 accent-primary shrink-0"
                      />
                      <span className="text-sm leading-tight">
                        <span className="font-medium text-foreground">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground font-mono mt-0.5 break-words">
                          Example: {opt.example}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filter */}
          {hasActiveFilter && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Filter</p>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFilter}
                  onChange={(e) => setApplyFilter(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-foreground leading-tight">
                  Apply current filter
                  <span className="block text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-xs">
                    {currentFilter}
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* Limit */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Documents to export</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="limit"
                  value="all"
                  checked={limitMode === "all"}
                  onChange={() => setLimitMode("all")}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">
                  All matching documents
                  {totalDocuments > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      ({totalDocuments.toLocaleString()} total)
                    </span>
                  )}
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="limit"
                  value="custom"
                  checked={limitMode === "custom"}
                  onChange={() => setLimitMode("custom")}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">First</span>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  disabled={limitMode !== "custom"}
                  className="w-24 h-7 text-sm font-mono px-2 rounded-sm border border-border bg-secondary text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-hidden disabled:opacity-50"
                />
                <span className="text-sm text-foreground">documents</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-sm">
              {error.message}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Server hard-cap: 100 000 documents per export.
          </p>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            icon={<Download className="h-3.5 w-3.5" />}
            loading={isPending}
            onClick={handleExport}
          >
            {isPending ? "Exporting…" : "Export"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
