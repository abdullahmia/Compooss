import type { ComparisonRow, DesktopPlatform } from "@/lib/types/landing.type";
import {
  ArrowUpDown,
  Container,
  Database,
  Eye,
  FileJson,
  GitBranch,
  Grid3X3,
  Layers,
  LayoutGrid,
  Plug2,
  Search,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Why Compooss", href: "#why-compooss" },
  { label: "Installation", href: "#installation" },
  { label: "Download", href: "#download" },
  { label: "Usage", href: "#usage" },
  { label: "Roadmap", href: "#roadmap" },
];

export const FEATURES = [
  {
    icon: <Database size={20} />,
    title: "Database Management",
    description:
      "List, create, and drop MongoDB databases from a visual admin panel. Get real-time stats on document counts, storage size, and indexes at a glance.",
  },
  {
    icon: <Layers size={20} />,
    title: "Collection Explorer",
    description:
      "Navigate MongoDB collections with an expandable sidebar. Instantly view document count, storage size, index count, and average document size per collection.",
  },
  {
    icon: <Search size={20} />,
    title: "Query & Filter Documents",
    description:
      "Run MongoDB queries with native filter syntax. Sort, paginate, and explore documents without switching to the terminal or writing scripts.",
  },
  {
    icon: <Eye size={20} />,
    title: "Multiple View Modes",
    description:
      "Switch between list, JSON, and table views to inspect your MongoDB data. Choose the best format for your data exploration and debugging workflow.",
  },
  {
    icon: <FileJson size={20} />,
    title: "Full Document CRUD",
    description:
      "Create, read, update, and delete MongoDB documents with an intuitive Monaco-powered editor. Supports JSON validation and syntax highlighting.",
  },
  {
    icon: <Grid3X3 size={20} />,
    title: "Index Management",
    description:
      "Create, drop, hide, and inspect indexes with full support for unique, compound, text, geospatial, TTL, partial, and hashed indexes. View usage statistics at a glance.",
  },
  {
    icon: <LayoutGrid size={20} />,
    title: "Schema Analysis",
    description:
      "Analyze collection schema from sampled documents: view detected fields, type distribution, frequency, value distributions, nested and array structures, and missing or inconsistent fields. Refresh on demand.",
  },
  {
    icon: <Layers size={20} />,
    title: "Aggregation Pipelines",
    description:
      "Build MongoDB aggregation pipelines visually with stage templates, drag-and-drop stages, per-stage previews, text mode editing, saved pipelines, and view creation from pipelines.",
  },
  {
    icon: <Terminal size={20} />,
    title: "MongoDB Shell",
    description:
      "Run ad-hoc MongoDB commands from an embedded shell panel. Execute CRUD operations, aggregation pipelines, admin commands, and JavaScript scripts with autocomplete, syntax highlighting, and session persistence.",
  },
  {
    icon: <Plug2 size={20} />,
    title: "Multiple Connections",
    description:
      "Save, edit, and switch between MongoDB connection profiles from a dedicated connection page. Supports authentication (SCRAM, X.509, LDAP, Kerberos), TLS/SSL, color-coded profiles, favorites, and test-before-connect.",
  },
  {
    icon: <Shield size={20} />,
    title: "Built-In Safety Guards",
    description:
      "System databases (admin, local, config) are automatically read-only. Prevent accidental destructive operations on critical MongoDB data.",
  },
  {
    icon: <Container size={20} />,
    title: "Docker Native Deployment",
    description:
      "Ships as a lightweight Docker image you can add to any docker-compose.yml. One service definition, no external dependencies, instant setup.",
  },
  {
    icon: <Zap size={20} />,
    title: "Instant Startup",
    description:
      "Built on Next.js with standalone output for a minimal container footprint. Starts in seconds with zero configuration required.",
  },
  {
    icon: <LayoutGrid size={20} />,
    title: "Modern Developer UI",
    description:
      "Clean interface with dark, light, and system-aware themes built with Tailwind CSS and shadcn/ui. Designed to feel native to modern development workflows.",
  },
  {
    icon: <ArrowUpDown size={20} />,
    title: "Data Export & Import",
    description:
      "Export any collection to JSON or CSV. JSON exports support three Extended JSON modes — Default, Relaxed, and Canonical — preserving BSON types like ObjectId, Long, and Decimal128. Import from JSON or CSV with drag-and-drop, live preview, and per-row error reporting.",
  },
  {
    icon: <GitBranch size={20} />,
    title: "ER Diagram Generation",
    description:
      "Automatically visualize collection relationships as an interactive ER diagram. Detects foreign-key references from ObjectId fields and field names with configurable sample sizes. Powered by ReactFlow and Dagre for auto-layout.",
  },
];

