# Development Guide

This document covers how to set up and work on Compooss locally.

---

## Prerequisites

- [Bun](https://bun.sh) 1.x
- [Docker](https://www.docker.com) — for running a local MongoDB instance
- [Node.js](https://nodejs.org) 20+ — only required inside Docker builds (not for local dev)

---

## Local Setup

```bash
# Clone the repo
git clone https://github.com/abdullahmia/compooss.git
cd compooss

# Install all workspace dependencies
bun install

# Start a local MongoDB (detached)
docker compose -f docker/docker-compose.dev.yml up -d

# Start all apps in dev mode
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser, then connect to:

```
mongodb://root:example@localhost:27017/?authSource=admin
```

---

## Monorepo Structure

```
compooss/
├── apps/
│   ├── compooss/                  # Main MongoDB GUI — Next.js 15 App Router
│   │   └── src/
│   │       ├── app/               # Next.js routes (thin shell pages only)
│   │       └── lib/
│   │           ├── components/    # UI components, grouped by feature
│   │           ├── config/        # ApiClient singleton
│   │           ├── constants/     # ENDPOINTS, ROUTE_PATHS
│   │           ├── core-modules/  # Base repository + shell evaluator
│   │           ├── driver/        # MongoDriver + ConnectionManager
│   │           ├── hooks/         # Zustand ↔ URL/session bridge hooks
│   │           ├── providers/     # React context providers
│   │           ├── schemas/       # Zod schemas + inferred form types
│   │           ├── services/      # TanStack Query hooks
│   │           ├── storage/       # IndexedDB (browser-side connection store)
│   │           ├── stores/        # Zustand stores
│   │           └── types/         # TypeScript entity + response types
│   └── docs/                      # Landing page / documentation site
├── packages/
│   ├── types/                     # Shared types — @compooss/types
│   └── ui/                        # Shared UI components — @compooss/ui
├── docker/
│   ├── docker-compose.dev.yml     # Local dev: MongoDB only
│   └── docker-compose.yml         # Production: MongoDB + app
├── docs/                          # Project documentation
├── Dockerfile                     # Multi-stage production build
└── turbo.json                     # Turborepo pipeline config
```

---

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start all apps in dev mode (Turbo TUI) |
| `bun build` | Build all packages and apps in dependency order |
| `bun lint` | Run ESLint across the entire monorepo |
| `bun type-check` | Run TypeScript type checking |
| `bun run db:seed` | Seed local MongoDB with dummy development data |

---

## Seeding Development Data

The seed script populates your local MongoDB instance with realistic dummy data across three databases so you can explore the app without a real dataset.

**Requirements:** the local MongoDB container must be running first (see Local Setup above).

```bash
bun run db:seed
```

This drops and recreates the following databases on every run:

| Database | Collections | Contents |
|---|---|---|
| `ecommerce_dev` | users, products, orders, reviews | 50 users · 80 products · ~150 orders · ~100 reviews |
| `blog_dev` | authors, posts, comments | 10 authors · 60 posts · ~300 comments |
| `analytics_dev` | sessions, events, daily_metrics | 200 sessions · ~800 events · 90 days of metrics |

The script uses the `MONGODB_URI` environment variable if set, otherwise it defaults to the dev container URI:

```
mongodb://root:example@localhost:27017/?authSource=admin
```

The seed is **idempotent** — running it multiple times always produces a clean, consistent dataset.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Validation | Zod |
| UI components | shadcn/ui |
| HTTP client | Custom `ApiClient` wrapping native `fetch` |
| MongoDB driver | `mongodb` (Node.js driver) |
| Browser storage | `idb` (IndexedDB wrapper) |
| Monorepo | Turborepo + Bun workspaces |
| Commits | Husky + Commitlint (Conventional Commits) |

---

## Architecture Notes

- **No env vars needed for development.** The MongoDB URI is entered by the user in the UI and stored in IndexedDB — nothing is hardcoded or read from the environment.
- **API routes are Next.js routes.** The `ApiClient` uses relative `/api` paths, so the frontend and API always run on the same origin.
- **`lib/driver/`** manages live MongoDB connections (Node.js `MongoClient`). **`lib/storage/`** manages saved connection configs (browser IndexedDB). These are intentionally separate.
- **Turborepo** ensures `@compooss/types` and `@compooss/ui` are always built before the apps that depend on them.

---

## Docker

### Dev (MongoDB only)

```bash
docker compose -f docker/docker-compose.dev.yml up -d
docker compose -f docker/docker-compose.dev.yml down
```

### Production (full stack)

```bash
MONGO_ROOT_USERNAME=admin MONGO_ROOT_PASSWORD=secret \
  docker compose -f docker/docker-compose.yml up -d
```

### Build the Docker image manually

```bash
bun run docker:build
```

---

## Commit Conventions

This project enforces [Conventional Commits](https://www.conventionalcommits.org) via Commitlint on every commit.

| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code change with no feature or bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no logic change |
| `chore:` | Maintenance, tooling, deps |
| `test:` | Adding or updating tests |

Example: `feat: add collection rename dialog`

---

## Pull Request Process

1. Branch from `development` — not `main`
2. Keep PRs focused — one feature or fix per PR
3. Run `bun lint` and `bun type-check` before submitting
4. Fill out the PR template
5. Maintainers will review and merge

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guidelines.

---

## Troubleshooting

**`bun dev` fails with a port conflict**

Port 3000 is already in use. Stop the other process or change the port:

```bash
PORT=3001 bun dev
```

**MongoDB connection refused on startup**

Make sure the dev MongoDB container is running:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
# verify
docker ps
```

Then connect to `mongodb://root:example@localhost:27017/?authSource=admin`.

**`bun install` fails or packages are missing after pulling**

Delete the lockfile-generated node_modules and reinstall:

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
bun install
```

**TypeScript errors after changing a shared package**

The shared packages (`@compooss/types`, `@compooss/ui`) must be built before the app can see the types:

```bash
bun build
```

Then restart the dev server.
