"use client";

import { Badge, Button, EmptyState, IconButton } from "@compooss/ui";
import { JsonEditor } from "@/lib/components/collections/json-editor.component";
import {
  useGetValidation,
  useUpdateValidation,
  useCheckValidation,
} from "@/lib/services/validation/validation.service";
import { VALIDATION_LEVELS, VALIDATION_ACTIONS, VALIDATION_SAMPLE_SIZES } from "@/lib/constants";
import type {
  ValidationLevel,
  ValidationAction,
  ValidationCheckResult,
} from "@compooss/types";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCollectionScope } from "@/lib/providers/collection-scope";
import { useCallback, useEffect, useState } from "react";

type Props = { readOnly?: boolean };

const DEFAULT_SCHEMA = JSON.stringify(
  {
    $jsonSchema: {
      bsonType: "object",
      properties: {},
    },
  },
  null,
  2,
);

function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "{}";
  }
}

function CheckResultsPanel({
  result,
  expanded,
  onToggle,
}: {
  result: ValidationCheckResult;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const passRate =
    result.totalDocuments > 0
      ? Math.round((result.validCount / result.totalDocuments) * 100)
      : 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Documents</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">
            {result.totalDocuments.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Valid</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold tabular-nums text-success">
              {result.validCount.toLocaleString()}
            </p>
            <span className="text-xs text-muted-foreground">{passRate}%</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Invalid</p>
          <p
            className={`text-xl font-semibold tabular-nums ${result.invalidCount > 0 ? "text-destructive" : "text-foreground"}`}
          >
            {result.invalidCount.toLocaleString()}
          </p>
        </div>
      </div>

      {result.invalidDocuments.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <h4 className="text-sm font-medium text-foreground">
              Invalid Documents ({result.invalidDocuments.length})
            </h4>
          </div>
          <div className="divide-y divide-border">
            {result.invalidDocuments.map((doc) => {
              const isOpen = expanded.has(doc._id);
              return (
                <div key={doc._id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-sidebar-accent/50 transition-colors"
                    onClick={() => onToggle(doc._id)}
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                    <span className="font-mono text-xs text-foreground truncate">
                      {doc._id}
                    </span>
                    <Badge variant="destructive" size="sm" className="ml-auto shrink-0">
                      {doc.errors.length} error{doc.errors.length !== 1 ? "s" : ""}
                    </Badge>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 pl-11">
                      <div className="space-y-1.5">
                        {doc.errors.map((err, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs"
                          >
                            <X className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.invalidCount === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-4">
          <Check className="h-4 w-4 text-success shrink-0" />
          <p className="text-sm text-muted-foreground">
            All documents pass the current validation rules.
          </p>
        </div>
      )}
    </div>
  );
}

export const ValidationTab: React.FC<Props> = ({ readOnly = false }) => {
  const { dbName, collectionName } = useCollectionScope();

  const [validatorJson, setValidatorJson] = useState(DEFAULT_SCHEMA);
  const [level, setLevel] = useState<ValidationLevel>("strict");
  const [action, setAction] = useState<ValidationAction>("error");
  const [hasEdited, setHasEdited] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<ValidationCheckResult | null>(null);
  const [checkSampleSize, setCheckSampleSize] = useState(1000);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const {
    data: validation,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetValidation(dbName, collectionName, {
    enabled: !!dbName && !!collectionName,
  });

  const updateValidation = useUpdateValidation(dbName, collectionName, {
    onSuccess: () => {
      setHasEdited(false);
      setJsonError(null);
    },
  });

  const checkValidation = useCheckValidation(dbName, collectionName, {
    onSuccess: (data) => setCheckResult(data),
  });

  useEffect(() => {
    if (!validation) return;
    const json = validation.validator
      ? formatJson(validation.validator)
      : DEFAULT_SCHEMA;
    setValidatorJson(json);
    setLevel(validation.validationLevel);
    setAction(validation.validationAction);
    setHasEdited(false);
    setJsonError(null);
  }, [validation]);

  const handleJsonChange = useCallback(
    (value: string) => {
      setValidatorJson(value);
      setHasEdited(true);
      setJsonError(null);
    },
    [],
  );

  const handleApply = useCallback(() => {
    setJsonError(null);
    try {
      const cleaned = validatorJson.trim();
      if (!cleaned) {
        setJsonError("Validator JSON cannot be empty.");
        return;
      }
      const parsed = JSON.parse(cleaned);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError("Validator must be a JSON object.");
        return;
      }
      updateValidation.mutate({
        validator: parsed,
        validationLevel: level,
        validationAction: action,
      });
    } catch (err) {
      setJsonError(
        err instanceof Error ? err.message : "Invalid JSON syntax.",
      );
    }
  }, [validatorJson, level, action, updateValidation]);

  const handleCheck = useCallback(() => {
    setCheckResult(null);
    setExpandedDocs(new Set());
    checkValidation.mutate({ sampleSize: checkSampleSize });
  }, [checkValidation, checkSampleSize]);

  const toggleDocExpand = useCallback((id: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (isError && error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-destructive">
            Failed to load validation rules
          </p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          <Button variant="ghost" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading validation rules...
          </p>
        </div>
      </div>
    );
  }

  const hasValidator =
    validation?.validator != null &&
    Object.keys(validation.validator).length > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Validation</span>
          {validation && (
            <>
              <Badge
                variant={validation.validationLevel === "off" ? "subtle" : "default"}
                size="sm"
              >
                {validation.validationLevel}
              </Badge>
              <Badge
                variant={validation.validationAction === "warn" ? "warning" : "subtle"}
                size="sm"
              >
                {validation.validationAction}
              </Badge>
            </>
          )}
          <IconButton
            variant="default"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            label="Refresh"
            onClick={() => refetch()}
          />
        </div>
        {!readOnly && hasEdited && (
          <Button
            variant="primary"
            icon={
              updateValidation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )
            }
            onClick={handleApply}
            disabled={updateValidation.isPending}
          >
            Apply
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!hasValidator && !hasEdited ? (
          <div className="flex flex-1 items-center justify-center min-h-[280px]">
            <EmptyState
              icon={<ShieldCheck className="h-12 w-12 text-muted-foreground" />}
              title="No validation rules"
              description="This collection has no validation rules configured. Add a JSON Schema validator to enforce document structure."
              primaryAction={
                !readOnly
                  ? {
                      label: "Add validation rule",
                      onClick: () => setHasEdited(true),
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Validation Rule
                </h3>
                {readOnly && (
                  <Badge variant="subtle" size="sm">
                    Read-only
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Validator (JSON)
                  </label>
                  <JsonEditor
                    value={validatorJson}
                    onChange={handleJsonChange}
                    height="480px"
                  />
                  {jsonError && (
                    <div className="flex items-start gap-2 mt-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive">{jsonError}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Validation Level
                    </label>
                    <div className="space-y-1.5">
                      {VALIDATION_LEVELS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={readOnly}
                          onClick={() => {
                            setLevel(opt.value);
                            setHasEdited(true);
                          }}
                          className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                            level === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card/50 hover:bg-card/80"
                          } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full border-2 flex items-center justify-center ${
                                level === opt.value
                                  ? "border-primary"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {level === opt.value && (
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {opt.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 ml-5">
                            {opt.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Validation Action
                    </label>
                    <div className="space-y-1.5">
                      {VALIDATION_ACTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={readOnly}
                          onClick={() => {
                            setAction(opt.value);
                            setHasEdited(true);
                          }}
                          className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                            action === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card/50 hover:bg-card/80"
                          } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full border-2 flex items-center justify-center ${
                                action === opt.value
                                  ? "border-primary"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {action === opt.value && (
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {opt.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 ml-5">
                            {opt.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {!readOnly && (
                    <Button
                      variant="primary"
                      className="w-full"
                      icon={
                        updateValidation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )
                      }
                      onClick={handleApply}
                      disabled={updateValidation.isPending || !hasEdited}
                    >
                      {updateValidation.isPending
                        ? "Applying..."
                        : "Apply Validation Rules"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Validate Documents
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Check existing documents against the current validation
                    rules to find violations.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Sample
                    <select
                      value={checkSampleSize}
                      onChange={(e) =>
                        setCheckSampleSize(Number(e.target.value))
                      }
                      className="h-8 rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {VALIDATION_SAMPLE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    variant="primary"
                    icon={
                      checkValidation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ClipboardCheck className="h-3.5 w-3.5" />
                      )
                    }
                    onClick={handleCheck}
                    disabled={checkValidation.isPending || !hasValidator}
                  >
                    {checkValidation.isPending
                      ? "Checking..."
                      : "Run Validation Check"}
                  </Button>
                </div>
              </div>

              {!hasValidator && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-4">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Apply a validation rule first to check documents against it.
                  </p>
                </div>
              )}

              {checkValidation.isPending && !checkResult && (
                <div className="flex flex-col items-center justify-center min-h-[160px] gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Validating documents...
                  </p>
                </div>
              )}

              {checkResult && (
                <CheckResultsPanel
                  result={checkResult}
                  expanded={expandedDocs}
                  onToggle={toggleDocExpand}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
