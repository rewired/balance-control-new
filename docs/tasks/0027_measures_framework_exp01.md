# Task 0007 — Expansion-Ready Measures Framework (Zones per Expansion) — EXP-01 baseline

## Goal
Introduce the shared Measure lifecycle framework in an expansion-safe way, using EXP-01 as the first implementation.
EXP-02 and EXP-03 will reuse the same lifecycle rules but keep separate zones.

## Inputs
- `/docs/rules/001-expansion01.md`:
  - Measure zones + lifecycle (EXP-01-02-E, EXP-01-07)
  - Political Action extension: TakeMeasure / PlayMeasure (EXP-01-06)
- `/docs/rules/000-core.md` for rule hierarchy and determinism

## Outputs
- In `@bc/rules`:
  - Generic Measure engine:
    - zones: DrawPile, OpenMeasures (3 face-up), PlayerHand, Recycle, FinalDiscard
    - play counter + movement rules
    - usedThisRound flags, reset timing
  - Types that allow *multiple independent measure instances*, one per expansion.
- In `@bc/game`:
  - Add optional EXP-01 flag to match config:
    - when enabled, initialize EXP-01 measure zones and ECO tiles per spec
  - Add Political Actions:
    - TakeMeasure (ends turn)
    - PlayMeasure (then exactly one additional non-PlayMeasure action)
  - Enforce:
    - max 1 PlayMeasure per round (EXP-01-06-02)
    - max 2 Measures in hand (EXP-01-06-03)

## Constraints
- Measures from one expansion must never enter another expansion’s zones.
- Timing windows must be limited to those defined in EXP-01/02/03.
- Start Committee immunity remains intact (CORE-01-08-06A/B).

## Invariants
- usedThisRound resets immediately after Round Settlement ends (EXP-01-07-07).

## Acceptance Criteria
- Unit tests:
  - initialize open measures = 3
  - TakeMeasure draws from OpenMeasures and refills
  - PlayMeasure increments play counter and moves to proper pile (recycle, then final discard)
  - per-round PlayMeasure limit enforced
  - hand limit enforced
- Smoke test: core-only match runs unchanged when EXP-01 disabled.

## PR Checklist
- [ ] EXP-01 zones are isolated
- [ ] Lifecycle matches EXP-01-07 exactly
- [ ] Tests reference EXP-01 section IDs

---

## Completion Protocol (MANDATORY)

When the implementation is finished, you MUST do all of the following before declaring the task complete:

1. Run:
   - pnpm lint
   - pnpm test
2. Update documentation:
   - /docs/changelog.md (required)
   - /docs/design-decisions/DD-XXXX-<topic>.md (if any architectural decision was made)
   - /docs/rules/ERRATA-XXXX.md (only if a rules ambiguity/defect was discovered; never for “convenience”)
3. Ensure repo hygiene:
   - No temporary files added
   - No dead state introduced when expansions are disabled
4. Fill the checklist below **in THIS FILE** with concrete results:
   - Use checked boxes [x]
   - Add short evidence notes (e.g., command output summary, file paths changed)
   - Do not leave placeholders

### Final Checklist (fill after completion)

- [ ] pnpm lint passed (paste short summary):
- [ ] pnpm test passed (paste short summary):
- [ ] Determinism verified (golden replay hash unchanged / added):
- [ ] No temporary files added:
- [ ] Rule references added in code (examples of references):
- [ ] Changelog updated: (path + brief entry summary)
- [ ] Design decision doc added/updated: (path or “n/a”)
- [ ] Errata added/updated: (path or “n/a”)
- [ ] Expansion isolation verified (disabled expansions leave no state):
- [ ] Bot contract checks (if touched): schema + illegal fallback tested