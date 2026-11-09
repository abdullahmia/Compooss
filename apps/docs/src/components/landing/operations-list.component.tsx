"use client";

import { USAGE_OPERATIONS } from "@/lib/constants/landing.constants";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/** How many groups phones show before "Show all". Wider screens show every group. */
const MOBILE_GROUPS = 2;

const OPERATION_COUNT = USAGE_OPERATIONS.reduce(
  (count, group) => count + group.items.length,
  0,
);

export const OperationsList: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        id="operations"
        className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4"
      >
        {USAGE_OPERATIONS.map((group, i) => (
          <div
            key={group.title}
            className={!expanded && i >= MOBILE_GROUPS ? "hidden sm:block" : ""}
          >
            <h4 className="text-sm font-medium text-fg">{group.title}</h4>
            <ul className="mt-3 flex flex-col gap-2">
              {group.items.map((item) => (
                <li key={item} className="text-sm leading-5 text-fg-secondary">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="operations"
        onClick={() => setExpanded((value) => !value)}
        className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-raised text-sm text-fg transition-colors duration-150 ease-out hover:border-line-strong sm:hidden"
      >
        {expanded ? "Show fewer" : `Show all ${OPERATION_COUNT} operations`}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`text-fg-muted transition-transform duration-150 ease-out ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    </>
  );
};
