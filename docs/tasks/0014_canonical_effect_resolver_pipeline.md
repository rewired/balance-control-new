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

# Task 0014 — Canonical Effect Resolver Pipeline (Core + Hooks)

## Goal
Implement the **single canonical effect resolver** described in AGENTS §3.5 and route state mutations through it.

This is the key “one choke point” that lets expansions add prohibitions/cost/output modifiers later without editing core moves everywhere.

## Inputs
- `AGENTS.md` §3.5 (Canonical Effect Resolver), §3.2 (ContextTile), §3.7 (Start Committee immunity)
- Current move implementations in `@bc/game`
- Core rules in `/docs/rules/000-core.md` regarding ContextTile and Start Committee immunity (refer to exact sections in code comments as per AGENTS §0.5)

## Outputs
### Code
- `@bc/rules`:
  - `EffectDescriptor` type (minimal: cost, contextTile, intent, payload)
  - `resolveEffect(effect, state, ctx, hooks)` function implementing AGENTS order:
    1. assign ContextTile (deterministically)
    2. evaluate prohibitions (exp hooks later; must support empty list now)
    3. apply cost increases (hooks later)
    4. apply output modifiers (hooks later)
    5. apply floors (where relevant)
    6. execute atomic state change
  - Explicit bypass rules when ContextTile is StartCommittee (AGENTS §3.7):
    - ignore prohibitions/cost/output modifiers
    - but do not bypass formalization timing restrictions (enforced by the move itself if needed)

- `@bc/game`:
  - Refactor existing moves to call `resolveEffect(...)` instead of direct mutation.
  - Minimal migration: only the moves already implemented up to Task 0006 must be routed.
  - Keep logic pure and testable; resolver lives in rules layer.

### Tests
- Unit tests:
  - When no hooks are active, resolver yields identical outcomes to previous logic.
  - Start Committee immunity: modifiers do not apply (use stub hook that would otherwise increase cost).

### Docs
- `/docs/changelog.md` entry: canonical resolver introduced + move routing.

## Constraints
- No rule interpretation. If ContextTile assignment is ambiguous, create DD doc (AGENTS §0.6).
- No new mechanics.

## Invariants
- Resolver must be deterministic; no iteration over object keys without stable ordering.
- Resolver must not mutate state partially; apply changes atomically (transaction-like pattern).

## Acceptance Criteria
- All existing moves use resolver.
- Test suite proves:
  - immunity behavior
  - hook pipeline works with empty + stubbed hooks
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

- [x] `pnpm lint` passes REPLACEMENT CHARACTER (U+FFFD) ran pnpm -r lint: all packages passed
- [x] `pnpm test` passes REPLACEMENT CHARACTER (U+FFFD) ran pnpm -r test: all workspace tests green
- [x] Determinism verified REPLACEMENT CHARACTER (U+FFFD) no Date.now/Math.random introduced; resolver deterministic; existing seeded paths unchanged
- [x] No temporary files committed REPLACEMENT CHARACTER (U+FFFD) verified via git status clean after changes
- [x] Rule / contract references added REPLACEMENT CHARACTER (U+FFFD) comments cite AGENTS REPLACEMENT CHARACTER (U+FFFD)3.5 and REPLACEMENT CHARACTER (U+FFFD)3.7 in resolver
- [x] Expansion isolation preserved REPLACEMENT CHARACTER (U+FFFD) hooks typed; no expansion state created in CORE-only
- [x] Changelog updated REPLACEMENT CHARACTER (U+FFFD) added 0014 entry
- [x] If architectural decision was needed: N/A REPLACEMENT CHARACTER (U+FFFD) no new architecture beyond typed hooks


