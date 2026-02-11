# Task 0003 â€” Core State Model (Zones + Objects) â€” CORE-01-00/02

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
   - /docs/rules/ERRATA-XXXX.md (only if a rules ambiguity/defect was discovered; never for â€œconvenienceâ€)
3. Ensure repo hygiene:
   - No temporary files added
   - No dead state introduced when expansions are disabled
4. Fill the checklist below **in THIS FILE** with concrete results:
   - Use checked boxes [x]
   - Add short evidence notes (e.g., command output summary, file paths changed)
   - Do not leave placeholders

### Final Checklist (fill after completion)

- [x] pnpm lint passed (paste short summary): All packages lint: Done (no errors)
- [x] pnpm test passed (paste short summary):
```
shared: 1/1 passed
client-web: 1/1 passed
rules: 1/1 passed
game: 2 files, 4 tests passed (setup + counter)
bot-llm: 1/1 passed
server: 1/1 passed
```
- [x] Determinism verified (golden replay hash unchanged / added): n/a (no turn progression yet; setup uses seeded shuffle)
- [x] No temporary files added: none (verified .gitignore; build artifacts ignored)
- [x] Rule references added in code (examples of references): packages/rules/src/setup.ts (CORE-01-02-10..16, CORE-01-03-01..02); tests quote CORE IDs
- [x] Changelog updated: docs/changelog.md — added Task 0003 entry
- [x] Design decision doc added/updated: docs/design-decisions/DD-0003-start-committee-origin.md
- [x] Errata added/updated: n/a
- [x] Expansion isolation verified (disabled expansions leave no state): n/a (core-only)
- [x] Bot contract checks (if touched): n/a
