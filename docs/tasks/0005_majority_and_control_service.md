# Task 0005 — Majority & Control Service (Canonical computeMajority) — CORE-01-05

## Goal
Implement `computeMajority(tileCoord)` as the single canonical majority function and derive control from it.

## Inputs
- `/docs/rules/000-core.md`:
  - CORE-01-05 Control
  - Lobbyist adjacency bonus (CORE-01-05-04..06)
  - Control definition (CORE-01-05-01..03A)

## Outputs
- In `@bc/rules`:
  - `computeMajority(state, tileCoord) -> playerID | null`
  - `getControl(state, tileCoord) -> playerID | null` (wrapper/alias)
  - Functions to count:
    - real influence markers on tile
    - virtual influence from adjacent lobbyists
- In `@bc/game`:
  - Ensure any move that changes influence placement triggers control recomputation (either derived or on-demand)

## Constraints
- Tie must return `null` (no control).
- Lobbyists contribute only to majority calculation; they do not place/move influence objects.

## Invariants
- Same inputs always yield same output.
- Majority computation is used by:
  - Hotspot resolution (later)
  - Production distribution (Task 0006)
  - Any action gating that depends on control

## Acceptance Criteria
- Unit tests cover:
  - simple majority
  - tie -> null
  - lobbyist adjacency changes majority outcome
  - multiple lobbyists stack (+1 each)

## PR Checklist
- [ ] No duplicated majority logic anywhere else
- [ ] Tests cite CORE-01-05 section IDs

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