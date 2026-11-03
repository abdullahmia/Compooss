"use client";

import { niceTicks } from "@/lib/utils/performance.util";
import { IconButton } from "@compooss/ui";
import { LineChart as LineChartIcon, Table2 } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

export type ChartSeries = {
  key: string;
  label: string;
  /** A --viz-N variable, so the series keeps its color in both themes. */
  color: string;
};

export type ChartRow = { time: number } & Record<string, number>;

type Props = {
  title: string;
  /** Shown under the title, e.g. to explain what a series includes. */
  caption?: string;
  series: ChartSeries[];
  rows: ChartRow[];
  formatValue: (value: number) => string;
  /** Byte values get ticks on round KB/MB steps. */
  valueKind?: "number" | "bytes";
};

const PLOT_HEIGHT = 180;

const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** A short stroke in the series color: identity without coloring the text. */
const LineKey: React.FC<{ color: string }> = ({ color }) => (
  <span className="inline-block w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
);

/** Crosshair readout: every series at the hovered time, values first. */
function ChartTooltip({
  active,
  payload,
  label,
  series,
  formatValue,
}: TooltipProps<number, string> & Pick<Props, "series" | "formatValue">) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1.5">{formatTime(Number(label))}</p>
      <div className="space-y-1">
        {series.map((s) => {
          const entry = payload.find((p) => p.dataKey === s.key);
          if (!entry) return null;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <LineKey color={s.color} />
              <span className="font-semibold text-foreground tabular-nums">
                {formatValue(Number(entry.value))}
              </span>
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TimeSeriesChart: React.FC<Props> = ({
  title,
  caption,
  series,
  rows,
  formatValue,
  valueKind = "number",
}) => {
  const [showTable, setShowTable] = useState(false);
  const latest = rows[rows.length - 1];
  const maxValue = Math.max(0, ...rows.flatMap((row) => series.map((s) => row[s.key] ?? 0)));
  const yTicks = niceTicks(maxValue, valueKind);

  return (
    <figure className="border border-border rounded-lg bg-card p-4 min-w-0">
      <figcaption className="flex items-start gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {caption && <p className="text-[11px] text-muted-foreground mt-0.5">{caption}</p>}
        </div>

        {/* Legend with the latest value of each series, so the current reading needs no hover. */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs">
              {series.length > 1 && <LineKey color={s.color} />}
              {series.length > 1 && <span className="text-muted-foreground">{s.label}</span>}
              <span className="font-medium text-foreground tabular-nums">
                {latest ? formatValue(latest[s.key]) : "–"}
              </span>
            </span>
          ))}
        </div>

        <IconButton
          variant="default"
          size="sm"
          icon={showTable ? <LineChartIcon className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
          label={showTable ? "Show chart" : "Show as table"}
          onClick={() => setShowTable((value) => !value)}
        />
      </figcaption>

      {rows.length < 2 ? (
        <div
          className="flex items-center justify-center text-xs text-muted-foreground"
          style={{ height: PLOT_HEIGHT }}
        >
          Collecting data…
        </div>
      ) : showTable ? (
        <div className="overflow-auto" style={{ height: PLOT_HEIGHT }}>
          <table className="w-full text-xs tabular-nums">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground py-1.5 pr-3">Time</th>
                {series.map((s) => (
                  <th key={s.key} className="text-right font-medium text-muted-foreground py-1.5 pl-3">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((row) => (
                <tr key={row.time} className="border-b border-border/50">
                  <td className="py-1 pr-3 text-muted-foreground">{formatTime(row.time)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1 pl-3 text-right text-foreground">
                      {formatValue(row[s.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={PLOT_HEIGHT}>
          <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatTime}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              stroke="hsl(var(--border))"
              tickLine={false}
              minTickGap={48}
            />
            <YAxis
              ticks={yTicks}
              domain={[0, yTicks[yTicks.length - 1]]}
              tickFormatter={formatValue}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={64}
              allowDecimals
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
              content={<ChartTooltip series={series} formatValue={formatValue} />}
              isAnimationActive={false}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                type="linear"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4, fill: s.color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
};
