"use client";

import {
  COMPARISON_ROWS,
  COMPARISON_TOOLS,
} from "@/lib/constants/landing.constants";
import type { ComparisonTool, ComparisonValue } from "@/lib/types/landing.type";
import { Check, X } from "lucide-react";
import { useState } from "react";

const COMPETITORS = COMPARISON_TOOLS.filter((tool) => !tool.highlight);

const ComparisonCell: React.FC<{ value: ComparisonValue; strong: boolean }> = ({
  value,
  strong,
}) => {
  if (value === "yes") {
    return (
      <>
        <Check
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className={strong ? "text-fg" : "text-fg-secondary"}
        />
        <span className="sr-only">Yes</span>
      </>
    );
  }
  if (value === "no") {
    return (
      <>
        <X size={16} strokeWidth={1.5} aria-hidden="true" className="text-fg-muted" />
        <span className="sr-only">No</span>
      </>
    );
  }
  if (value === "partial") {
    return <span className="text-xs text-fg-muted">Partial</span>;
  }
  return <span className="text-xs text-fg-secondary">{value}</span>;
};

/**
 * Every tool side by side from md up. Smaller screens compare Compooss with
 * one competitor at a time, picked with the switcher above the table.
 */
export const ComparisonTable: React.FC = () => {
  const [competitor, setCompetitor] = useState(COMPETITORS[0].key);

  const columnClass = (tool: ComparisonTool) =>
    [
      tool.highlight ? "bg-card" : "",
      tool.highlight || tool.key === competitor ? "" : "hidden md:table-cell",
    ].join(" ");

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Compare Compooss with"
        className="mt-6 grid grid-cols-3 gap-1 rounded-[10px] bg-deep p-1 md:hidden"
      >
        {COMPETITORS.map((tool) => {
          const isActive = tool.key === competitor;
          return (
            <button
              key={tool.key}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setCompetitor(tool.key)}
              className={`h-9 rounded-md px-2 text-[13px] transition-colors duration-150 ease-out ${
                isActive
                  ? "bg-raised text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-fg-muted hover:text-fg-secondary"
              }`}
            >
              {tool.shortName}
            </button>
          );
        })}
      </div>

      <div className="relative mt-4 overflow-x-auto rounded-2xl border border-line md:mt-6">
        <table className="w-full border-collapse text-left text-sm md:min-w-[680px]">
          <thead>
            <tr className="border-b border-line">
              <th
                scope="col"
                className="px-4 py-4 align-bottom text-xs font-normal text-fg-muted md:w-[36%] md:px-6"
              >
                Feature
              </th>
              {COMPARISON_TOOLS.map((tool) => (
                <th
                  key={tool.key}
                  scope="col"
                  className={`w-20 px-2 py-4 align-bottom font-normal md:w-auto md:px-4 ${columnClass(tool)}`}
                >
                  <span
                    className={`block text-[13px] font-medium md:text-sm ${tool.highlight ? "text-fg" : "text-fg-secondary"}`}
                  >
                    <span className="md:hidden">{tool.shortName}</span>
                    <span className="hidden md:inline">{tool.name}</span>
                  </span>
                  <span className="mt-1 hidden text-xs text-fg-muted md:block">
                    {tool.description}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-line last:border-b-0">
                <th
                  scope="row"
                  className="px-4 py-3 font-normal leading-6 text-fg-secondary md:px-6"
                >
                  {row.feature}
                </th>
                {COMPARISON_TOOLS.map((tool) => (
                  <td
                    key={tool.key}
                    className={`px-2 py-3 align-middle md:px-4 ${columnClass(tool)}`}
                  >
                    <ComparisonCell value={row[tool.key]} strong={tool.highlight} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
