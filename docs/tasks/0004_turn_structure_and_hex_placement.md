# Task 0004 â€” Turn Structure: DrawAndPlaceTile + Political Action Shell â€” CORE-01-04

## Goal
Implement the CORE turn flow in boardgame.io:
1. DrawAndPlaceTile
2. ExactlyOnePoliticalAction

This task establishes the phase pipeline and legal tile placement for hex adjacency.

## Inputs
- `/docs/rules/000-core.md`
  - CORE-01-04 Turn Structure (especially 04-04..08 and 04-09..22)
  - CORE-01-00 Topology Attachment contract (Adjacent(TileA, TileB))

## Outputs
- In `@bc/game`:
  - boardgame.io phases matching CORE:
    - Phase 1: DrawAndPlaceTile (forced)
    - Phase 2: ExactlyOnePoliticalAction (choose one action)
  - Tile draw logic:
    - draw one tile from DrawPile
    - if cannot be legally placed, move to DiscardFaceUp and draw again (CORE-01-04-06..07)
- In `@bc/rules`:
  - Hex topology adapter `Adjacent(a,b)` for axial or cube coords
  - Tile placement legality check:
    - must be adjacent to at least one tile on Board (CORE-01-04-05)
    - cannot be placed on top of another tile (CORE-01-04-08)

## Constraints
- Must be deterministic; â€œshuffleâ€ must use seeded RNG.
- The topology adapter must be isolated so it can be swapped in future.
- Do not implement Hotspot enclosure resolution yet (Task 0006 will cover triggers + settlement).

## Invariants
- A turn always consists of exactly two phases (CORE-01-04-01..03).
- Exactly one political action is selected (CORE-01-04-09).

## Acceptance Criteria
- Unit tests:
  - legal placement next to Start Committee works
  - illegal placement is rejected
  - unplaceable drawn tile goes to DiscardFaceUp and re-draw occurs
- A simple UI interaction exists in client to place the drawn tile.

## PR Checklist
- [ ] Hex adjacency uses a standard coordinate system and is tested
- [ ] No hidden randomness
- [ ] Turn/phase flow mirrors CORE section numbering

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
`
shared: 1/1 passed
client-web: 1/1 passed
rules: 3/3 files, 5 tests passed (adjacency, legal/illegal, discard-redraw)
game: 2/2 files, 4 tests passed
bot-llm: 1/1 passed
server: 1/1 passed
`
- [x] Determinism verified (golden replay hash unchanged / added): n/a (no full turns hashed yet; draw is deterministic from seeded pile)
- [x] No temporary files added: none (verified .gitignore; build artifacts ignored)
- [x] Rule references added in code (examples of references): rules/topology/hex.ts (CORE-01-00-T01..T05); rules/placement.ts (CORE-01-04-05/08); rules/draw.ts (CORE-01-04-06..07)
- [x] Changelog updated: docs/changelog.md — Task 0004 entry
- [x] Design decision doc added/updated: n/a
- [x] Errata added/updated: n/a
- [x] Expansion isolation verified (disabled expansions leave no state): core-only state unchanged
- [x] Bot contract checks (if touched): n/a
