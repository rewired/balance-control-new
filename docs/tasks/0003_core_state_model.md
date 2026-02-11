# Task 0003 — Core State Model (Zones + Objects) — CORE-01-00/02

## Goal
Implement the **canonical state model** and object representations required by CORE-01.
This enables all later rules to operate on explicit zones.

## Inputs
- `/docs/rules/000-core.md`
  - CORE-01-00 State Model (Zones)
  - CORE-01-02 Components (Tile types, resorts, counts)

## Outputs
- In `@bc/rules`:
  - TypeScript types for:
    - Zones (Board, DrawPile, DiscardFaceUp, Bank, Noise, PersonalSupply, etc.)
    - Tile objects (ResortTile, Committee, Grassroots, Lobbyist, Hotspot, StartCommittee)
    - Resource objects (DOM/FOR/INF)
    - Influence objects
  - Zod schemas for runtime validation of:
    - Game config (expansion flags later)
    - Move payloads (later)
- In `@bc/game`:
  - Initial game state builder:
    - places Start Committee in Board
    - shuffles all other tiles into DrawPile
    - sets up player supplies per player count
    - stores a deterministic match seed

## Constraints
- Must follow zone exclusivity:
  - Every object exists in exactly one zone at any time (CORE-01-00-01..06).
- Tile counts must match CORE-01-02 (DOM/FOR/INF distributions, plus committees/grassroots/lobbyists/hotspots).
- No expansions yet; implement core-only state first.

## Invariants
- State must serialize to JSON and rehydrate identically.
- State validation must be possible (zod).

## Acceptance Criteria
- Unit test: setup for 2/3/4 players produces correct starting influence counts (CORE-01-03-04..06).
- Unit test: Start Committee is on Board and not in DrawPile (CORE-01-02-01..03).
- Unit test: total tile counts in DrawPile match CORE-01-02-10..16.

## PR Checklist
- [ ] Types live in @bc/rules, game glue in @bc/game
- [ ] Tests reference CORE section IDs
- [ ] No expansion leakage

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