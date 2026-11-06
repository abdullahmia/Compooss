# AGENTS.md

Shared guidance for all AI coding agents (Claude Code, OpenAI Codex, Cursor, Copilot, Windsurf, etc.).

## What is Compooss?

A self-hosted, browser-based MongoDB GUI. Runs as a Docker container alongside MongoDB — no cloud account needed. MongoDB URIs are entered in the UI and stored in IndexedDB. The only environment variables are the optional `COMPOOSS_USERNAME` / `COMPOOSS_PASSWORD`, which turn on a login page (enforced in `src/proxy.ts`).

## Commands

```bash
# Development
bun dev              # Start all apps (Turborepo TUI)
bun build            # Build all packages and apps
bun lint             # ESLint across monorepo
bun type-check       # TypeScript strict check

# Database
bun run db:seed      # Seed local MongoDB with dummy data (ecommerce_dev, blog_dev, analytics_dev)
docker compose -f docker/docker-compose.dev.yml up -d  # Start dev MongoDB only

# UI development
bun storybook        # Storybook for @compooss/ui (port 6006)

# Desktop app (needs Rust; see docs/DESKTOP.md)
bun desktop:dev        # Desktop window on the Next.js dev server
bun desktop:build      # Installers for this machine (--target <triple> for others)
bun desktop:release    # Bump the desktop version, build all targets into apps/desktop/release/<version>/ (uploaded to R2)

# Docker
bun run docker:build   # Build Docker image locally
bun run docker:publish # Build and push multi-arch image
docker compose -f docker/docker-compose.yml up -d      # Full production stack
```

There is no test runner configured. Validation is done via `bun type-check` and `bun lint`.

