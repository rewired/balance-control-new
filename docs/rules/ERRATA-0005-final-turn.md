# ERRATA-0005 — Final turn and Settlement

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, CORE-01-07 Round Structure and CORE-01-09 End Game
Decision: DD-0017, R05; approved by the user during the rules review.

## Defect

CORE-01-09-01 ended the game when no further Tiles could be drawn, while -02 required a final Round Settlement. The specifications did not define the last Political Action, an interrupted player cycle, or the unsuccessful final-draw case.

## Approved correction

The authoritative correction is incorporated directly in `000-core.md`:

- CORE-01-07-01A permits a partial final round under the explicit end-game procedure.
- CORE-01-09-01 makes DrawPile exhaustion initiate that procedure without interrupting an already drawn Tile.
- CORE-01-09-01A finishes a successful last placement, its triggered Hotspots, and the full Political Action sequence, including an explicitly granted additional action, before the final Settlement.
- CORE-01-09-01B omits the Political Action when unsuccessful placement/discard attempts exhaust the pile without placing a Tile and no drawn Tile remains unresolved.
- CORE-01-09-01C requires exactly one final Settlement, including when it coincides with the regular round boundary, and prevents further player turns or a new round.
- CORE-01-09-02 completes all applicable final-Settlement effects before scoring and ending the game.

Existing rule IDs are preserved. This explicitly ends a partial final round; it does not add turns without Tile draws to equalize the number of turns played.

## Examples for later implementation verification

1. A is first in a three-player round and places the last Tile. Resolve its Hotspots, finish A's Political Action sequence, perform one final Settlement, and score. B and C receive no further turns.
2. If A legally uses PlayMeasure on that last turn, its granted additional non-PlayMeasure action is completed before the final Settlement.
3. If the last placement occurs on the last player's normal round-ending turn, perform one Settlement, not a regular Settlement followed by a second final one.
4. If the last drawn Tile is discarded and the pile is exhausted without a successful placement, skip that turn's Political Action and proceed directly to the final Settlement.
5. An exhausted pile while an already drawn Tile is awaiting placement does not by itself skip that Tile or end the game.
6. Any effect applicable during the final Settlement completes before victory is determined. No following-round start event occurs.

## Scope and implementation status

This correction does not decide Hotspot ordering and retry behavior (R06), the drawn Tile's explicit zone and recycling failure procedure (R07), or the internal ordering and expiry windows of Settlement effects (R15/R25). Only effects already applicable under their timing rules participate in the final Settlement.

Only rule documents are changed. Game code has not yet been adapted or verified against this correction. Other open DD-0017 proposals are not approved by this erratum.
