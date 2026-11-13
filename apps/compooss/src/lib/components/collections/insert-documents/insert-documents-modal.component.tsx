"use client";

import { JsonEditor } from "@/lib/components/collections/json-editor.component";
import {
  createDocument,
  documentsToDraft,
  documentsToText,
  draftToDocuments,
  mergeFields,
  newObjectId,
  parseDocumentsJson,
  schemaToFields,
  validateDraft,
  type DraftDocument,
  type JsonParseResult,
} from "@/lib/components/collections/insert-documents/document-draft";
import { DocumentFieldsEditor } from "@/lib/components/collections/insert-documents/document-fields-editor.component";
import { useInsertDocuments } from "@/lib/services/documents/documents.service";
import { useAnalyzeSchema } from "@/lib/services/schema/schema.service";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import {
  Button,
  cn,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import type { OnMount } from "@monaco-editor/react";
import {
  AlignLeft,
  Braces,
  CircleAlert,
  CircleCheck,
  Clock,
  FilePlus2,
  ListPlus,
  ListTree,
  Plus,
  XCircle,
} from "lucide-react";
import type { editor } from "monaco-editor";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type View = "fields" | "json";

type Props = {
  open: boolean;
  onClose: () => void;
  dbName: string;
  collectionName: string;
  /** Dotted paths of fields seen in the collection, offered as field names. */
  fieldSuggestions?: string[];
};

const VIEW_STORAGE_KEY = "compooss:insert-documents-view";
const EMPTY_JSON = "{}";
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "fields", label: "Fields", icon: <ListTree className="h-3.5 w-3.5" /> },
  { id: "json", label: "JSON", icon: <Braces className="h-3.5 w-3.5" /> },
];

function readStoredView(): View {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "json" ? "json" : "fields";
  } catch {
    return "fields";
  }
}

function storeView(view: View) {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // Storage is unavailable; the view just won't be remembered.
  }
}

const documentCount = (count: number) => `${count} document${count === 1 ? "" : "s"}`;

function JsonStatus({
  result,
  onReveal,
}: {
  result: JsonParseResult;
  onReveal: (line: number, column?: number) => void;
}) {
  if (result.ok) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <CircleCheck className="h-3 w-3 text-primary" />
        {documentCount(result.documents.length)} ready to insert
      </p>
    );
  }
  const { line, column, message } = result;
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-destructive">
      <CircleAlert className="mt-px h-3 w-3 shrink-0" />
      <span>
        {line !== undefined && (
          <button
            type="button"
            onClick={() => onReveal(line, column)}
            className="font-medium underline-offset-2 hover:underline"
          >
            Line {line}, column {column}:
          </button>
        )}{" "}
        {message}
      </span>
    </p>
  );
}

