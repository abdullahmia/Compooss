"use client";

import {
  changeFieldType,
  createDocument,
  createField,
  duplicateDocument,
  FIELD_TYPES,
  insertFieldAfter,
  isBlankField,
  isContainerType,
  newObjectId,
  removeField,
  updateField,
  type DraftDocument,
  type DraftField,
  type FieldError,
  type FieldType,
} from "@/lib/components/collections/insert-documents/document-draft";
import { Button, cn, IconButton, Toggle } from "@compooss/ui";
import {
  ChevronRight,
  Clock,
  CopyPlus,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { createContext, useContext, useRef, useState, type KeyboardEvent } from "react";

type Props = {
  documents: DraftDocument[];
  onChange: (documents: DraftDocument[]) => void;
  errors: Map<string, FieldError>;
  /** False until the first insert attempt, so half-typed rows aren't flagged. */
  showAllErrors: boolean;
  /** Dotted paths of fields seen in the collection, offered as field names. */
  fieldSuggestions: string[];
};

type EditorActions = {
  errors: Map<string, FieldError>;
  showAllErrors: boolean;
  focusId: string | null;
  isCollapsed: (id: string) => boolean;
  toggleCollapsed: (id: string) => void;
  setKey: (id: string, key: string) => void;
  setValue: (id: string, value: string) => void;
  setType: (id: string, type: FieldType) => void;
  remove: (id: string) => void;
  addAfter: (id: string) => void;
  addChild: (parentId: string) => void;
  suggestionsFor: (path: string | null) => string[];
};

const EditorContext = createContext<EditorActions | null>(null);

function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("Field rows must be inside DocumentFieldsEditor");
  return context;
}

const inputClass =
  "h-7 w-full rounded-sm border border-transparent bg-secondary/50 px-2 font-mono text-xs outline-hidden transition-colors placeholder:text-muted-foreground/60 hover:border-border focus:border-primary focus:bg-secondary";
const invalidClass = "border-destructive/60 hover:border-destructive/60 focus:border-destructive";

const VALUE_STYLES: Partial<
  Record<FieldType, { color: string; placeholder: string; inputMode?: "decimal" | "numeric" }>
> = {
  String: { color: "text-json-string", placeholder: "value" },
  Number: { color: "text-json-number", placeholder: "0", inputMode: "decimal" },
  Int64: { color: "text-json-number", placeholder: "0", inputMode: "numeric" },
  Decimal128: { color: "text-json-number", placeholder: "0.00", inputMode: "decimal" },
  Date: { color: "text-json-string", placeholder: "2026-01-31T09:30:00Z" },
  ObjectId: { color: "text-json-string", placeholder: "24 hex characters" },
};

const isPlainEnter = (event: KeyboardEvent) =>
  event.key === "Enter" &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.shiftKey &&
  !event.nativeEvent.isComposing;

const countLabel = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="px-2 pt-0.5 text-[11px] leading-4 text-destructive">{message}</p>;
}

function FieldList({
  fields,
  path,
  isArray,
  listId,
  onAdd,
}: {
  fields: DraftField[];
  /** Dotted path of the object these fields belong to; null where suggestions don't apply. */
  path: string | null;
  isArray: boolean;
  listId: string;
  onAdd: () => void;
}) {
  const { suggestionsFor } = useEditor();
  const usedKeys = new Set(fields.map((field) => field.key));
  const suggestions = isArray ? [] : suggestionsFor(path).filter((name) => !usedKeys.has(name));

  return (
    <div className="space-y-1">
      {fields.map((field, index) => (
        <FieldRow
          key={field.id}
          field={field}
          index={index}
          isArray={isArray}
          path={path}
          listId={suggestions.length > 0 ? listId : undefined}
        />
      ))}
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-6 items-center gap-1 rounded-sm px-2 text-[11px] text-muted-foreground transition-colors hover:text-primary"
      >
        <Plus className="h-3 w-3" />
        {isArray ? "Add item" : "Add field"}
      </button>
    </div>
  );
}

