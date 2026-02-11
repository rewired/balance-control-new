# Codex Task â€” BALANCE // CONTROL (Software Edition)

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
- Tests + golden replays + hashing: AGENTS §5.1â€“§5.3

**Repo:** This task assumes the current codebase is the one where Task 0006 is completed.

---

# Task 0012 â€” Expansion State Namespacing (G.exp Slices)

## Goal
Introduce a canonical namespacing for expansion state so that:
- Core state remains clean.
- Expansions attach their own zones/data only when enabled.
- Disabled expansions leave **zero footprint** (AGENTS §5.5).

## Inputs
- `AGENTS.md` §3.4, §3.8, §5.5
- Existing canonical state model from tasks up to 0006 (zones/objects).

## Outputs
### Code
- `@bc/rules`:
  - Define:
    - `ExpansionId`
    - `ExpansionStateSlice` (generic) and per-expansion placeholders:
      - `Exp01State`, `Exp02State`, `Exp03State` (initially minimal)
  - Add to `GameState`:
    - `exp?: Partial<Record<ExpansionId, unknown>>` or a typed map,
      but must ensure **absence** when none enabled (prefer `exp` omitted entirely).

- `@bc/game`:
  - Setup:
    - If at least one expansion enabled â†’ create `G.exp` object.
    - Create `G.exp[expId]` **only** for enabled expansions.

### Tests
- CORE-only:
  - `G` has no `exp` field at all (preferred) or `exp` is empty object, but then must be justified and tests updated. (AGENTS §5.5 prefers absence.)
- CORE + exp01:
  - `G.exp.exp01` exists; `G.exp.exp02/exp03` do not.

### Docs
- `/docs/changelog.md` entry: expansion state namespacing.

## Constraints
- Do not implement any expansion mechanics.
- Do not create any empty â€œmeasure zonesâ€ yet; those come with expansion modules.

## Invariants
- State JSON must stay stable and deterministic (field ordering handled later by hashing task; but avoid non-deterministic insertion here).

## Acceptance Criteria
- Tests explicitly assert absence/presence rules.
- No â€œghostâ€ expansion zones or arrays.


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
- [x] Rule / contract references added where required (AGENTS §3.4, §3.8, §5.5)
- [x] Expansion isolation preserved (no ghost zones/resources when disabled)
- [x] Changelog updated (`/docs/changelog.md`)
- [x] Ambiguity review complete; created /docs/design-decisions/DD-XXXX-<topic>.md only if needed (none needed here)