export const InsertDocumentsModal: React.FC<Props> = ({
  open,
  onClose,
  dbName,
  collectionName,
  fieldSuggestions = [],
}) => {
  const [view, setView] = useState<View>(readStoredView);
  const [documents, setDocuments] = useState<DraftDocument[]>(() => [createDocument()]);
  const [json, setJson] = useState(EMPTY_JSON);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // JSON last generated from the Fields view. Switching back unchanged keeps the draft as is.
  const generatedJson = useRef<string | null>(null);
  const submitRef = useRef<() => void>(() => {});

  const fieldErrors = useMemo(() => validateDraft(documents), [documents]);
  const deferredJson = useDeferredValue(json);
  const jsonResult = useMemo(() => parseDocumentsJson(deferredJson), [deferredJson]);
  const count =
    view === "fields" ? documents.length : jsonResult.ok ? jsonResult.documents.length : 0;

  const reset = () => {
    setDocuments([createDocument()]);
    setJson(EMPTY_JSON);
    setShowAllErrors(false);
    setError(null);
    generatedJson.current = null;
  };

  const { mutate: insertDocuments, isPending } = useInsertDocuments({
    onSuccess: (result) => {
      toast.success(
        `Inserted ${documentCount(result.insertedCount)} into ${dbName}.${collectionName}`,
      );
      reset();
      onClose();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Insert failed.")),
  });

  const { mutate: analyzeSchema, isPending: isAnalyzing } = useAnalyzeSchema(
    dbName,
    collectionName,
    {
      onSuccess: (result) => {
        if (schemaToFields(result.fields).length === 0) {
          toast.info(
            result.sampleSize === 0
              ? "This collection is empty, so there are no fields to copy."
              : "No field appears in at least half of the documents.",
          );
          return;
        }
        setDocuments((current) =>
          current.map((document) => ({
            ...document,
            fields: mergeFields(document.fields, schemaToFields(result.fields)),
          })),
        );
      },
      onError: (err) =>
        toast.error(getApiErrorMessage(err, "Could not read the collection's fields.")),
    },
  );

  const revealInEditor = (line?: number, column?: number) => {
    const instance = editorRef.current;
    if (!instance) return;
    if (line !== undefined) {
      instance.setPosition({ lineNumber: line, column: column ?? 1 });
      instance.revealLineInCenterIfOutsideViewport(line);
    }
    instance.focus();
  };

  const handleSubmit = () => {
    if (isPending) return;
    setError(null);

    if (view === "fields") {
      if (fieldErrors.size > 0) {
        setShowAllErrors(true);
        requestAnimationFrame(() =>
          bodyRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
        );
        return;
      }
      insertDocuments({
        db: dbName,
        collection: collectionName,
        documents: draftToDocuments(documents),
      });
      return;
    }

    // Parse the latest text; jsonResult may still be catching up with typing.
    const result = parseDocumentsJson(json);
    if (!result.ok) {
      revealInEditor(result.line, result.column);
      return;
    }
    insertDocuments({ db: dbName, collection: collectionName, documents: result.documents });
  };

  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  const switchView = (next: View) => {
    if (next === view) return;
    if (next === "json") {
      const text = documentsToText(draftToDocuments(documents));
      setJson(text);
      generatedJson.current = text;
    } else {
      if (json !== generatedJson.current) {
        const result = parseDocumentsJson(json);
        if (!result.ok) {
          toast.error("Fix the JSON before switching to Fields.");
          revealInEditor(result.line, result.column);
          return;
        }
        try {
          setDocuments(documentsToDraft(result.documents));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : String(err));
          return;
        }
      }
      editorRef.current = null;
    }
    setView(next);
    storeView(next);
    setError(null);
  };

  const handleEditorMount: OnMount = (instance, monaco) => {
    editorRef.current = instance;
    instance.addAction({
      id: "compooss.insert-documents",
      label: "Insert documents",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => submitRef.current(),
    });
    instance.focus();
  };

  const insertIntoJson = (text: string) => {
    const instance = editorRef.current;
    const selection = instance?.getSelection();
    if (!instance || !selection) return;
    instance.executeEdits("insert-documents", [{ range: selection, text, forceMoveMarkers: true }]);
    instance.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Monaco handles its own Cmd/Ctrl+Enter and marks the event as handled.
    if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey) || event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    handleSubmit();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const visibleFieldErrors = view === "fields" && showAllErrors ? fieldErrors.size : 0;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent
        size="xl"
        className="flex max-h-[88vh] max-w-3xl flex-col"
        onKeyDown={handleKeyDown}
      >
        <ModalHeader
          title={`Insert documents into ${dbName}.${collectionName}`}
          icon={<FilePlus2 className="h-4 w-4" />}
          onClose={onClose}
        />

        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div
            role="tablist"
            aria-label="Editor"
            className="inline-flex rounded-md border border-border bg-secondary/40 p-0.5"
          >
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                onClick={() => switchView(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs transition-colors",
                  view === item.id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {view === "fields" ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<ListPlus className="h-3.5 w-3.5" />}
              loading={isAnalyzing}
              onClick={() => analyzeSchema(undefined)}
              title="Add the fields that most documents in this collection have"
            >
              Use collection fields
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<AlignLeft className="h-3.5 w-3.5" />}
                onClick={() =>
                  editorRef.current?.getAction("editor.action.formatDocument")?.run()
                }
              >
                Format
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => insertIntoJson(`{ "$oid": "${newObjectId()}" }`)}
                title="Insert a new ObjectId at the cursor"
              >
                ObjectId
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Clock className="h-3.5 w-3.5" />}
                onClick={() => insertIntoJson(`{ "$date": "${new Date().toISOString()}" }`)}
                title="Insert the current date and time at the cursor"
              >
                Date
              </Button>
            </div>
          )}
        </div>

        <ModalBody ref={bodyRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pt-3">
          {view === "fields" ? (
            <>
              <DocumentFieldsEditor
                documents={documents}
                onChange={setDocuments}
                errors={fieldErrors}
                showAllErrors={showAllErrors}
                fieldSuggestions={fieldSuggestions}
              />
              <p className="text-[11px] text-muted-foreground">
                Empty rows are left out. Documents without an <code>_id</code> get one
                from MongoDB.
              </p>
            </>
          ) : (
            <div>
              <JsonEditor
                value={json}
                onChange={setJson}
                height="340px"
                onMount={handleEditorMount}
              />
              <JsonStatus result={jsonResult} onReveal={revealInEditor} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Paste one document or an array of them. Comments are ignored, and Extended
                JSON such as <code>{`{ "$date": "…" }`}</code> is stored as the real type.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-sm border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              <XCircle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="justify-between">
          {visibleFieldErrors > 0 ? (
            <span className="text-xs text-destructive">
              {visibleFieldErrors === 1
                ? "1 field needs fixing"
                : `${visibleFieldErrors} fields need fixing`}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <kbd className="rounded-sm border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px]">
                {isMac ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="rounded-sm border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px]">
                Enter
              </kbd>
              to insert
            </span>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} loading={isPending}>
              {isPending ? "Inserting…" : count > 0 ? `Insert ${documentCount(count)}` : "Insert"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