Commits must follow [Conventional Commits](https://www.conventionalcommits.org) — enforced by Commitlint + Husky. Never skip hooks. Branch off `development`, not `main`.

## Monorepo Structure

```
apps/compooss/       # Main Next.js 16 app
apps/desktop/        # Tauri desktop app: bundles Node + the compooss standalone server
apps/docs/           # Landing / docs site
packages/types/      # @compooss/types — shared TypeScript types (no JS output)
packages/ui/         # @compooss/ui — shared shadcn/ui + Radix primitives
docker/              # docker-compose files (dev and production)
scripts/seed.ts      # Dev data seeder (Bun)
docs/                # DEVELOPMENT.md, FEATURES.md, CONTRIBUTING.md, SHELL.md, DESKTOP.md
```

Turborepo builds `@compooss/types` and `@compooss/ui` before `apps/compooss`. `apps/desktop` deliberately has no `build`/`dev`/`lint` scripts, so `bun build`, `bun dev` and the pre-commit hook never need Rust.

## Architecture

### Three-Tier Flow

```
Browser (Next.js client components)
  → React Context (ConnectionProvider, ShellProvider)
  → TanStack Query hooks  [lib/services/*/]
  → ApiClient (fetch wrapper)  [lib/config/api-client.ts]
  → Next.js API routes  [app/api/]
  → Repository classes  [lib/core-modules/*/]
  → MongoDriver  [lib/driver/]
  → MongoDB
```

### Server-Side: Repository Pattern

All MongoDB access goes through repository classes that extend `BaseRepository` (provides `driver` getter and `db(dbName)` helper). Specialized repositories live in `lib/core-modules/`:

- `DocumentRepository` — CRUD, filter, sort, export
- `CollectionRepository` — list, create, drop, rename, stats
- `IndexRepository` — list, create, drop
- `SchemaRepository` — samples documents to infer field types/frequency
- `AggregationRepository` — run and explain pipelines
- `ShellEvaluator` — executes user JS against MongoDB via Function constructor

Repositories are used server-side in API routes only — never imported on the client.

### Connection Management (Two Separate Systems)

- **`ConnectionManager`** (server-side singleton on `global`): holds one live MongoDB connection per browser, keyed by the `compooss_session` cookie (`lib/utils/session.util.ts`). Repositories resolve the caller's driver through `BaseRepository.getDriver()`; never assume a single global connection
- **`connectionDB`** (`lib/storage/`) (browser IndexedDB via `idb`): persists saved connection profiles
- **`ConnectionProvider`** bridges these — React context reads from IndexedDB; API calls use ConnectionManager

URI passwords are masked before being sent to the frontend.

### Client-Side State

- **TanStack Query v5** for server state — hooks in `lib/services/` (one file per domain: `database.service.ts`, `collection.service.ts`, etc.)
- **Zustand** for UI state (minimal usage)
- **URL search params / dynamic routes** for navigational state (bookmarkable)

### Key Conventions

**Query key factories** — never use magic strings; use `DATABASE_QUERY_KEYS`, `COLLECTION_QUERY_KEYS`, etc. from `lib/constants/`.

**Endpoint constants** — all API URLs defined in `lib/constants/endpoints.constants.ts`; supports parameterized routes like `ENDPOINTS.documents.byId(db, col, id)`.

**API response shape** — every route returns `ApiResponse<T>` from `@compooss/types`:
```typescript
{ status: number; message: string; data: TData }
```
Use `createApiResponse(data, message, status)` from `lib/utils/`.

**Protected databases** — `admin`, `config`, `local` are read-only; use `isProtectedDatabase(dbName)` in route handlers to return 403 on write attempts.

**Collection tabs** — open collections stay mounted as tabs (`WorkspaceShell` renders them; the collection route page renders nothing). Inside a collection view, get the db/collection from `useCollectionScope()`, never `useParams()` — route params always describe the *active* tab, so hidden tabs would read the wrong collection.

**Read-only connections** — a saved connection can be marked read-only. Every write route must also check `if (await isReadOnlySession()) return readOnlyResponse();`, and the shell only allows the read methods/commands listed in `shell.evaluator.ts`.

**Next.js params** — route params are Promises; always `await params` before destructuring:
```typescript
const { dbName, colName } = await params
```

**Filter query parsing** — the documents API accepts JSON in URL params (`?filter={email:"a"}`). `RelaxToJson` utility converts unquoted JS object literals to valid JSON; string filter values are auto-wrapped in `$regex` with case-insensitive flag and special chars are escaped.

**Zod schemas** — form validation schemas in `lib/schemas/`; types are inferred with `z.infer<typeof Schema>`. Never duplicate type definitions — derive them from schemas.

**Desktop app** — the desktop app runs the same standalone server with `COMPOOSS_DESKTOP_TOKEN` set, which makes `src/proxy.ts` lock it to the app's window (`lib/utils/desktop.util.ts`). For anything browser-vs-desktop, go through `lib/platform/platform.ts`: save files with `saveFile()`, never Blob + `<a download>` (desktop webviews ignore it). Don't load scripts, fonts or styles from CDNs; the desktop app must work offline (Monaco is served from `public/monaco`, copied by `scripts/copy-monaco.ts`). Never change the desktop port (29017) or bundle identifier: saved connections in IndexedDB are tied to them.

**Custom TanStack Query types** — use `TMutationOptions<TData, TVariables>` and `TQueryOptions<TData>` (which omit `mutationFn`/`queryFn`) when accepting options overrides.

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 16 (App Router, `output: "standalone"`) |
| Desktop | Tauri v2 + bundled Node.js 24 sidecar |
| Package manager | Bun 1.3.8 |
| Monorepo | Turborepo + Bun workspaces |
| UI primitives | shadcn/ui (Radix + Tailwind CSS 4.1) |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Validation | Zod 4 |
| Forms | react-hook-form |
| MongoDB | `mongodb` 7.1 (Node.js driver) |
| Browser storage | `idb` (IndexedDB wrapper) |
| Code editor | Monaco Editor |
| Visual pipeline | XYFlow / @xyflow/react |
| Theming | next-themes |
