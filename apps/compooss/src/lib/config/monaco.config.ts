import { loader } from "@monaco-editor/react";

/**
 * Load Monaco from the copy in public/monaco (scripts/copy-monaco.ts) rather
 * than the jsdelivr CDN, so the editors work offline and in the desktop app.
 */
loader.config({ paths: { vs: "/monaco/vs" } });
