"use client";

import { Badge, Button, IconButton } from "@compooss/ui";
import {
  BookOpen,
  Braces,
  ClipboardCopy,
  Code2,
  Download,
  Eye,
  Hammer,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Settings,
  Square,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UseAggregationPipeline } from "@/lib/components/collections/aggregations/use-aggregation-pipeline";
import { saveFile } from "@/lib/platform/platform";

type Props = {
  pipeline: UseAggregationPipeline;
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onOpenSettings: () => void;
  /** Omitted when the connection or database is read-only. */
  onOpenCreateView?: () => void;
};

export const PipelineToolbar: React.FC<Props> = ({
  pipeline,
  onOpenSave,
  onOpenLoad,
  onOpenSettings,
  onOpenCreateView,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleRun = useCallback(() => {
    pipeline.runPipeline();
  }, [pipeline]);

  const handleStop = useCallback(() => {
    pipeline.stopPipeline();
  }, [pipeline]);

  const handleExportJson = useCallback(() => {
    const json = pipeline.exportPipelineJson();
    if (!json) return;
    navigator.clipboard.writeText(json);
    toast.success("Pipeline JSON copied to clipboard.");
    setShowExportMenu(false);
  }, [pipeline]);

  const handleCopyBackend = useCallback(() => {
    const code = pipeline.copyForBackendCode();
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Backend code copied to clipboard.");
    setShowExportMenu(false);
  }, [pipeline]);

  const handleDownloadJson = useCallback(async () => {
    const json = pipeline.exportPipelineJson();
    if (!json) return;
    setShowExportMenu(false);
    try {
      await saveFile("pipeline.json", new Blob([json], { type: "application/json" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save pipeline.json.");
    }
  }, [pipeline]);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => pipeline.setMode("builder")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors ${
              pipeline.mode === "builder"
                ? "bg-primary text-primary-foreground"
                : "bg-card/50 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Hammer className="h-3 w-3" />
            Builder
          </button>
          <button
            type="button"
            onClick={() => pipeline.setMode("text")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors ${
              pipeline.mode === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-card/50 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Braces className="h-3 w-3" />
            Text
          </button>
        </div>

        <Badge variant="subtle" size="sm">
          {pipeline.stages.length} stage
          {pipeline.stages.length !== 1 ? "s" : ""}
        </Badge>

        {pipeline.hasErrors && (
          <Badge variant="destructive" size="sm">
            {pipeline.stageErrors.size} error
            {pipeline.stageErrors.size !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {pipeline.isRunning ? (
          <Button
            variant="ghost"
            icon={<Square className="h-3.5 w-3.5" />}
            onClick={handleStop}
          >
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={
              pipeline.isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )
            }
            onClick={handleRun}
            disabled={pipeline.stages.length === 0 || pipeline.hasErrors}
          >
            Run
          </Button>
        )}

        <IconButton
          variant="default"
          size="sm"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          label="Re-run pipeline"
          onClick={handleRun}
          disabled={pipeline.stages.length === 0 || pipeline.isRunning}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <IconButton
          variant="default"
          size="sm"
          icon={<Save className="h-3.5 w-3.5" />}
          label="Save pipeline"
          onClick={onOpenSave}
          disabled={pipeline.stages.length === 0}
        />
        <IconButton
          variant="default"
          size="sm"
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="Load pipeline"
          onClick={onOpenLoad}
        />

        <div className="relative">
          <IconButton
            variant="default"
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            label="Export"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={pipeline.stages.length === 0}
          />
          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-[220px] rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                <Button
                  variant="menu"
                  icon={<ClipboardCopy className="h-3.5 w-3.5 text-muted-foreground" />}
                  onClick={handleExportJson}
                >
                  Copy Pipeline JSON
                </Button>
                <Button
                  variant="menu"
                  icon={<Code2 className="h-3.5 w-3.5 text-muted-foreground" />}
                  onClick={handleCopyBackend}
                >
                  Copy for Backend Code
                </Button>
                <Button
                  variant="menu"
                  icon={<Download className="h-3.5 w-3.5 text-muted-foreground" />}
                  onClick={handleDownloadJson}
                >
                  Download JSON File
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {onOpenCreateView && (
          <IconButton
            variant="default"
            size="sm"
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Create View"
            onClick={onOpenCreateView}
            disabled={pipeline.stages.length === 0 || pipeline.hasErrors}
          />
        )}

        <IconButton
          variant="default"
          size="sm"
          icon={<Settings className="h-3.5 w-3.5" />}
          label="Pipeline settings"
          onClick={onOpenSettings}
        />

        <IconButton
          variant="danger"
          size="sm"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          label="Clear pipeline"
          onClick={pipeline.clearPipeline}
          disabled={pipeline.stages.length === 0}
        />
      </div>
    </div>
  );
};
