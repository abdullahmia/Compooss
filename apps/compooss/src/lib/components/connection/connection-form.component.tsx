"use client";

import {
  ConnectionFormSchema,
  type TConnectionForm,
} from "@/lib/schemas/connection.schema";
import { Button, cn, Input, Toggle } from "@compooss/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Plug2,
  Star,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ColorPicker } from "./color-picker.component";

type Props = {
  defaultValues?: Partial<TConnectionForm>;
  onSubmit: (data: TConnectionForm) => Promise<void>;
  onTest: (uri: string) => Promise<{ ok: boolean; message: string }>;
  isConnecting?: boolean;
  editMode?: boolean;
  submitError?: string | null;
};

export const ConnectionForm: React.FC<Props> = ({
  defaultValues,
  onSubmit,
  onTest,
  isConnecting,
  editMode,
  submitError,
}) => {
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TConnectionForm>({
    resolver: zodResolver(ConnectionFormSchema),
    defaultValues: {
      connectionString: "mongodb://localhost:27017",
      connectionName: "",
      isFavorite: false,
      readOnly: false,
      authType: "default",
      ...defaultValues,
    },
  });

  const isFavorite = useWatch({ control: form.control, name: "isFavorite" });
  const colorValue = useWatch({ control: form.control, name: "color" });
  const readOnly = useWatch({ control: form.control, name: "readOnly" });
  const connectionString = useWatch({
    control: form.control,
    name: "connectionString",
  });

  const handleTest = async () => {
    const uri = form.getValues("connectionString");
    if (!uri) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(uri);
      setTestResult(result);
    } catch {
      setTestResult({ ok: false, message: "Test failed" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFormSubmit = async (data: TConnectionForm) => {
    setTestResult(null);
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)}>
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/30">
        {/* Glass surface */}
        <div className="absolute inset-0 bg-white/60 dark:bg-white/[0.04] backdrop-blur-2xl" />
        <div className="absolute inset-0 border border-black/[0.06] dark:border-white/[0.12] rounded-2xl pointer-events-none" />
        <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/80 to-white/20 dark:from-white/[0.06] dark:to-transparent pointer-events-none" />

        <div className="relative z-10 p-6 space-y-5">
          {/* Connection string */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Connection String
            </label>
            <Input
              hookForm={
                form as unknown as import("react-hook-form").UseFormReturn<
                  Record<string, unknown>
                >
              }
              name="connectionString"
              placeholder="mongodb://localhost:27017"
              variant="default"
              inputSize="lg"
              className="w-full font-mono text-[13px]"
            />
            <p className="text-[11px] text-muted-foreground/50">
              Standard URI or SRV (mongodb+srv://)
            </p>
          </div>

          {/* Thin rule */}
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Display Name
            </label>
            <Input
              hookForm={
                form as unknown as import("react-hook-form").UseFormReturn<
                  Record<string, unknown>
                >
              }
              name="connectionName"
              placeholder="e.g. Local Dev, Staging Cluster"
              variant="default"
              inputSize="lg"
              className="w-full"
            />
          </div>

          {/* Color tag */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tag Color
              </p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Shown as a dot in the sidebar
              </p>
            </div>
            <ColorPicker
              value={colorValue}
              onChange={(c) => form.setValue("color", c)}
            />
          </div>

          {/* Read-only */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Read-only
              </p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Block inserts, edits, deletes, and drops on this connection
              </p>
            </div>
            <Toggle
              label="Read-only"
              checked={readOnly ?? false}
              onChange={(checked) => form.setValue("readOnly", checked)}
            />
          </div>
        </div>
      </div>

      {/* Feedback banners */}
      {(testResult || submitError) && (
        <div className="mt-3 space-y-2">
          {testResult && (
            <div
              className={cn(
                "flex items-start gap-2.5 text-xs px-3.5 py-3 rounded-xl border",
                testResult.ok
                  ? "bg-success/5 text-success border-success/20"
                  : "bg-destructive/5 text-destructive border-destructive/20",
              )}
            >
              {testResult.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 mt-px shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 mt-px shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
          {submitError && (
            <div className="flex items-start gap-2.5 text-xs px-3.5 py-3 rounded-xl border bg-destructive/5 text-destructive border-destructive/20">
              <XCircle className="h-3.5 w-3.5 mt-px shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5">
        <Button
          type="submit"
          disabled={isSubmitting || isConnecting}
          loading={isSubmitting || isConnecting}
          icon={<Plug2 className="h-3.5 w-3.5" />}
        >
          {editMode ? "Save & Connect" : "Connect"}
        </Button>

        <Button
          variant="outline"
          type="button"
          onClick={handleTest}
          disabled={isTesting || !connectionString}
          loading={isTesting}
        >
          {isTesting ? "Testing…" : "Test Connection"}
        </Button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() =>
            form.setValue("isFavorite", !form.getValues("isFavorite"))
          }
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
            isFavorite
              ? "bg-warning/10 text-warning border-warning/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary border-transparent",
          )}
        >
          <Star
            className={cn(
              "h-3 w-3 transition-all",
              isFavorite ? "fill-warning text-warning" : "",
            )}
          />
          {isFavorite ? "Favorited" : "Favorite"}
        </button>
      </div>
    </form>
  );
};
