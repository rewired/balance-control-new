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
