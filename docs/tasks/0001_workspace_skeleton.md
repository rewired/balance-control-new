# Task 0001 — Workspace Skeleton & Tooling (pnpm + TS + React + boardgame.io)

## Goal
Create the monorepo workspace scaffold and baseline tooling so subsequent tasks can implement game logic safely and consistently.

## Inputs
- `/docs/rules/000-core.md` (CORE-01 v1.0.14)
- `/docs/rules/notation.md` (informative)
- Requirements:
  - boardgame.io engine
  - React client
  - SQLite persistence (later tasks)
  - Hex topology (later tasks)

## Outputs
- A pnpm workspace with packages:
  - `@bc/rules`
  - `@bc/game`
  - `@bc/server`
  - `@bc/client-web`
  - `@bc/bot-llm`
  - `@bc/shared`
- Tooling:
  - TypeScript `strict` enabled
  - ESLint + Prettier
  - Vitest
  - Basic CI scripts in `package.json` (lint/test/build)
- Minimal README with dev commands
- `.nvmrc` (or equivalent) and `engines` in root `package.json`
- .gitignore (propper settings for this project)

## Constraints
- Use maintained npm solutions; no custom build systems.
- No generated temp files committed.
- Keep configs consistent across packages (shared tsconfig base).

## Invariants
- `pnpm -r build` succeeds on a clean clone.
- `pnpm -r test` runs without requiring a running server.

## Acceptance Criteria
- `pnpm install` works.
- `pnpm lint` passes.
- `pnpm test` passes (with at least one placeholder test).
- `pnpm dev` can start the client (even if it only renders a placeholder page).

## Implementation Notes
- Use Vite for React client.
- Prefer `tsconfig` project references for speed and correctness.
- Configure path aliases through TS + Vite consistently.

## PR Checklist
- [ ] Workspace structure matches AGENTS.md
- [ ] Lint/test/build scripts present and documented
- [ ] No unused dependencies
- [ ] No temp artifacts committed
