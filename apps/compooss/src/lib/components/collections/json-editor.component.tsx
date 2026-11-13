"use client";

import { defineMonacoThemes } from "@/lib/components/collections/monaco-themes";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";

type Props = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  onMount?: OnMount;
}

const handleBeforeMount: BeforeMount = (monaco) => {
  defineMonacoThemes(monaco);
  // Callers strip comments before parsing, so the editor shouldn't flag them.
  monaco.json?.jsonDefaults.setDiagnosticsOptions({
    ...monaco.json.jsonDefaults.diagnosticsOptions,
    allowComments: true,
    comments: "ignore",
  });
};

export const JsonEditor: React.FC<Props> = ({ value, onChange, height = "260px", onMount }) => {
  const { resolvedTheme } = useTheme();

  const monacoTheme = resolvedTheme === "light" ? "compooss-light" : "compooss-dark";

  const handleChange = (nextValue?: string) => {
    onChange(nextValue ?? "");
  };

  const handleMount: OnMount = (instance, monaco) => {
    instance.updateOptions({
      fontSize: 12,
      minimap: { enabled: false },
      lineNumbers: "on",
      wordWrap: "on",
    });
    onMount?.(instance, monaco);
  };

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="json"
        theme={monacoTheme}
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};