function FieldValue({
  field,
  autoFocus,
  invalid,
  inputRef,
}: {
  field: DraftField;
  autoFocus: boolean;
  invalid: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const editor = useEditor();

  if (field.type === "Null") {
    return <span className="block h-7 px-2 font-mono text-xs leading-7 text-json-null">null</span>;
  }

  if (field.type === "Boolean") {
    return (
      <label className="flex h-7 w-fit cursor-pointer items-center gap-2 px-2">
        <Toggle
          size="sm"
          checked={field.value === "true"}
          onChange={(checked) => editor.setValue(field.id, String(checked))}
          label="Value"
          autoFocus={autoFocus}
        />
        <span className="font-mono text-xs text-json-boolean">{field.value}</span>
      </label>
    );
  }

  if (isContainerType(field.type)) {
    const expanded = !editor.isCollapsed(field.id);
    const count = field.children.filter((child) => !isBlankField(child)).length;
    return (
      <button
        type="button"
        onClick={() => editor.toggleCollapsed(field.id)}
        aria-expanded={expanded}
        className="flex h-7 items-center gap-1 rounded-sm px-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform duration-150", expanded && "rotate-90")} />
        {field.type === "Object" ? countLabel(count, "field") : countLabel(count, "item")}
      </button>
    );
  }

  const style = VALUE_STYLES[field.type];
  return (
    <div className="flex items-center gap-0.5">
      <input
        ref={inputRef}
        value={field.value}
        onChange={(event) => editor.setValue(field.id, event.target.value)}
        onKeyDown={(event) => {
          if (!isPlainEnter(event)) return;
          event.preventDefault();
          editor.addAfter(field.id);
        }}
        placeholder={style?.placeholder}
        inputMode={style?.inputMode}
        autoFocus={autoFocus}
        aria-label="Value"
        aria-invalid={invalid}
        spellCheck={false}
        autoComplete="off"
        className={cn(inputClass, style?.color, invalid && invalidClass)}
      />
      {field.type === "ObjectId" && (
        <IconButton
          size="sm"
          className="h-7 w-7"
          icon={<RefreshCw className="h-3 w-3" />}
          label="Generate a new ObjectId"
          onClick={() => editor.setValue(field.id, newObjectId())}
        />
      )}
      {field.type === "Date" && (
        <IconButton
          size="sm"
          className="h-7 w-7"
          icon={<Clock className="h-3 w-3" />}
          label="Set to now"
          onClick={() => editor.setValue(field.id, new Date().toISOString())}
        />
      )}
    </div>
  );
}

function FieldRow({
  field,
  index,
  isArray,
  path,
  listId,
}: {
  field: DraftField;
  index: number;
  isArray: boolean;
  path: string | null;
  listId?: string;
}) {
  const editor = useEditor();
  const valueRef = useRef<HTMLInputElement>(null);

  const error = editor.errors.get(field.id);
  const shownError = error && (error.eager || editor.showAllErrors) ? error : undefined;
  const keyError = shownError?.target === "key" ? shownError.message : undefined;
  const valueError = shownError?.target === "value" ? shownError.message : undefined;
  const autoFocus = editor.focusId === field.id;
  const expanded = isContainerType(field.type) && !editor.isCollapsed(field.id);
  const childPath =
    field.type === "Object" && path !== null && !isArray
      ? path
        ? `${path}.${field.key}`
        : field.key
      : null;

  return (
    <div className="group/row">
      <div className="flex items-start gap-1.5">
        {isArray ? (
          <span className="h-7 w-7 shrink-0 text-right font-mono text-xs leading-7 text-json-number">
            {index}
          </span>
        ) : (
          <div className="w-40 shrink-0">
            <input
              value={field.key}
              onChange={(event) => editor.setKey(field.id, event.target.value)}
              onKeyDown={(event) => {
                if (!isPlainEnter(event)) return;
                event.preventDefault();
                if (valueRef.current) valueRef.current.focus();
                else editor.addAfter(field.id);
              }}
              placeholder="field"
              list={listId}
              autoFocus={autoFocus}
              aria-label="Field name"
              aria-invalid={!!keyError}
              spellCheck={false}
              autoComplete="off"
              className={cn(inputClass, "text-json-key", keyError && invalidClass)}
            />
            <ErrorText message={keyError} />
          </div>
        )}
        <span className="font-mono text-xs leading-7 text-muted-foreground">:</span>
        <div className="min-w-0 flex-1">
          <FieldValue
            field={field}
            autoFocus={autoFocus && isArray}
            invalid={!!valueError}
            inputRef={valueRef}
          />
          <ErrorText message={valueError} />
        </div>
        <select
          value={field.type}
          onChange={(event) => editor.setType(field.id, event.target.value as FieldType)}
          aria-label="Field type"
          className="h-7 w-[6.5rem] shrink-0 cursor-pointer rounded-sm border border-transparent bg-transparent px-1.5 text-[11px] text-muted-foreground outline-hidden transition-colors hover:border-border hover:text-foreground focus:border-primary focus:text-foreground"
        >
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <IconButton
          variant="danger"
          size="sm"
          className="h-7 w-7 opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100"
          icon={<X className="h-3.5 w-3.5" />}
          label={isArray ? "Remove item" : "Remove field"}
          onClick={() => editor.remove(field.id)}
        />
      </div>
      {expanded && (
        <div className="ml-3 mt-1 border-l border-border/60 pl-3 animate-reveal">
          <FieldList
            fields={field.children}
            path={childPath}
            isArray={field.type === "Array"}
            listId={`fields-${field.id}`}
            onAdd={() => editor.addChild(field.id)}
          />
        </div>
      )}
    </div>
  );
}

