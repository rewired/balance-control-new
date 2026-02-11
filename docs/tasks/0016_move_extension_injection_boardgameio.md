# Codex Task — BALANCE // CONTROL (Software Edition)

**Date:** 2026-02-11  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)  
- Determinism: AGENTS §0.2  
- Rules anchoring & no drift: AGENTS §0.1, §0.5, §0.6  
- Resource generalization: AGENTS §1.6  
- Expansions modular + isolation: AGENTS §3.4, §3.8, §5.4, §5.5  
- Canonical effect resolver: AGENTS §3.5  
- Production order: AGENTS §3.6  
- Start Committee immunity: AGENTS §3.7  
- Tests + golden replays + hashing: AGENTS §5.1–§5.3

**Repo:** This task assumes the current codebase is the one where Task 0006 is completed.

---

# Task 0016 — Move Extension Injection (boardgame.io)

## Goal
Make moves extensible by expansion modules, while keeping:
- a canonical move list
- strict validation (zod) for bot outputs (AGENTS §4.2)
- deterministic legal move enumeration (AGENTS §4.1)

This prepares expansion-provided moves (e.g., measures) without contaminating core.

## Inputs
- `AGENTS.md`:
  - §3.8 Expansion Isolation Layer (moveExtensions)
  - §4.1 Illegal Move Prevention (enumerate legal moves deterministically)
  - §4.2 Strict JSON Schema (zod)
- boardgame.io game definition in `@bc/game`

## Outputs
### Code
- `@bc/rules`:
  - A typed move catalog:
    - `MoveType` union generated from registered moves (core + expansion)
    - `MovePayloadSchemas` map: `MoveType -> zod schema`
  - Helper:
    - `buildMoveCatalog(coreMoves, enabledModules)` that merges:
      - move definitions
      - payload schemas
      - legal move enumerators (if you already have a legal move system)

- `@bc/game`:
  - Game `moves` are created from the move catalog.
  - When an expansion is disabled:
    - its moves do not exist
    - legal move enumeration does not include them

### Tests
- Core-only: catalog contains only core moves.
- Core + exp01: catalog includes exp01 move(s) from a stub module.
- Bot-schema test: validating an illegal payload fails deterministically.

### Docs
- `/docs/changelog.md` entry: move extension system.
- If any tricky architectural choice needed: add `/docs/design-decisions/DD-XXXX-move-catalog.md`.

## Constraints
- No real expansion moves required yet; stub module is enough.
- No breaking API for existing core moves unless necessary; if necessary, document clearly.

## Invariants
- Legal move listing order must be stable across runs for the same state (AGENTS §4.1).
- Zod schemas must be strict (no passthrough).

## Acceptance Criteria
- Moves are modular and gated by expansion flags.
- Tests cover absence/presence and schema strictness.
- Lint/test pass.


---

## Commit Requirements

Create **one clean commit** for this task.

- Commit message format: `task(001X): <short summary>`
- No WIP commits.
- No unrelated formatting churn.
- Include updated docs/tests in the same commit.

After completing the task, **fill in the PR Checklist** below by changing `[ ]` to `[x]`.

---

## PR Checklist (Fill after implementation)

- [x] `pnpm lint` passes
- [x] `pnpm test` passes
- [x] Determinism verified (no `Date.now`, no `Math.random`, no non-seeded sources)
- [x] No temporary files committed
- [x] Rule / contract references added where required
- [x] Expansion isolation preserved (no ghost zones/resources when disabled)
- [x] Changelog updated (`/docs/changelog.md`)
- [x] If architectural decision was needed: created `/docs/design-decisions/DD-XXXX-<topic>.md`


