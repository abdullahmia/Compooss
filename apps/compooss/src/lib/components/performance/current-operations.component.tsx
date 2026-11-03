"use client";

import { useKillOperation } from "@/lib/services/server/server.service";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import { formatDuration } from "@/lib/utils/performance.util";
import type { CurrentOperation } from "@compooss/types";
import { Badge, ConfirmDestructiveModal, IconButton } from "@compooss/ui";
import { Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  connection: string;
  operations: CurrentOperation[] | undefined;
  error: string | null;
  readOnly: boolean;
};

export const CurrentOperations: React.FC<Props> = ({
  connection,
  operations,
  error,
  readOnly,
}) => {
  const [toKill, setToKill] = useState<CurrentOperation | null>(null);
  const { mutate: killOperation, isPending } = useKillOperation(connection, {
    onSuccess: () => {
      toast.success(`Kill requested for operation ${toKill?.opid}`);
      setToKill(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not kill the operation.")),
  });

  return (
    <section className="border border-border rounded-lg bg-card min-w-0">
      <header className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Running operations</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Active client operations on the server, longest-running first.
        </p>
      </header>

      {error ? (
        <p className="px-4 py-6 text-xs text-destructive">{error}</p>
      ) : !operations ? (
        <p className="px-4 py-6 text-xs text-muted-foreground">Loading…</p>
      ) : operations.length === 0 ? (
        <p className="px-4 py-6 text-xs text-muted-foreground">No operations running right now.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="px-4 py-2 font-medium">Op ID</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Namespace</th>
                <th className="px-4 py-2 font-medium text-right">Running</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Command</th>
                {!readOnly && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {operations.map((op) => (
                <tr key={String(op.opid)} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-2 font-mono tabular-nums">{String(op.opid)}</td>
                  <td className="px-4 py-2">
                    <span className="text-foreground">{op.op}</span>
                    {op.waitingForLock && (
                      <Badge variant="warning" size="sm" className="ml-1.5">
                        Waiting for lock
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono">{op.ns || "–"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatDuration(op.secsRunning)}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {op.appName || op.client || op.description || "–"}
                  </td>
                  <td className="px-4 py-2 max-w-[360px]">
                    <code className="block font-mono text-[11px] text-muted-foreground truncate" title={op.command}>
                      {op.command}
                    </code>
                  </td>
                  {!readOnly && (
                    <td className="px-2 py-1 text-right">
                      <IconButton
                        variant="danger"
                        size="sm"
                        icon={<Ban className="h-3 w-3" />}
                        label="Kill operation"
                        onClick={() => setToKill(op)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDestructiveModal
        open={toKill !== null}
        onClose={() => setToKill(null)}
        title="Kill operation"
        icon={<Ban className="h-4 w-4" />}
        description={
          <>
            Stop operation <strong>{String(toKill?.opid)}</strong>
            {toKill?.ns ? <> on <strong>{toKill.ns}</strong></> : null}? The client
            that started it will get an error.
          </>
        }
        confirmLabel="Kill"
        isPending={isPending}
        onConfirm={() => {
          if (toKill) killOperation(toKill.opid);
        }}
      />
    </section>
  );
};
