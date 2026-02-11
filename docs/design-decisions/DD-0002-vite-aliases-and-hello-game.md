# DD-0002-vite-aliases-and-non-normative-hello-game

Decision date: 2026-02-11
Status: Accepted

Context:
- Task 0002 requires a minimal boardgame.io game to validate wiring (hotseat + network) with no CORE rules yet.
- `vite-tsconfig-paths` plugin caused runtime errors in this environment; Vitest/Vite also attempted to parse package.json with BOMs which broke runs.

Decision:
- Use explicit Vite `resolve.alias` entries in `packages/client-web/vite.config.ts` for `@bc/game` and `@bc/shared` to ensure deterministic, build-free source linking during dev/tests.
- Implement a non-normative `CounterGame` with a single `increment` move solely for connectivity verification.

Rationale:
- Keeps workspace deterministic and avoids reliance on non-essential plugins.
- Satisfies AGENTS.md 0.2 Determinism and 0.3 Use NPM Solutions while keeping custom code minimal.
- Non-normative move is documented here to avoid rule drift (AGENTS.md 0.6).

Consequences:
- Once CORE rules are implemented (Task 0003+), aliases may be revisited or replaced with project references-only.
- Server test avoids importing `src/index.ts` to prevent cross-package build dependency during tests.
