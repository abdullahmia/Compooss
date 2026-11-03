# Compooss

> A lightweight, self-hosted MongoDB GUI that drops into any Docker stack — no desktop app, no cloud signup, no fuss.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.7.0-green.svg)](docs/CHANGELOG.md)
[![Docker Hub](https://img.shields.io/docker/pulls/abdullahmia/compooss)](https://hub.docker.com/r/abdullahmia/compooss)
[![GitHub Issues](https://img.shields.io/github/issues/abdullahmia/compooss)](https://github.com/abdullahmia/compooss/issues)
[![GitHub Stars](https://img.shields.io/github/stars/abdullahmia/compooss)](https://github.com/abdullahmia/compooss/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

![Compooss Preview](docs/preview.jpeg)

---

## Table of Contents

- [What is Compooss?](#what-is-compooss)
- [Features](#features)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Monorepo Structure](#monorepo-structure)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## What is Compooss?

Compooss is a MongoDB GUI built for **local and team development**. It runs as a Docker container and sits next to your MongoDB service in a `docker-compose` stack. Open your browser, connect to any MongoDB instance, and explore — no installation, no account required.

---

## Features

| | |
|---|---|
| **Database & Collection Explorer** | Browse databases and collections from a sidebar with live stats |
| **Document CRUD** | Query, filter, sort, paginate, and edit documents with a Monaco JSON editor |
| **Index Management** | Create, drop, hide/unhide indexes — all major index types supported |
| **Schema Analysis** | Sample documents to infer schema, field types, frequency, and distributions |
| **Aggregation Pipelines** | Visual pipeline builder with stage templates, previews, and saved pipelines |
| **Embedded Shell** | Browser-based MongoDB shell with autocomplete, history, and syntax highlighting |
| **Multiple Connections** | Save, color-code, and switch between connection profiles stored in IndexedDB |

See [`docs/FEATURES.md`](docs/FEATURES.md) for the complete feature breakdown by version.

---

## Quick Start

### Docker Compose (recommended)

Add Compooss next to your MongoDB service:

```yaml
services:
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"

  compooss:
    image: abdullahmia/compooss:latest
    ports:
      - "8080:3000"
    depends_on:
      - mongo
```

Then open **http://localhost:8080** and connect to `mongodb://mongo:27017`.

### Docker Run

```bash
docker run -p 8080:3000 abdullahmia/compooss:latest
```

Open **http://localhost:8080** and connect to your MongoDB instance. A `localhost` connection string is automatically redirected to your Docker host, so `mongodb://localhost:27017` works from inside the container too.

### Require a login

By default anyone who can reach the port can use Compooss. If it's reachable by other people, set a username and password; every page and API call then requires signing in:

```bash
docker run -p 8080:3000 \
  -e COMPOOSS_USERNAME=admin \
  -e COMPOOSS_PASSWORD='choose-a-strong-password' \
  abdullahmia/compooss:latest
```

Each browser gets its own MongoDB connection, so teammates sharing one instance don't switch or disconnect each other. Mark a saved connection **Read-only** to block every write (inserts, edits, deletes, drops, imports, and shell writes) when pointing at staging or production.

### Production (self-hosted)

Use the production compose file included in this repo:

```bash
MONGO_ROOT_USERNAME=admin MONGO_ROOT_PASSWORD=secret \
  docker compose -f docker/docker-compose.yml up -d
```

---

## Development Setup

This repository is a **Turborepo monorepo** managed with [Bun](https://bun.sh).

### Prerequisites

- [Bun](https://bun.sh) 1.x
- [Docker](https://www.docker.com) (for running a local MongoDB)
- [Node.js](https://nodejs.org) 20+ (only needed for the standalone server in Docker)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/abdullahmia/compooss.git
cd compooss

# 2. Install dependencies
bun install

# 3. Start a local MongoDB
docker compose -f docker/docker-compose.dev.yml up -d

# 4. Start the app
bun dev
```

Open **http://localhost:3000**, then connect to `mongodb://root:example@localhost:27017/?authSource=admin`.

### Scripts

| Command | Description |
|---|---|
| `bun dev` | Start all apps in dev mode (Turbo TUI) |
| `bun build` | Build all packages and apps |
| `bun lint` | Run ESLint across the monorepo |
| `bun type-check` | Run TypeScript type checking |

See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for a deeper guide on the codebase and architecture.

---

## Monorepo Structure

```
compooss/
├── apps/
│   ├── compooss/        # Main MongoDB GUI (Next.js 15)
│   └── docs/            # Landing page / documentation site
├── packages/
│   ├── types/           # Shared TypeScript types (@compooss/types)
│   └── ui/              # Shared UI components (@compooss/ui)
├── docker/
│   ├── docker-compose.dev.yml   # Local dev — MongoDB only
│   └── docker-compose.yml       # Production — MongoDB + app
├── docs/                # Project documentation
└── Dockerfile           # Multi-stage build for the compooss app
```

---

## Contributing

Contributions of all sizes are welcome — bug reports, feature ideas, docs improvements, and code fixes.

**New to the project?** Look for issues tagged [`good first issue`](https://github.com/abdullahmia/compooss/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — these are small, well-scoped tasks with clear instructions.

Quick checklist before opening a PR:
- Branch from `development`, not `main`
- Follow [Conventional Commits](https://www.conventionalcommits.org) — enforced by Commitlint
- Run `bun lint` and `bun type-check` before submitting

Read [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for the full guide and [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for local setup.

---

## Roadmap

- Theming — system, dark, and light mode
- Optional auth for shared dev environments
- Richer query builder and UX improvements

See [`docs/FEATURES.md`](docs/FEATURES.md) and [`docs/CHANGELOG.md`](docs/CHANGELOG.md) for the full history and planned work.

---

## License

[MIT](LICENSE) © [Abdullah Mia](https://abdullah.iam.bd/)
