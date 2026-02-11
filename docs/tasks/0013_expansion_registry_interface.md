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

# Task 0013 â€” Expansion Registry Interface (registerExpansion)

## Goal
Create the canonical module interface for expansions and a registry that the engine can use to:
- register expansion-provided resources
- register expansion-provided zones/state initializers
- provide hooks for resolver/production and move injection (to be wired in tasks 0014â€“0016)

This formalizes AGENTS Â§3.8.

## Inputs
- `AGENTS.md` Â§3.4, Â§3.8
- Tasks 0010â€“0012 completed.

## Outputs
### Code
- `@bc/rules`:
  - Types:
    - `ExpansionModule`
    - `ExpansionRegistration`
  - API:
    - `createExpansionRegistry(config)` â†’ returns an ordered list of enabled modules
    - `registerExpansion(module: ExpansionModule)`
  - `ExpansionModule` must support:
    - `id: ExpansionId`
    - `registerResources(registry)`
    - `setupExpansionState(G, ctx)` (must only touch its own slice)
    - optional:
      - `extendMoves(moves)` (boardgame.io move injection; actual wiring later)
      - `hooks: { prohibitions?, costIncreases?, outputModifiers?, productionModifiers? }` (wired later)

- `@bc/game`:
  - Create core registry (resources) and then apply enabled expansion modules (but modules can be stubbed now).

### Tests
- Registry determinism:
  - ordering of enabled modules is stable (sorted by id or by explicit order list)
- Enabling/disabling expansions results in correct module list.

### Docs
- `/docs/changelog.md` entry: expansion registry added.

## Constraints
- No expansion logic beyond minimal scaffolding.
- No cross-expansion sharing of objects/zones (AGENTS Â§3.4). Modules can *declare* zones but must be isolated.

## Invariants
- If an expansion is disabled, its module must not be instantiated or executed (AGENTS Â§3.8).

## Acceptance Criteria
- Engine can produce:
  - a core-only module list (empty)
  - a mixed list (e.g. [exp01, exp03]) deterministically
- Unit tests cover at least 3 combinations.


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
- [x] Rule / contract references added where required (AGENTS §3.8)
- [x] Expansion isolation preserved (no ghost zones/resources when disabled)
- [x] Changelog updated (`/docs/changelog.md`)
- [x] If architectural decision was needed: created `/docs/design-decisions/DD-XXXX-<topic>.md` (n/a)

