import { FileText, Grid3X3, TerminalSquare } from "lucide-react";

export const WORKSPACE_FEATURES = [
  {
    id: "documents",
    label: "Browse Documents",
    desc: "View and edit documents in list, JSON, or table view",
    icon: FileText,
    action: "navigate" as const,
    tab: "documents" as const,
    color: "from-blue-500/15 to-blue-500/5",
    iconColor: "text-blue-400",
    borderColor: "group-hover:border-blue-500/20",
  },
  {
    id: "schema",
    label: "Analyze Schema",
    desc: "Detect fields, type distributions, and nested structures",
    icon: Grid3X3,
    action: "navigate" as const,
    tab: "schema" as const,
    color: "from-purple-500/15 to-purple-500/5",
    iconColor: "text-purple-400",
    borderColor: "group-hover:border-purple-500/20",
  },
  {
    id: "shell",
    label: "MongoDB Shell",
    desc: "Run commands, queries, and scripts interactively",
    icon: TerminalSquare,
    action: "shell" as const,
    tab: null,
    color: "from-emerald-500/15 to-emerald-500/5",
    iconColor: "text-emerald-400",
    borderColor: "group-hover:border-emerald-500/20",
  },
] as const;

export const SIDEBAR_WIDTH_STORAGE_KEY = "compooss-sidebar-width";
export const SIDEBAR_DEFAULT_WIDTH = 256;
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 600;
