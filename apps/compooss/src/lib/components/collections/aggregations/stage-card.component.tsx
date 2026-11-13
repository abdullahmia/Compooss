"use client";

import type { AggregationStage } from "@compooss/types";
import { IconButton, Badge } from "@compooss/ui";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Maximize2,
  Play,
  Trash2,
} from "lucide-react";
import { useCallback } from "react";
import { StageEditor } from "@/lib/components/collections/aggregations/stage-editor.component";
import { STAGE_OPERATOR_OPTIONS } from "@/lib/components/collections/aggregations/stage-templates";

type Props = {
  stage: AggregationStage;
  index: number;
  error?: string;
  previewDocs?: Record<string, unknown>[];
  onUpdate: (
    id: string,
    updates: Partial<Pick<AggregationStage, "stageOperator" | "value" | "enabled" | "collapsed">>,
  ) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
  onRunPartial: (id: string) => void;
};

export const StageCard: React.FC<Props> = ({
  stage,
  index,
  error,
  previewDocs,
  onUpdate,
  onRemove,
  onDuplicate,
  onToggle,
  onFocus,
  onRunPartial,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleOperatorChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(stage.id, { stageOperator: e.target.value });
    },
    [stage.id, onUpdate],
  );

  const handleValueChange = useCallback(
    (value: string) => {
      onUpdate(stage.id, { value });
    },
    [stage.id, onUpdate],
  );

  const handleToggleCollapse = useCallback(() => {
    onUpdate(stage.id, { collapsed: !stage.collapsed });
  }, [stage.id, stage.collapsed, onUpdate]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border transition-colors ${
        !stage.enabled
          ? "border-border/50 bg-card/20 opacity-60"
          : error
            ? "border-destructive/50 bg-destructive/5"
            : "border-border bg-card/50"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Badge variant="subtle" size="sm" className="tabular-nums shrink-0">
          {index + 1}
        </Badge>

        <select
          value={stage.stageOperator}
          onChange={handleOperatorChange}
          className="h-7 rounded border border-border bg-background px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[130px]"
        >
          {STAGE_OPERATOR_OPTIONS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
          {STAGE_OPERATOR_OPTIONS.find((o) => o.value === stage.stageOperator)?.description}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <IconButton
            variant="default"
            size="sm"
            icon={<Play className="h-3 w-3" />}
            label="Run up to this stage"
            onClick={() => onRunPartial(stage.id)}
          />
          <IconButton
            variant="default"
            size="sm"
            icon={stage.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            label={stage.enabled ? "Disable stage" : "Enable stage"}
            onClick={() => onToggle(stage.id)}
          />
          <IconButton
            variant="default"
            size="sm"
            icon={<Maximize2 className="h-3 w-3" />}
            label="Focus mode"
            onClick={() => onFocus(stage.id)}
          />
          <IconButton
            variant="default"
            size="sm"
            icon={<Copy className="h-3 w-3" />}
            label="Duplicate"
            onClick={() => onDuplicate(stage.id)}
          />
          <IconButton
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-3 w-3" />}
            label="Remove"
            onClick={() => onRemove(stage.id)}
          />
          <IconButton
            variant="default"
            size="sm"
            icon={
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform duration-150 ${stage.collapsed ? "" : "rotate-90"}`}
              />
            }
            label={stage.collapsed ? "Expand" : "Collapse"}
            onClick={handleToggleCollapse}
          />
        </div>
      </div>

      {error && (
        <div className="px-3 pb-2">
          <p className="text-[11px] text-destructive">{error}</p>
        </div>
      )}

      {!stage.collapsed && (
        <div className="px-3 pb-3 animate-reveal">
          <StageEditor
            value={stage.value}
            onChange={handleValueChange}
            height="120px"
            readOnly={!stage.enabled}
          />

          {previewDocs && previewDocs.length > 0 && (
            <div className="mt-2 rounded border border-border bg-background/50 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Output Preview ({previewDocs.length} docs)
                </span>
              </div>
              <div className="max-h-[140px] overflow-auto p-2">
                <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                  {JSON.stringify(previewDocs.slice(0, 3), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