/** Builds documents field by field, each with an explicit BSON type. */
export const DocumentFieldsEditor: React.FC<Props> = ({
  documents,
  onChange,
  errors,
  showAllErrors,
  fieldSuggestions,
}) => {
  const [focusId, setFocusId] = useState<string | null>(
    () => documents[0]?.fields[0]?.id ?? null,
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const editFields = (update: (fields: DraftField[]) => DraftField[]) =>
    onChange(documents.map((document) => ({ ...document, fields: update(document.fields) })));

  const addField = (update: (fields: DraftField[], field: DraftField) => DraftField[]) => {
    const field = createField();
    editFields((fields) => update(fields, field));
    setFocusId(field.id);
  };

  const actions: EditorActions = {
    errors,
    showAllErrors,
    focusId,
    isCollapsed: (id) => collapsed.has(id),
    toggleCollapsed: (id) =>
      setCollapsed((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    setKey: (id, key) => editFields((fields) => updateField(fields, id, (field) => ({ ...field, key }))),
    setValue: (id, value) =>
      editFields((fields) => updateField(fields, id, (field) => ({ ...field, value }))),
    setType: (id, type) => {
      const created: DraftField[] = [];
      editFields((fields) =>
        updateField(fields, id, (field) => {
          const next = changeFieldType(field, type);
          if (next.children !== field.children) created.push(...next.children);
          return next;
        }),
      );
      if (created[0]) setFocusId(created[0].id);
    },
    remove: (id) => editFields((fields) => removeField(fields, id)),
    addAfter: (id) => addField((fields, field) => insertFieldAfter(fields, id, field)),
    addChild: (parentId) => {
      addField((fields, field) =>
        updateField(fields, parentId, (parent) => ({
          ...parent,
          children: [...parent.children, field],
        })),
      );
      setCollapsed((current) => {
        const next = new Set(current);
        next.delete(parentId);
        return next;
      });
    },
    suggestionsFor: (path) => {
      if (path === null) return [];
      const prefix = path ? `${path}.` : "";
      const names = new Set<string>();
      for (const suggestion of fieldSuggestions) {
        if (!suggestion.startsWith(prefix)) continue;
        const name = suggestion.slice(prefix.length);
        if (name && !name.includes(".")) names.add(name);
      }
      return [...names];
    },
  };

  const addToDocument = (documentId: string) => {
    const field = createField();
    onChange(
      documents.map((document) =>
        document.id === documentId ? { ...document, fields: [...document.fields, field] } : document,
      ),
    );
    setFocusId(field.id);
  };

  const addDocument = (document: DraftDocument, afterId?: string) => {
    const index = documents.findIndex((item) => item.id === afterId);
    const at = index === -1 ? documents.length : index + 1;
    onChange([...documents.slice(0, at), document, ...documents.slice(at)]);
    setFocusId(document.fields[0]?.id ?? null);
  };

  return (
    <EditorContext.Provider value={actions}>
      <div className="space-y-3">
        {documents.map((document, index) => (
          <section
            key={document.id}
            aria-label={`Document ${index + 1}`}
            className="overflow-hidden rounded-md border border-border"
          >
            <header className="relative flex items-center gap-2 border-b border-border bg-muted/30 py-1.5 pl-4 pr-2">
              <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" />
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {documents.length > 1 ? `Document ${index + 1}` : "New document"}
              </span>
              <div className="ml-auto flex items-center gap-0.5">
                <IconButton
                  size="sm"
                  icon={<CopyPlus className="h-3.5 w-3.5" />}
                  label="Duplicate document"
                  onClick={() => addDocument(duplicateDocument(document), document.id)}
                />
                {documents.length > 1 && (
                  <IconButton
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    label="Remove document"
                    onClick={() => onChange(documents.filter((item) => item.id !== document.id))}
                  />
                )}
              </div>
            </header>
            <div className="px-3 py-2.5">
              <FieldList
                fields={document.fields}
                path=""
                isArray={false}
                listId={`fields-${document.id}`}
                onAdd={() => addToDocument(document.id)}
              />
            </div>
          </section>
        ))}
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => addDocument(createDocument())}
        >
          Add another document
        </Button>
      </div>
    </EditorContext.Provider>
  );
};
