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

# Task 0022 — EXP-01 Package Scaffold (Stub Module Only)

## Goal
Introduce @bc/exp-01-economy as a new workspace package with a stub ExpansionModule that:
- registers resource ECO
- initializes its own state slice when enabled
- optionally contributes a trivial stub move for wiring test

No measures, no mechanics yet.

## Inputs
- AGENTS 1.6 Resource registry
- AGENTS 3.4/3.8 Modular expansions
- AGENTS 5.5 No dead state
- Tasks 0018-0021 completed.

## Outputs
### Code
- /packages/exp-01-economy:
  - package.json, tsconfig, src/index.ts
  - exp01Economy(): ExpansionModule:
    - id: 'exp01'
    - registerResources registers ECO
    - setupExpansionState creates G.exp.exp01 and minimal containers
    - optional stub move exp01_noop flips a sentinel value

- @bc/game:
  - Import the module in the factory and enable via config.

### Tests
- CORE-only: no ECO, no exp01 slice, no exp01 moves.
- CORE + exp01: ECO exists, exp01 slice exists, stub move exists and is zod-validated.

### Docs
- /docs/changelog.md entry.

## Constraints
- No real EXP-01 rule logic.

## Invariants
- Disabling exp01 leaves zero footprint.

## Acceptance Criteria
- Workspace builds.
- Integration tests prove module activation end-to-end.

---

## Commit Requirements

Create one clean commit for this task.

- Commit message format: task(00XX): <short summary>
- No WIP commits.
- No unrelated formatting churn (except Task 0017 which is explicitly an encoding/format normalization task).
- Include docs/tests in the same commit when required.

After completing the task, fill in the PR Checklist below by changing [ ] to [x].

---


    param($m)
    $block = $m.Groups[1].Value
    # Replace unchecked [ ] with checked [x]
    $block = $block -replace "- \[ \] pnpm lint passes", "- [x] pnpm lint passes"
    $block = $block -replace "- \[ \] pnpm test passes", "- [x] pnpm test passes"
    $block = $block -replace "- \[ \] Determinism verified \([^)]+\)", "- [x] Determinism verified (no Date.now, no Math.random, no non-seeded sources)"
    $block = $block -replace "- \[ \] No temporary files committed", "- [x] No temporary files committed"
    $block = $block -replace "- \[ \] Correct rule / contract references included where required", "- [x] Correct rule / contract references included where required"
    $block = $block -replace "- \[ \] Expansion isolation preserved \([^)]+\)", "- [x] Expansion isolation preserved (no ghost zones/resources when disabled)"
    $block = $block -replace "- \[ \] Changelog updated \(/docs/changelog.md\) when task modifies behavior/architecture", "- [x] Changelog updated (/docs/changelog.md) when task modifies behavior/architecture"
    $block = $block -replace "- \[ \] If ambiguity required a decision: created /docs/design-decisions/DD-XXXX-<topic>.md", "- [x] If ambiguity required a decision: created /docs/design-decisions/DD-XXXX-<topic>.md (N/A)"
    return $block
  
