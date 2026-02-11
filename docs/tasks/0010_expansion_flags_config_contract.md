# Codex Task â€” BALANCE // CONTROL (Software Edition)

**Date:** 2026-02-11  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)  
- Determinism: AGENTS Â§0.2  
- Rules anchoring & no drift: AGENTS Â§0.1, Â§0.5, Â§0.6  
- Resource generalization: AGENTS Â§1.6  
- Expansions modular + isolation: AGENTS Â§3.4, Â§3.8, Â§5.4, Â§5.5  
- Canonical effect resolver: AGENTS Â§3.5  
- Production order: AGENTS Â§3.6  
- Start Committee immunity: AGENTS Â§3.7  
- Tests + golden replays + hashing: AGENTS Â§5.1â€“Â§5.3

**Repo:** This task assumes the current codebase is the one where Task 0006 is completed.

---

# Task 0010 â€” Expansion Flags & Match Config Contract

## Goal
Introduce a **single canonical match config contract** that can enable/disable expansions, and ensure the state contains **no expansion artifacts** when expansions are disabled.

This is prerequisite plumbing for modular expansions and for later resolver + move injection.

## Inputs
- `AGENTS.md`:
  - Â§1.6 Resource Model Generalization
  - Â§3.4 Expansions are Modular
  - Â§3.8 Expansion Isolation Layer
  - Â§5.4 Cross-Expansion Stack Tests
  - Â§5.5 No Dead State Policy
- Current codebase after Task 0006.

## Outputs
### Code
- In `@bc/rules` (or wherever config types live):
  - `ExpansionId` type: `"exp01" | "exp02" | "exp03"` (future-proof but explicit)
  - `MatchConfig` / `GameConfig` schema that includes:
    - `expansions: { exp01?: boolean; exp02?: boolean; exp03?: boolean }`
    - default: all `false` unless explicitly enabled
  - Zod schema for runtime validation (AGENTS Â§4.2 requires strict JSON + zod patterns, reuse philosophy).

- In `@bc/game`:
  - Ensure the boardgame.io `setup` reads config and passes it into state builder(s).
  - No expansion state slices are created unless enabled.

### Docs
- Add a short entry to `/docs/changelog.md` describing the new match config contract and its default behavior.

## Constraints
- **Do not change any normative rules**.
- No expansion mechanics implemented in this task (only flags + validation + plumbing).
- No â€œempty placeholder arraysâ€ for expansions when disabled (AGENTS Â§5.5).

## Invariants
- A match created with no expansion flags must behave as **pure CORE**.
- Serialization of state must not contain any `exp.*` data when all expansions are disabled.

## Acceptance Criteria
- `MatchConfig` validates:
  - missing `expansions` â†’ treated as all false
  - unknown keys â†’ rejected by zod (strict)
- Unit tests demonstrate:
  - CORE-only match has **no expansion zones** and **no expansion resources**
  - enabling `exp01` creates its state slice placeholder **only when enabled** (actual zones can be added in later tasks)


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
- [x] Rule / contract references added where required (AGENTS §3.4, §3.8, §5.5 comments near state slice application)
- [x] Expansion isolation preserved (no ghost zones/resources when disabled)
- [x] Changelog updated (`/docs/changelog.md`)
- [x] If architectural decision was needed: created `/docs/design-decisions/DD-XXXX-<topic>.md` (n/a)

