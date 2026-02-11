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
