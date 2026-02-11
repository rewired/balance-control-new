# Codex Task — BALANCE // CONTROL (Software Edition)

**Date:** 2026-02-11  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)  
Key anchors:
- Determinism: AGENTS §0.2  
- Rules anchoring & no drift: AGENTS §0.1, §0.5, §0.6  
- Resource generalization: AGENTS §1.6  
- Expansions modular + isolation: AGENTS §3.4, §3.8, §5.4, §5.5  
- Canonical effect resolver: AGENTS §3.5  
- Production order: AGENTS §3.6  
- Start Committee immunity: AGENTS §3.7  
- Tests + golden replays + hashing: AGENTS §5.1–§5.3

**Context:** Task 0016 is completed. This bundle defines **fix tasks 0017–0022** to close remaining architectural gaps before starting Task 0027+ (next feature work).

---

# Task 0020 — Resolver Enforcement Migration (Phase 1)

## Goal
Enforce AGENTS §3.5 (“No move may directly mutate state outside this resolver”) by migrating the existing core moves to use `resolveEffect(...)`.

This is a migration task: keep behavior identical, but route mutations through the canonical resolver.

## Inputs
- `AGENTS.md` §3.5 Canonical Effect Resolver, §3.2 ContextTile, §3.7 Start Committee immunity
- Existing moves currently mutating `G` directly.
- `resolveEffect` implementation from prior tasks.

## Outputs
### Code
- `@bc/game`:
  - Refactor **all currently implemented core moves** to call `resolveEffect` instead of direct mutations.
  - Each move must build an `EffectDescriptor` and pass an atomic apply callback.
  - Start Committee immunity enforced in resolver and covered by tests.

- `@bc/rules`:
  - If needed, extend `EffectDescriptor` minimally to cover existing move needs.
  - Keep resolver ordering exactly per AGENTS §3.5:
    1) ContextTile
    2) Prohibitions
    3) Cost increases
    4) Output modifiers
    5) Floors
    6) Atomic commit

### Tests
- Regression tests for each migrated move.
- One test using stub hook:
  - cost increase would apply normally
  - but is ignored when ContextTile is Start Committee.

### Docs
- `/docs/changelog.md` entry: “Core moves now route through canonical effect resolver.”

## Constraints
- No new mechanics.
- If ContextTile binding is ambiguous, write a DD doc (AGENTS §0.6).

## Invariants
- Determinism preserved.

## Acceptance Criteria
- No remaining direct state mutation in core moves (except within resolver apply).
- Tests demonstrate immunity + stable outcomes.


---

## Commit Requirements

Create **one clean commit** for this task.

- Commit message format: `task(00XX): <short summary>`
- No WIP commits.
- No unrelated formatting churn (except Task 0017 which is explicitly an encoding/format normalization task).
- Include docs/tests in the same commit when required.

After completing the task, **fill in the PR Checklist** below by changing `[ ]` to `[x]`.

---

## PR Checklist (Fill after implementation)

- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Determinism verified (no `Date.now`, no `Math.random`, no non-seeded sources)
- [ ] No temporary files committed
- [ ] Correct rule / contract references included where required
- [ ] Expansion isolation preserved (no ghost zones/resources when disabled)
- [ ] Changelog updated (`/docs/changelog.md`) when task modifies behavior/architecture
- [ ] If ambiguity required a decision: created `/docs/design-decisions/DD-XXXX-<topic>.md`

