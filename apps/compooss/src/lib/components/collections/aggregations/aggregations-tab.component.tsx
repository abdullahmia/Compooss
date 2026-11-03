"use client";

import { useCollectionScope } from "@/lib/providers/collection-scope";
import { useCallback, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useAggregationPipeline } from "@/lib/components/collections/aggregations/use-aggregation-pipeline";
import { PipelineToolbar } from "@/lib/components/collections/aggregations/pipeline-toolbar.component";
import { PipelineBuilder } from "@/lib/components/collections/aggregations/pipeline-builder.component";
import { TextModeEditor } from "@/lib/components/collections/aggregations/text-mode-editor.component";
import { ResultViewer } from "@/lib/components/collections/aggregations/result-viewer.component";
import { StageWizardModal } from "@/lib/components/collections/aggregations/stage-wizard-modal.component";
import { FocusModeModal } from "@/lib/components/collections/aggregations/focus-mode-modal.component";
import { SavePipelineModal } from "@/lib/components/collections/aggregations/save-pipeline-modal.component";
import { PipelineSettingsModal } from "@/lib/components/collections/aggregations/pipeline-settings.component";
import { CreateViewModal } from "@/lib/components/collections/aggregations/create-view-modal.component";

type Props = { readOnly?: boolean };

export const AggregationsTab: React.FC<Props> = ({ readOnly = false }) => {
  const { dbName, collectionName } = useCollectionScope();

  const pipeline = useAggregationPipeline(dbName, collectionName);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createViewOpen, setCreateViewOpen] = useState(false);

  const focusedStage = pipeline.focusedStageId
    ? pipeline.stages.find((s) => s.id === pipeline.focusedStageId) ?? null
    : null;

  const handleWizardAddStage = useCallback(
    (operator: string, value: string) => {
      const id = pipeline.addStage(operator);
      pipeline.updateStage(id, { value });
    },
    [pipeline],
  );

  const handleCloseFocusMode = useCallback(() => {
    pipeline.setFocusedStageId(null);
  }, [pipeline]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <PipelineToolbar
        pipeline={pipeline}
        onOpenSave={() => setSaveModalOpen(true)}
        onOpenLoad={() => setLoadModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenCreateView={readOnly ? undefined : () => setCreateViewOpen(true)}
      />

      <PanelGroup direction="vertical" className="flex-1">
        <Panel defaultSize={60} minSize={30}>
          {pipeline.mode === "builder" ? (
            <PipelineBuilder
              pipeline={pipeline}
              onOpenWizard={() => setWizardOpen(true)}
            />
          ) : (
            <TextModeEditor pipeline={pipeline} />
          )}
        </Panel>

        <PanelResizeHandle className="h-1.5 bg-border hover:bg-primary/30 transition-colors cursor-row-resize flex items-center justify-center">
          <div className="w-8 h-0.5 rounded-full bg-muted-foreground/30" />
        </PanelResizeHandle>

        <Panel defaultSize={40} minSize={15}>
          <ResultViewer
            results={pipeline.results}
            error={pipeline.error}
            isRunning={pipeline.isRunning}
          />
        </Panel>
      </PanelGroup>

      <StageWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onAddStage={handleWizardAddStage}
      />

      <FocusModeModal
        open={pipeline.focusedStageId !== null}
        stage={focusedStage}
        previewDocs={
          pipeline.focusedStageId
            ? pipeline.stageResults.get(pipeline.focusedStageId)
            : undefined
        }
        onClose={handleCloseFocusMode}
        onUpdate={pipeline.updateStage}
        onRunPartial={pipeline.runPartialPipeline}
      />

      <SavePipelineModal
        open={saveModalOpen}
        mode="save"
        savedPipelines={pipeline.savedPipelines}
        onClose={() => setSaveModalOpen(false)}
        onSave={pipeline.savePipeline}
        onLoad={pipeline.loadPipeline}
        onDelete={pipeline.deleteSavedPipeline}
        onToggleFavorite={pipeline.toggleFavorite}
      />

      <SavePipelineModal
        open={loadModalOpen}
        mode="load"
        savedPipelines={pipeline.savedPipelines}
        onClose={() => setLoadModalOpen(false)}
        onSave={pipeline.savePipeline}
        onLoad={pipeline.loadPipeline}
        onDelete={pipeline.deleteSavedPipeline}
        onToggleFavorite={pipeline.toggleFavorite}
      />

      <PipelineSettingsModal
        open={settingsOpen}
        settings={pipeline.settings}
        onClose={() => setSettingsOpen(false)}
        onApply={pipeline.setSettings}
      />

      <CreateViewModal
        open={createViewOpen}
        isCreating={pipeline.isCreatingView}
        onClose={() => setCreateViewOpen(false)}
        onCreate={pipeline.handleCreateView}
      />
    </div>
  );
};
