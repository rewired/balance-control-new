# Codex Task — BALANCE // CONTROL (Software Edition)

Date: 2026-02-11
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)
Key anchors (ASCII only to avoid encoding drift):
- Determinism: AGENTS 0.2
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
- Resource generalization: AGENTS 1.6
- Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5
- Canonical effect resolver: AGENTS 3.5
- Production order: AGENTS 3.6
- Start Committee immunity: AGENTS 3.7
- Tests + golden replays + hashing: AGENTS 5.1-5.3

Context: Task 0016 is completed. This bundle defines fix tasks 0017-0022 to close remaining architectural gaps before starting Task 0027+ (next feature work).

---

# Task 0020 — Resolver Enforcement Migration (Phase 1)

## Goal
Enforce AGENTS 3.5 by migrating the existing core moves to use resolveEffect(...).

Keep behavior identical, but route mutations through the canonical resolver.

## Inputs
- AGENTS 3.5 Canonical Effect Resolver
- AGENTS 3.2 ContextTile
- AGENTS 3.7 Start Committee immunity
- Existing moves currently mutating G directly.
- resolveEffect implementation from prior tasks.

## Outputs
### Code
- Refactor all currently implemented core moves to call resolveEffect instead of direct mutations.
- If needed, extend EffectDescriptor minimally.
- Keep resolver ordering exactly per AGENTS 3.5.

### Tests
- Regression tests for each migrated move.
- One test with stub hook:
  - cost increase applies normally
  - but is ignored when ContextTile is Start Committee.

### Docs
- /docs/changelog.md entry.

## Constraints
- No new mechanics.
- If ContextTile binding ambiguous, write DD doc (AGENTS 0.6).

## Invariants
- Determinism preserved.

## Acceptance Criteria
- No remaining direct state mutation in core moves (except within resolver apply).
- Tests demonstrate immunity and stable outcomes.

---

## Commit Requirements

Create one clean commit for this task.

- Commit message format: task(00XX): <short summary>
- No WIP commits.
- No unrelated formatting churn (except Task 0017 which is explicitly an encoding/format normalization task).
- Include docs/tests in the same commit when required.

After completing the task, fill in the PR Checklist below by changing [ ] to [x].

---

## PR Checklist (Fill after implementation)

- [x] pnpm lint passes
- [x] pnpm test passes
- [x] Determinism verified (no Date.now, no Math.random, no non-seeded sources)
- [x] No temporary files committed
- [x] Correct rule / contract references included where required
- [x] Expansion isolation preserved (no ghost zones/resources when disabled)
- [x] Changelog updated (/docs/changelog.md) when task modifies behavior/architecture
- [ ] If ambiguity required a decision: created /docs/design-decisions/DD-XXXX-<topic>.md
