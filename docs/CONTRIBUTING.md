# Contributing to Compooss

Thank you for your interest in contributing! This guide covers everything you need — from filing a bug to merging a pull request.

---

## Code of Conduct

By participating in this project you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## New contributor?

If this is your first open-source contribution, welcome! Here is a gentle starting path:

1. Read the [Development Guide](DEVELOPMENT.md) to get the project running locally.
2. Browse issues labelled [`good first issue`](https://github.com/abdullahmia/compooss/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — these are small, well-scoped tasks with clear acceptance criteria.
3. Leave a comment on the issue to let maintainers know you are working on it.
4. Follow the [Pull Requests](#pull-requests) steps below.

Not sure where to start? Open a [Discussion](https://github.com/abdullahmia/compooss/discussions) and ask — we are happy to help.

---

## Before You Start

- Search [existing issues](https://github.com/abdullahmia/compooss/issues) before opening a new one.
- For large changes, open an issue first to discuss the approach — this avoids wasted effort.
- Branch from `development`, not `main`.

---

## Reporting Bugs

Open an issue using the **Bug Report** template. Include:

- A clear, descriptive title
- Steps to reproduce
- Expected vs actual behaviour
- Your environment (OS, Bun version, Docker version, MongoDB version)
- Relevant logs or screenshots

---

## Suggesting Features

Open an issue using the **Feature Request** template. Describe:

- The problem or limitation it addresses
- Your proposed solution
- Any alternatives you considered

---

## Pull Requests

### 1. Fork & branch

```bash
git clone https://github.com/abdullahmia/compooss.git
cd compooss
git checkout development
git checkout -b feat/your-feature-name
# or: fix/your-bug-fix
```

### 2. Install dependencies

```bash
bun install
```

### 3. Make your changes

Follow the coding standards below. Keep PRs focused — one feature or fix per PR.

### 4. Check before submitting

```bash
bun lint
bun type-check
```

### 5. Commit

Follow [Conventional Commits](https://www.conventionalcommits.org) — Commitlint will reject non-conforming messages:

```
feat: add collection rename dialog
fix: correct index drop confirmation behaviour
docs: update development guide
```

### 6. Push and open a PR

- Fill out the pull request template
- Reference any related issues (`Closes #123`)
- Describe what changed and why

---

## Project Structure

```
apps/compooss/src/lib/
├── components/   # UI components, grouped by feature
├── config/       # ApiClient singleton
├── constants/    # ENDPOINTS and ROUTE_PATHS
├── core-modules/ # Base repository + shell evaluator
├── driver/       # MongoDriver + ConnectionManager
├── hooks/        # Zustand ↔ URL/session bridge hooks
├── providers/    # React context providers
├── schemas/      # Zod schemas + form types
├── services/     # TanStack Query hooks
├── storage/      # IndexedDB browser-side connection store
├── stores/       # Zustand stores
└── types/        # TypeScript entity + response types
```

See [`docs/DEVELOPMENT.md`](DEVELOPMENT.md) for the full architecture guide.

---

## Coding Standards

- **TypeScript** for all new code — no `any` without a comment explaining why.
- Follow the existing **ESLint** configuration (`bun lint` must pass).
- Use **functional components** and hooks — no class components.
- Keep components small and focused; one responsibility per file.
- Name files `kebab-case.component.tsx` and use named exports.
- Import from `@/` aliases — never relative paths like `../../`.

---

## Review process

- A maintainer will review your PR within a few days of submission.
- If changes are requested, address them in new commits — do not force-push once a review has started.
- Once approved, a maintainer will squash-merge the PR into `development` and it will be included in the next release.
- All checks (lint, type-check, CI workflows) must pass before a PR can be merged.

---

## Questions?

Open a [Discussion](https://github.com/abdullahmia/compooss/discussions) or drop a comment on a related issue.
