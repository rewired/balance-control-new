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

# Task 0019 — Expansion Setup Ownership (No Placeholder Slices)

## Goal
Make setupExpansionState the only authority that creates expansion slices/zones.

Remove any placeholder expansion slice creation outside module setup, so expansions own their state cleanly.

## Inputs
- AGENTS 3.8 Expansion Isolation Layer
- AGENTS 5.5 No Dead State
- Task 0018 factory in place.

## Outputs
### Code
- Remove any code that pre-creates G.exp.exp01 = {} etc.
- Ensure:
  - If no expansions enabled -> G.exp is absent (preferred)
  - If some enabled -> G.exp exists and only contains enabled ids
- Provide helper ensureExpansionSlice(G, expId, initialValue) used only inside modules.

### Tests
- CORE-only: assert G.exp === undefined (preferred) or documented rationale.
- CORE + exp01: only exp01 slice exists.

### Docs
- /docs/changelog.md entry.

## Constraints
- No real expansion mechanics.

## Invariants
- No ghost zones/resources when disabled.

## Acceptance Criteria
- State structure is strictly module-driven.
- Tests assert absence/presence rules.

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

- [ ] pnpm lint passes
- [ ] pnpm test passes
- [ ] Determinism verified (no Date.now, no Math.random, no non-seeded sources)
- [ ] No temporary files committed
- [ ] Correct rule / contract references included where required
- [ ] Expansion isolation preserved (no ghost zones/resources when disabled)
- [ ] Changelog updated (/docs/changelog.md) when task modifies behavior/architecture
- [ ] If ambiguity required a decision: created /docs/design-decisions/DD-XXXX-<topic>.md
