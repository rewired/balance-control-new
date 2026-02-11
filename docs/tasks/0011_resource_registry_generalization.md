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

# Task 0011 â€” Resource Registry Generalization (No Hardcoded DOM/FOR/INF)

## Goal
Remove hardcoded resource-type branching and introduce a **registry-driven resource model** consistent with AGENTS Â§1.6.

The core must operate on a set of registered resources (DOM/FOR/INF in CORE; ECO/SEC/CLM via expansions later) without switching on string literals.

## Inputs
- `AGENTS.md` Â§1.6 Resource Model Generalization
- Current resource/state types in `@bc/rules` and `@bc/game` (post 0006).
- Normative rules in `/docs/rules/000-core.md` for CORE resources (DOM/FOR/INF).

## Outputs
### Code
- `@bc/rules`:
  - `ResourceId` becomes registry-based (not a fixed union in core-only compilation unit).
  - `ResourceRegistry`:
    - `register(id, meta)` (meta optional: display name, icon id, etc. non-normative)
    - `list()` and `has(id)`
  - `createCoreResourceRegistry()` registers DOM/FOR/INF.
  - State representation for resource amounts uses a map keyed by `ResourceId`:
    - e.g. `Record<ResourceId, number>` with canonical initialization from registry.
  - Helpers:
    - `makeEmptyResourceBank(registry)`
    - `addResources`, `subResources`, `canPay`, `assertNonNegative`

- `@bc/game`:
  - Setup builds registry from core + enabled expansions (exp registrations added in Task 0013).
  - When an expansion is disabled, its resource type does not exist anywhere in state (AGENTS Â§1.6).

### Tests
- Unit tests verifying:
  - core-only registry contains exactly DOM/FOR/INF
  - no resource keys outside the registry exist in state
  - paying cost logic remains deterministic and rejects unknown resources

### Docs
- `/docs/changelog.md` entry about registry-based resources.

## Constraints
- Do not implement expansion resources yet; only make the system capable.
- Do not add UI-driven concerns; keep meta minimal and optional.

## Invariants
- Deterministic initialization ordering: registry iteration order must be stable across runs (e.g. sorted by id or insertion order with controlled insert order).
- No negative balances after valid transitions.

## Acceptance Criteria
- No code path checks `if (res === "DOM")` or similar; use registry + generic ops.
- Tests pass and demonstrate strict resource-key set.
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
- [x] Rule / contract references added where required (AGENTS §1.6 applied; no string literal switches)
- [x] Expansion isolation preserved (no ghost zones/resources when disabled)
- [x] Changelog updated (`/docs/changelog.md`)
- [x] If architectural decision was needed: created `/docs/design-decisions/DD-XXXX-<topic>.md` (n/a)

