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

# Task 0021 — Match Config is Source of Truth (No Flag Derivation from State)

## Goal
Stop deriving expansion enablement flags from state shape (e.g., `!!G.exp?.exp01`) and treat **match config** as the source of truth.

## Inputs
- `AGENTS.md` §0.2 Determinism, §3.8 Expansion Isolation
- Current code that derives flags in lifecycle hooks.

## Outputs
### Code
- `@bc/game`:
  - Ensure match config is accessible where needed:
    - store canonical config in state (core field) OR via boardgame.io setup data, documented.
  - Replace any derived flags (`!!G.exp...`) with config flags.

- `@bc/rules`:
  - Helper `isExpansionEnabled(config, 'exp01')`.

### Tests
- Config disables exp01 but state contains `G.exp.exp01` → still treated as disabled.
- Config enables exp01 but slice missing → state invalid (zod) or deterministic failure.

### Docs
- `/docs/changelog.md` entry: “Expansion enablement is driven by match config, not state introspection.”

## Constraints
- Keep boardgame.io-compatible patterns.

## Invariants
- Module set reconstructable from config deterministically.

## Acceptance Criteria
- No remaining places derive expansion flags from state presence.
- Tests cover mismatched state deterministically.


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

