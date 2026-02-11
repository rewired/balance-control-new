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

# Task 0018 — Game Factory + Module Bootstrapping (Register and Activate Expansions)

## Goal
Ensure expansion modules can be registered and used in runtime by introducing a canonical game factory that:
- Instantiates enabled expansion modules from match config
- Builds the move catalog from core + modules
- Builds initial state and calls each module's setupExpansionState

## Inputs
- AGENTS 3.4 Expansions are Modular
- AGENTS 3.8 Expansion Isolation Layer
- AGENTS 5.5 No Dead State Policy
- Existing code after 0016:
  - Expansion registry interface
  - Move catalog builder

## Outputs
### Code
- @bc/game:
  - Introduce createBCGame(config) (or equivalent factory):
    - enabledModules = [exp01Stub?, exp02Stub?, exp03Stub?].filter(configFlag)
    - Register modules (or pass modules directly if registry is purely in-memory)
    - Build move catalog from coreMoves + enabledModules
    - Wire setup:
      - build core state
      - call module.setupExpansionState(G, ctx) for each enabled module
  - Export CoreGame built via the factory with "no expansions enabled" config.

- @bc/rules:
  - If needed: helper getEnabledExpansionIds(config)

### Tests
- CORE-only:
  - module list empty
  - no G.exp field (preferred) or no keys inside
  - move catalog contains only core moves
- CORE + exp01 (still stub):
  - module list includes exp01 module
  - setupExpansionState was executed (assert via initialized sentinel)

### Docs
- /docs/changelog.md entry: game factory introduced; expansion modules bootstrapped from match config.

## Constraints
- No real expansion mechanics yet.
- Disabled expansion must leave zero footprint in state and moves (AGENTS 5.5).

## Invariants
- Factory deterministic: enabled module ordering stable.

## Acceptance Criteria
- Runtime path can activate modules.
- Tests prove setupExpansionState runs only when enabled.

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