export const CORE_FEATURES = [
  FEATURES[0],  // Database Management
  FEATURES[1],  // Collection Explorer
  FEATURES[4],  // Full Document CRUD
  FEATURES[14], // Data Export & Import
  FEATURES[15], // ER Diagram Generation
  FEATURES[9],  // Multiple Connections
];

export const COMPARISON_TOOLS = [
  { name: "Compooss", highlight: true },
  { name: "MongoDB Compass", highlight: false },
  { name: "Mongo Express", highlight: false },
  { name: "Studio 3T", highlight: false },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Docker-native deployment", compooss: "yes", compass: "no", mongoExpress: "partial", studio3t: "no" },
  { feature: "Zero configuration", compooss: "yes", compass: "no", mongoExpress: "partial", studio3t: "no" },
  { feature: "Web-based (no install)", compooss: "yes", compass: "no", mongoExpress: "yes", studio3t: "no" },
  { feature: "Desktop app (macOS, Windows, Linux)", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Dark, light & system themes", compooss: "yes", compass: "partial", mongoExpress: "no", studio3t: "partial" },
  { feature: "Document CRUD", compooss: "yes", compass: "yes", mongoExpress: "yes", studio3t: "yes" },
  { feature: "Index management", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Schema analysis", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Aggregation pipeline builder", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "yes" },
  { feature: "Built-in MongoDB shell", compooss: "yes", compass: "yes", mongoExpress: "no", studio3t: "partial" },
  { feature: "Query with MongoDB syntax", compooss: "yes", compass: "yes", mongoExpress: "partial", studio3t: "yes" },
  { feature: "Free & open-source", compooss: "yes", compass: "partial", mongoExpress: "yes", studio3t: "no" },
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

export const USAGE_STEPS = [
  {
    step: "01",
    title: "Add to your Docker Compose file",
    description:
      "Drop the Compooss service into your existing docker-compose.yml alongside your MongoDB container. One service definition is all you need.",
  },
  {
    step: "02",
    title: "Connect from the UI",
    description:
      "Open the /connect page in Compooss, enter your MongoDB connection string, and save a connection profile. You can test the connection before using it.",
  },
  {
    step: "03",
    title: "Open and start exploring",
    description:
      "Navigate to localhost:6969 in your browser. Instantly browse databases, run queries, edit documents, and manage your MongoDB data through a visual interface.",
  },
];

/**
 * Desktop installers, served from public/downloads. apps/desktop/scripts/release.ts
 * puts each build there under these names; a file that isn't there yet shows
 * as "Coming soon".
 */
export const DESKTOP_DOWNLOADS_PATH = "/downloads";
export const DESKTOP_CHECKSUMS_FILE = "SHA256SUMS.txt";

export const desktopDownloadUrl = (file: string) => `${DESKTOP_DOWNLOADS_PATH}/${file}`;

export const DESKTOP_PLATFORMS: DesktopPlatform[] = [
  {
    os: "macos",
    name: "macOS",
    requirement: "macOS 13.5 or later",
    downloads: [
      { label: "Apple Silicon", file: "Compooss-macos-arm64.dmg" },
      { label: "Intel", file: "Compooss-macos-x64.dmg" },
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
    downloads: [{ label: "Installer (.exe)", file: "Compooss-windows-x64-setup.exe" }],
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
    requirement: "x86_64 · Ubuntu 22.04+, Debian 12+ or similar",
    downloads: [
      { label: "AppImage", file: "Compooss-linux-x86_64.AppImage" },
      { label: "Debian / Ubuntu (.deb)", file: "Compooss-linux-amd64.deb" },
    ],
    steps: [
      {
        text: "AppImage: make it executable, then open it. Needs libfuse2.",
        command: "chmod +x Compooss-linux-x86_64.AppImage",
      },
      {
        text: "Debian or Ubuntu: install the .deb instead to get a menu entry.",
        command: "sudo apt install ./Compooss-linux-amd64.deb",
      },
    ],
  },
];
