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

# Task 0015 — Production Modifier Hook Integration (Canonical Order Preserved)

## Goal
Wire expansion hooks into the production engine while preserving the canonical production order from AGENTS §3.6.

This prepares EXP-01 / EXP-03 without implementing them yet.

## Inputs
- `AGENTS.md` §3.6 Production Engine Canonical Order
- Current core production / settlement implementation
- Core rules: production/settlement ordering must match normative spec.

## Outputs
### Code
- `@bc/rules`:
  - `collectProductionModifiers(context, enabledModules)`:
    - returns an ordered list of modifier descriptors
    - stable ordering across modules and within module
  - Integrate modifiers into production pipeline at step 3:
    1. printed value
    2. doubling
    3. production output modifiers  ← here
    4. floors
    5. majority check
    6. distribution / noise

- `@bc/game`:
  - Production/settlement code calls the hook collector derived from enabled expansion modules.
  - CORE-only behavior unchanged when no modules enabled.

### Tests
- Core-only golden test for production remains green.
- New test using a stub module that applies:
  - +1 production or -1 production modifier (whatever is easiest)
  - demonstrates that modifiers apply **exactly at step 3** and before floors/majority/distribution.

### Docs
- `/docs/changelog.md` entry: production hooks integrated.

## Constraints
- Do not implement real EXP-01/03 modifiers yet.
- Do not reorder production steps.

## Invariants
- Tie remainder to Noise must remain correct (AGENTS §3.6).
- Determinism preserved.

## Acceptance Criteria
- Production pipeline is hook-capable and order-correct.
- Tests cover stub modifier + core-only.


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

- [x] `pnpm lint` passes � ran pnpm -r lint: all packages passed
- [x] `pnpm test` passes � ran pnpm -r test: all workspace tests green
- [x] Determinism verified � no Date.now/Math.random introduced; production order preserved (AGENTS �3.6)
- [x] No temporary files committed � verified via git status clean after changes
- [x] Rule / contract references added � comments cite AGENTS �3.6 at integration point
- [x] Expansion isolation preserved � hooks optional; CORE-only unchanged
- [x] Changelog updated � added 0015 entry
- [x] If architectural decision was needed: N/A � no new architecture beyond typed hook


