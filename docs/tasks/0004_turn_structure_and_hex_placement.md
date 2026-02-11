# Task 0004 — Turn Structure: DrawAndPlaceTile + Political Action Shell — CORE-01-04

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
- Must be deterministic; “shuffle” must use seeded RNG.
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
