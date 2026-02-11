# Task 0006 — Effects: Hotspots + Round Settlement + Production Order — CORE-01-06/07

## Goal
Implement the canonical effect system pieces needed for CORE completion:
- Hotspot enclosure detection and resolution timing
- Round Settlement with Resort Production
- Production resolution order and tie-split to Noise

## Inputs
- `/docs/rules/000-core.md`:
  - Hotspot enclosure + resolution (CORE-01-06-01..08)
  - Production (CORE-01-06-09..17, especially 06-16)
  - Round structure (CORE-01-07)

## Outputs
- In `@bc/game`:
  - After tile placement, check for any Hotspot tiles that become fully surrounded:
    - resolve immediately before Political Action phase (CORE-01-06-02..03)
  - At end of round:
    - perform Round Settlement
    - resolve production for all ResortTiles using canonical order (CORE-01-06-16)
- In `@bc/rules`:
  - `isFullySurrounded(state, hotspotCoord) -> boolean` (uses hex adjacency)
  - `resolveHotspot(state, hotspotCoord)` (uses computeMajority)
  - `resolveProductionForTile(state, tileCoord)` implementing CORE-01-06-16
  - Noise handling for tie remainder (CORE-01-06-15)

## Constraints
- No expansion modifiers yet, but implement the modifier pipeline hook points:
  - “doubling effects” step
  - “production output modifiers” step
  (Leave them empty for core-only.)
- Hotspots produce no resources.

## Invariants
- No partial state change on failed effects (CORE-01-06-00-03).
- Production distribution uses computeMajority rules.
- Tie split remainder goes to Noise (resource zone).

## Acceptance Criteria
- Unit tests:
  - hotspot triggers only when fully surrounded
  - hotspot awards 1 influence to majority player if available in supply
  - settlement produces correct resources to controller
  - settlement tie splits evenly and remainder goes to Noise
- Golden replay test:
  - fixed seed + fixed action list -> stable final state hash

## PR Checklist
- [ ] Enclosure detection is deterministic and tested
- [ ] Settlement is invoked only after last player in round
- [ ] Production order matches CORE-01-06-16

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