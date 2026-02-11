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

---

## Completion Protocol (MANDATORY)

When the implementation is finished, you MUST do all of the following before declaring the task complete:

1. Run:
   - pnpm lint
   - pnpm test
2. Update documentation:
   - /docs/changelog.md (required)
   - /docs/design-decisions/DD-XXXX-<topic>.md (if any architectural decision was made)
   - /docs/rules/ERRATA-XXXX.md (only if a rules ambiguity/defect was discovered; never for “convenience”)
3. Ensure repo hygiene:
   - No temporary files added
   - No dead state introduced when expansions are disabled
4. Fill the checklist below **in THIS FILE** with concrete results:
   - Use checked boxes [x]
   - Add short evidence notes (e.g., command output summary, file paths changed)
   - Do not leave placeholders

### Final Checklist (fill after completion)

- [x] pnpm lint passed (paste short summary): All 6 packages lint: Done (no errors)
- [x] pnpm test passed (paste short summary): shared: 1/1 passed; client-web: 1/1 passed; rules: 1/1 passed; game: 1/1 passed; bot-llm: 1/1 passed; server: 1/1 passed
- [x] Determinism verified (golden replay hash unchanged / added): n/a for skeleton (no game logic yet)
- [x] No temporary files added: none (verified .gitignore; build artifacts ignored)
- [x] Rule references added in code (examples of references): packages/rules/src/index.ts: // CORE-01-00
- [x] Changelog updated: docs/changelog.md — skeleton entry; pinned pnpm and BOM fix
- [x] Design decision doc added/updated: n/a
- [x] Errata added/updated: n/a
- [x] Expansion isolation verified (disabled expansions leave no state): n/a (no expansion code yet)
- [x] Bot contract checks (if touched): n/a
