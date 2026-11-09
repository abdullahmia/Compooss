"use client";

import { CopyButton } from "@/components/copy-button";
import { SectionHeader } from "@/components/section-header";
import {
  DOCKER_COMPOSE_CODE,
  DOCKER_HUB_URL,
  DOCKER_RUN_CODE,
  ENV_VARS,
} from "@/lib/constants/landing.constants";
import { useState, type ReactNode } from "react";

const TABS = [
  { id: "compose", label: "docker-compose.yml", code: DOCKER_COMPOSE_CODE, highlight: highlightYaml },
  { id: "run", label: "docker run", code: DOCKER_RUN_CODE, highlight: highlightShell },
] as const;

/** Lines from the Compooss service down are the ones people add to their file. */
function addedLines(code: string) {
  const lines = code.split("\n");
  const start = lines.findIndex((line) => line.trim() === "compooss:");
  return start === -1 ? new Set<number>() : new Set(lines.map((_, i) => i).slice(start));
}

function yamlScalar(text: string): ReactNode {
  const value = text.trim();
  if (!value) return text;
  const lead = text.slice(0, text.length - text.trimStart().length);
  const color = /^\d+(\.\d+)?$/.test(value) ? "text-json-number" : "text-json-string";
  return (
    <>
      {lead}
      <span className={color}>{value}</span>
    </>
  );
}

function highlightYaml(line: string): ReactNode {
  const pair = /^(\s*)([\w.-]+)(:)(.*)$/.exec(line);
  if (pair) {
    const [, indent, key, colon, rest] = pair;
    return (
      <>
        {indent}
        <span className="text-json-key">{key}</span>
        <span className="text-fg-muted">{colon}</span>
        {yamlScalar(rest)}
      </>
    );
  }
  const item = /^(\s*)(- )(.*)$/.exec(line);
  if (item) {
    const [, indent, dash, rest] = item;
    return (
      <>
        {indent}
        <span className="text-fg-muted">{dash}</span>
        {yamlScalar(rest)}
      </>
    );
  }
  return line;
}

function highlightShell(line: string): ReactNode {
  if (line.trimStart().startsWith("#")) {
    return <span className="text-fg-muted">{line}</span>;
  }
  return line.split(/(\s+)/).map((token, i) => {
    if (token === "\\") return <span key={i} className="text-fg-muted">{token}</span>;
    if (token.startsWith("-")) return <span key={i} className="text-fg-secondary">{token}</span>;
    if (token.includes("/") || token.includes(":")) {
      return <span key={i} className="text-json-string">{token}</span>;
    }
    return token;
  });
}

export const Installation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("compose");
  const tab = TABS.find((t) => t.id === activeTab)!;
  const added = addedLines(tab.code);

  return (
    <section id="installation" className="py-12 md:py-16">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
        <div>
          <SectionHeader
            namespace="install"
            title="Add one service to your compose file"
            description={
              <>
                Put Compooss next to MongoDB in your existing{" "}
                <code className="whitespace-nowrap font-mono text-[15px] text-fg">
                  docker-compose.yml
                </code>
                , or run it on its own with{" "}
                <code className="whitespace-nowrap font-mono text-[15px] text-fg">
                  docker run
                </code>
                . There&apos;s nothing to build and no config file to write.
              </>
            }
          />

          <h3 className="mt-12 text-sm font-medium text-fg">
            Environment variables
          </h3>
          <dl className="mt-4 border-b border-line">
            {ENV_VARS.map((envVar) => (
              <div key={envVar.names[0]} className="border-t border-line py-4">
                <dt className="flex flex-wrap gap-x-3 font-mono text-[13px] text-fg">
                  {envVar.names.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </dt>
                <dd className="mt-1 text-sm text-fg-secondary">
                  {envVar.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-deep">
          <div className="flex h-11 items-center justify-between border-b border-line px-2">
            <div role="tablist" aria-label="Install method" className="flex h-full">
              {TABS.map((t) => {
                const isActive = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(t.id)}
                    className={`-mb-px border-b-2 px-3 font-mono text-xs transition-colors duration-150 ease-out ${
                      isActive
                        ? "border-fg text-fg"
                        : "border-transparent text-fg-muted hover:text-fg-secondary"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <CopyButton text={tab.code} label={`Copy ${tab.label}`} />
          </div>

          <pre
            role="tabpanel"
            className="overflow-x-auto py-4 font-mono text-xs leading-6 text-fg sm:text-[13px]"
          >
            <code>
              {tab.code.split("\n").map((line, i) => (
                <div
                  key={i}
                  className={`flex min-w-max pr-4 sm:pr-6 ${added.has(i) ? "bg-accent/[0.08]" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="w-10 shrink-0 select-none pr-3 text-right text-fg-muted/60 sm:w-12 sm:pr-4"
                  >
                    {i + 1}
                  </span>
                  <span
                    aria-hidden="true"
                    className="w-5 shrink-0 select-none text-accent sm:w-6"
                  >
                    {added.has(i) ? "+" : ""}
                  </span>
                  <span>{tab.highlight(line) || " "}</span>
                </div>
              ))}
            </code>
          </pre>

          <div className="flex h-11 items-center justify-between gap-4 border-t border-line px-4 text-xs">
            <span className="truncate font-mono text-fg-muted">
              abdullahmia/compooss:latest
            </span>
            <a
              href={DOCKER_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-fg-secondary transition-colors duration-150 ease-out hover:text-fg"
            >
              Docker Hub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
