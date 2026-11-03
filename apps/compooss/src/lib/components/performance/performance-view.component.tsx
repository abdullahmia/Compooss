"use client";

import { CurrentOperations } from "@/lib/components/performance/current-operations.component";
import { SlowQueries } from "@/lib/components/performance/slow-queries.component";
import { StatTile } from "@/lib/components/performance/stat-tile.component";
import {
  TimeSeriesChart,
  type ChartRow,
  type ChartSeries,
} from "@/lib/components/performance/time-series-chart.component";
import { useConnection } from "@/lib/providers/connection-provider";
import {
  useCurrentOperations,
  useServerStatusHistory,
} from "@/lib/services/server/server.service";
import { formatBytes } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/utils/api-error.util";
import {
  formatDuration,
  formatRate,
  OPERATION_TYPES,
  PERFORMANCE_POLL_INTERVAL_MS,
} from "@/lib/utils/performance.util";
import { Button } from "@compooss/ui";
import { Activity, Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";

const OPERATION_LABELS: Record<(typeof OPERATION_TYPES)[number], string> = {
  insert: "Insert",
  query: "Query",
  update: "Update",
  delete: "Delete",
  getmore: "Getmore",
  command: "Command",
};

// Each series keeps its slot (and color) regardless of which others have data.
const OPS_SERIES: ChartSeries[] = OPERATION_TYPES.map((type, i) => ({
  key: type,
  label: OPERATION_LABELS[type],
  color: `var(--viz-${i + 1})`,
}));
const NETWORK_SERIES: ChartSeries[] = [
  { key: "in", label: "In", color: "var(--viz-1)" },
  { key: "out", label: "Out", color: "var(--viz-2)" },
];
const CONNECTIONS_SERIES: ChartSeries[] = [
  { key: "connections", label: "Connections", color: "var(--viz-1)" },
];
const MEMORY_SERIES: ChartSeries[] = [
  { key: "resident", label: "Resident", color: "var(--viz-1)" },
];

const formatBytesPerSec = (value: number) => `${formatBytes(value)}/s`;
const formatMegabytes = (value: number) => formatBytes(value * 1024 * 1024);
const formatCount = (value: number) => Math.round(value).toLocaleString();

export const PerformanceView: React.FC = () => {
  const { maskedUri, isReadOnly } = useConnection();
  const connection = maskedUri ?? "";
  const [paused, setPaused] = useState(false);

  const status = useServerStatusHistory(connection, paused);
  const operations = useCurrentOperations(connection, paused);

  const latest = status.data?.latest;
  const points = useMemo(() => status.data?.points ?? [], [status.data]);
  const latestPoint = points[points.length - 1];

  const rows = useMemo(
    () => ({
      ops: points.map((p) => ({ time: p.time, ...p.ops }) as ChartRow),
      network: points.map((p) => ({ time: p.time, in: p.bytesInPerSec, out: p.bytesOutPerSec })),
      connections: points.map((p) => ({ time: p.time, connections: p.connections })),
      memory: points.map((p) => ({ time: p.time, resident: p.residentMB })),
    }),
    [points],
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto min-w-0">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {latest
              ? `${latest.host} · MongoDB ${latest.version} · up ${formatDuration(latest.uptimeSeconds)}`
              : "Reading server status…"}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${paused ? "bg-muted-foreground" : "bg-primary animate-pulse"}`}
          />
          {paused ? "Paused" : `Live · every ${PERFORMANCE_POLL_INTERVAL_MS / 1000}s`}
        </span>
        <Button
          variant="outline"
          size="sm"
          icon={paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>

      {status.isError && (
        <div className="text-xs px-3 py-2.5 rounded-sm border bg-destructive/5 text-destructive border-destructive/20">
          {getApiErrorMessage(status.error, "Could not read server status.")} Some hosted
          plans don&apos;t allow serverStatus; the database user may also need the
          clusterMonitor role.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatTile
          label="Operations per second"
          value={latestPoint ? formatRate(latestPoint.totalOps) : "–"}
          detail="All operation types"
        />
        <StatTile
          label="Connections"
          value={latest ? formatCount(latest.connections.current) : "–"}
          detail={latest ? `${formatCount(latest.connections.available)} available` : undefined}
        />
        <StatTile
          label="Network in"
          value={latestPoint ? formatBytesPerSec(latestPoint.bytesInPerSec) : "–"}
        />
        <StatTile
          label="Network out"
          value={latestPoint ? formatBytesPerSec(latestPoint.bytesOutPerSec) : "–"}
        />
        <StatTile
          label="Resident memory"
          value={latest ? formatMegabytes(latest.memory.residentMB) : "–"}
          detail={latest ? `${formatMegabytes(latest.memory.virtualMB)} virtual` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TimeSeriesChart
          title="Operations per second"
          caption="Includes the commands this page sends to refresh itself."
          series={OPS_SERIES}
          rows={rows.ops}
          formatValue={formatRate}
        />
        <TimeSeriesChart
          title="Network"
          caption="Bytes per second"
          series={NETWORK_SERIES}
          rows={rows.network}
          formatValue={formatBytesPerSec}
          valueKind="bytes"
        />
        <TimeSeriesChart
          title="Connections"
          series={CONNECTIONS_SERIES}
          rows={rows.connections}
          formatValue={formatCount}
        />
        <TimeSeriesChart
          title="Resident memory"
          series={MEMORY_SERIES}
          rows={rows.memory}
          formatValue={formatMegabytes}
        />
      </div>

      <CurrentOperations
        connection={connection}
        operations={operations.data}
        error={
          operations.isError
            ? getApiErrorMessage(operations.error, "Could not list running operations.")
            : null
        }
        readOnly={isReadOnly}
      />

      <SlowQueries connection={connection} paused={paused} readOnly={isReadOnly} />
    </div>
  );
};
