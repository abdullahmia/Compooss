import type {
  ComparisonRow,
  ComparisonTool,
  DesktopPlatform,
  EnvVar,
  Feature,
  OperationGroup,
} from "@/lib/types/landing.type";
import {
  ArrowUpDown,
  Container,
  Database,
  Eye,
  FileJson,
  Grid3X3,
  Layers,
  ListTree,
  Plug2,
  Search,
  Shield,
  SunMoon,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";

export const GITHUB_URL = "https://github.com/abdullahmia/compooss";
export const DOCKER_HUB_URL = "https://hub.docker.com/r/abdullahmia/compooss";

/** In the order the sections appear on the page. */
export const NAV_LINKS = [
  { label: "Installation", href: "#installation" },
  { label: "Download", href: "#download" },
  { label: "Features", href: "#features" },
  { label: "Why Compooss", href: "#why-compooss" },
  { label: "Usage", href: "#usage" },
];

export const FEATURES: Feature[] = [
  {
    icon: Database,
    title: "Database management",
    description:
      "List, create and drop databases, with document counts, storage size and indexes for each one.",
  },
  {
    icon: Layers,
    title: "Collection explorer",
    description:
      "Browse collections from an expandable sidebar, with document count, storage size, index count and average document size.",
  },
  {
    icon: Search,
    title: "Query and filter documents",
    description:
      "Run queries in native MongoDB filter syntax, then sort and paginate the results without leaving the browser.",
  },
  {
    icon: Eye,
    title: "List, JSON and table views",
    description:
      "Switch between list, JSON and table views to read your data in the shape that suits the task.",
  },
  {
    icon: FileJson,
    title: "Full document CRUD",
    description:
      "Create, read, update and delete documents in a Monaco editor with JSON validation and syntax highlighting.",
  },
  {
    icon: Grid3X3,
    title: "Index management",
    description:
      "Create, drop, hide and inspect unique, compound, text, geospatial, TTL, partial and hashed indexes, with usage statistics.",
  },
  {
    icon: ListTree,
    title: "Schema analysis",
    description:
      "Sample a collection to see its fields, type distribution, frequency, value distributions, nested and array structures, and missing fields.",
  },
  {
    icon: Workflow,
    title: "Aggregation pipelines",
    description:
      "Build pipelines from stage templates, reorder stages by dragging, preview each stage, save pipelines and create views from them.",
  },
  {
    icon: Terminal,
    title: "MongoDB shell",
    description:
      "Run CRUD, aggregation and admin commands or JavaScript from an embedded shell with autocomplete, highlighting and saved sessions.",
  },
  {
    icon: Plug2,
    title: "Multiple connections",
    description:
      "Save and switch connection profiles, with SCRAM, X.509, LDAP and Kerberos auth, TLS, colors, favorites and a connection test.",
  },
  {
    icon: Shield,
    title: "Read-only system databases",
    description:
      "admin, local and config are read-only, so a misclick can't drop critical data.",
  },
  {
    icon: Container,
    title: "Docker deployment",
    description:
      "Ships as one Docker image you add to any docker-compose.yml, with no external dependencies.",
  },
  {
    icon: Zap,
    title: "Standalone Next.js server",
    description:
      "Built on Next.js with standalone output, so the container stays small and needs no configuration.",
  },
  {
    icon: SunMoon,
    title: "Dark, light and system themes",
    description:
      "Follows your system theme or stays in the one you pick, built with Tailwind CSS and shadcn/ui.",
  },
  {
    icon: ArrowUpDown,
    title: "Data export and import",
    description:
      "Export to JSON or CSV in Default, Relaxed or Canonical Extended JSON, so ObjectId, Long and Decimal128 survive. Import JSON or CSV with a live preview and per-row errors.",
  },
];

export const CORE_FEATURES = [
  FEATURES[0], // Database management
  FEATURES[1], // Collection explorer
  FEATURES[4], // Full document CRUD
  FEATURES[14], // Data export and import
  FEATURES[7], // Aggregation pipelines
  FEATURES[9], // Multiple connections
];

export const WHY_REASONS = [
  {
    title: "Runs in your Compose stack",
    description:
      "One service block next to your app. No separate install and no config files.",
  },
  {
    title: "Free and open source",
    description:
      "MIT licensed, with no paywall, no usage limits and no account to create.",
  },
  {
    title: "Nothing to set up",
    description:
      "No wizards, license keys or cloud sync. Start the container and connect.",
  },
];

export const COMPARISON_TOOLS: ComparisonTool[] = [
  { key: "compooss", name: "Compooss", shortName: "Compooss", description: "Web and desktop · Free", highlight: true },
  { key: "compass", name: "MongoDB Compass", shortName: "Compass", description: "Desktop app · Install required", highlight: false },
  { key: "mongoExpress", name: "Mongo Express", shortName: "Mongo Express", description: "Web UI · Minimal features", highlight: false },
  { key: "studio3t", name: "Studio 3T", shortName: "Studio 3T", description: "Professional IDE · Paid", highlight: false },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Docker-native deployment", compooss: "yes", compass: "no", mongoExpress: "partial", studio3t: "no" },
  { feature: "Zero configuration", compooss: "yes", compass: "no", mongoExpress: "partial", studio3t: "no" },
  { feature: "Web-based (no install)", compooss: "yes", compass: "no", mongoExpress: "yes", studio3t: "no" },
  { feature: "Desktop app (macOS, Windows, Linux)", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Dark, light and system themes", compooss: "yes", compass: "partial", mongoExpress: "no", studio3t: "partial" },
  { feature: "Document CRUD", compooss: "yes", compass: "yes", mongoExpress: "yes", studio3t: "yes" },
  { feature: "Index management", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Schema analysis", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Aggregation pipeline builder", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Built-in MongoDB shell", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "partial" },
  { feature: "Query with MongoDB syntax", compooss: "yes", compass: "yes", mongoExpress: "partial", studio3t: "yes" },
  { feature: "Free and open source", compooss: "yes", compass: "partial", mongoExpress: "yes", studio3t: "no" },
  { feature: "No signup or cloud required", compooss: "yes", compass: "yes", mongoExpress: "yes", studio3t: "no" },
  { feature: "Multiple connection profiles", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Data export (JSON / CSV)", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Extended JSON export modes (Default / Relaxed / Canonical)", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "partial" },
  { feature: "Data import (JSON / CSV)", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "System DB read-only protection", compooss: "yes", compass: "no", mongoExpress: "no", studio3t: "no" },
  { feature: "Single-container deployment", compooss: "yes", compass: "no", mongoExpress: "yes", studio3t: "no" },
];

export const DOCKER_COMPOSE_CODE = `services:
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"

  compooss:
    image: abdullahmia/compooss:latest
    ports:
      - "6969:3000"
    depends_on:
      - mongo`;

export const DOCKER_RUN_CODE = `# Run Compooss and connect via the /connect page
docker run -p 6969:3000 \\
  abdullahmia/compooss:latest`;

export const ENV_VARS: EnvVar[] = [
  {
    names: ["PORT"],
    description: "The port the server listens on inside the container. Default 3000",
  },
  {
    names: ["COMPOOSS_USERNAME", "COMPOOSS_PASSWORD"],
    description:
      "Optional. Set both to require a login for every page and API call",
  },
];

export const USAGE_STEPS = [
  {
    step: "01",
    title: "Add the service",
    description:
      "Put the Compooss service in your compose file, next to your MongoDB container.",
  },
  {
    step: "02",
    title: "Open localhost:6969",
    description:
      "Run docker compose up and open Compooss in your browser. Nothing else to install.",
  },
  {
    step: "03",
    title: "Connect and explore",
    description:
      "On the /connect page, enter your connection string, test it and save it as a profile. Then browse, query and edit.",
  },
];

export const USAGE_OPERATIONS: OperationGroup[] = [
  {
    title: "Browse and query",
    items: [
      "Browse all databases and collections",
      "Create and drop databases",
      "Create and drop collections",
      "View collection stats",
      "Query with MongoDB filter syntax",
      "Sort and paginate results",
      "View as list, JSON or table",
    ],
  },
  {
    title: "Documents",
    items: ["Add new documents", "Edit documents inline", "Delete documents safely"],
  },
  {
    title: "Indexes",
    items: [
      "Create and drop indexes",
      "Hide and unhide indexes",
      "View index usage statistics",
    ],
  },
  {
    title: "Schema",
    items: [
      "Analyze collection schema from samples",
      "View field types, frequency and value distributions",
      "Inspect nested fields and array structures",
    ],
  },
  {
    title: "Aggregation",
    items: [
      "Build pipelines with stage templates",
      "Reorder, enable and disable stages",
      "Preview results for individual stages",
      "Save and reload pipelines per collection",
      "Export pipeline JSON and backend-ready code",
      "Create views from pipelines",
    ],
  },
  {
    title: "Shell",
    items: [
      "Run ad-hoc shell commands in the browser",
      "Execute JavaScript queries with autocomplete",
      "Navigate command history and persist sessions",
      "Run CRUD, aggregation and admin commands",
      "Access bulk operations and system collections",
      "Switch databases with use and check server status",
    ],
  },
  {
    title: "Connections",
    items: [
      "Save and manage multiple connection profiles",
      "Test connections before saving",
      "Color-code and label connections",
      "Switch deployments from the top bar",
      "Masked connection strings",
      "Read-only system databases",
    ],
  },
  {
    title: "Import and export",
    items: [
      "Export collections to JSON or CSV with a filter and limit",
      "Choose Default, Relaxed or Canonical Extended JSON",
      "Keep BSON types like ObjectId, Long, Decimal128 and Date in exports",
      "Import documents from JSON arrays or CSV files",
    ],
  },
];

/**
 * Desktop installers are attached to the GitHub release of each version (the
 * v<version> release that release-please creates), so each file is at
 * <DESKTOP_RELEASES_URL>/download/<tag>/<file>.
 * apps/desktop/scripts/release.ts writes the version, tag and file names to
 * desktop-release.json. See docs/DESKTOP.md.
 */
export const DESKTOP_RELEASES_URL = "https://github.com/abdullahmia/compooss/releases";
export const DESKTOP_CHECKSUMS_FILE = "SHA256SUMS.txt";

export const DESKTOP_PLATFORMS: DesktopPlatform[] = [
  {
    os: "macos",
    name: "macOS",
    requirement: "macOS 13.5 or later",
    downloads: [
      { label: "Apple Silicon", id: "macos-arm64" },
      { label: "Intel", id: "macos-x64" },
    ],
    steps: [
      { text: "Open the downloaded .dmg and drag Compooss into Applications." },
      {
        text: "Open Compooss. The app isn't notarized yet, so the first time macOS may block it: go to System Settings → Privacy & Security and click Open Anyway.",
      },
      {
        text: "Or allow it from Terminal:",
        command: "xattr -dr com.apple.quarantine /Applications/Compooss.app",
      },
    ],
  },
  {
    os: "windows",
    name: "Windows",
    requirement: "Windows 10 or 11, 64-bit",
    downloads: [{ label: "Installer (.exe)", id: "windows-x64" }],
    steps: [
      { text: "Run the downloaded installer." },
      {
        text: "The installer isn't code-signed yet. If SmartScreen says it protected your PC, click More info → Run anyway.",
      },
      { text: "Open Compooss from the Start menu." },
    ],
  },
  {
    os: "linux",
    name: "Linux",
    requirement: "Ubuntu 22.04+, Debian 12+ and derivatives · x86_64",
    downloads: [{ label: "Debian / Ubuntu (.deb)", id: "linux-amd64" }],
    steps: [
      {
        text: "Install the downloaded package with apt:",
        command: "sudo apt install ./Compooss-{version}-linux-amd64.deb",
      },
      { text: "Open Compooss from your applications menu." },
      {
        text: "On Fedora, Arch and other distributions, run Compooss with Docker instead (see Installation above).",
      },
    ],
  },
];
