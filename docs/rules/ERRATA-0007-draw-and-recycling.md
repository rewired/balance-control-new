# ERRATA-0007 — Draw resolution and bounded recycling

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, VAR-01-01, EXP-03 v1.0
Decision: DD-0017, R07; approved by the user during the rules review.

## Defect

Drawn Tiles had no explicit zone. Unpaid Climate placement costs lacked a discard/retry procedure, and recycling could repeatedly draw unplaceable Tiles without termination. End-game rules did not cover a nonempty pile consisting entirely of recycled, geometrically unplaceable Tiles.

## Approved correction

The authoritative correction is incorporated in `000-core.md` and `003-expansion03.md`:

- CORE-01-00-05/-05A and CORE-01-03-09 add an initially empty DrawResolution zone holding at most one Tile.
- CORE-01-04-04 allows repeated draw attempts, with at most one successful placement per drawing phase.
- CORE-01-04-05A/-05B distinguish geometric placement from fully legal and payable placement, with atomic payment and placement.
- CORE-01-04-06/-07 discard and redraw when no payable legal placement exists, or finish under R05 if the pile is exhausted.
- CORE-01-04-08A requires a payable legal placement when one exists; voluntary discard or recycling is not permitted.
- VAR-01-01-04 through -08 recycle only geometrically unplaceable Tiles. Other failures, including unaffordable Climate placement costs, discard the Tile even with recycling enabled.
- Recycling tracks attempted physical Tile IDs per drawing phase, draws the first untried Tile in the current seeded shuffle order, and skips attempted Tiles in place.
- If every remaining Tile was tried and returned for geometric impossibility, CORE-01-09-01B and VAR-01-01-08 enter the final Settlement without requiring an empty pile or granting a Political Action.
- EXP-03-08-M12-06 connects Extreme Weather Event to this procedure.

Existing rule IDs are preserved. No Tile belongs to two zones. Recycling deliberately preserves geometrically unplaceable Tiles but does not protect unaffordable Tiles from discard; this exception was explicitly approved.

## Examples for later implementation verification

1. A drawn Tile is in DrawResolution until placed, discarded, or returned. An empty pile does not end the game while that Tile is unresolved.
2. When a payable legal option exists, choosing an unaffordable option does not authorize voluntary discard.
3. Under Extreme Weather Event, a player unable to pay CLM or DOM discards a ResortTile without payment, even in recycling mode. A subsequently drawn Committee may be placed normally.
4. A geometrically unplaceable Tile returns to DrawPile and triggers a seeded shuffle. It cannot be attempted twice in the same phase, even if shuffled to the top again.
5. If all remaining Tiles are geometrically unplaceable, each is attempted at most once, stays in DrawPile after return, and the single final Settlement follows without a Political Action.
6. If the remaining Tiles all require unaffordable costs, they are discarded one by one. Actual pile exhaustion then follows the same final-Settlement procedure.

## Implementation status

Only rule documents are changed. Game code has not yet been adapted or verified against the new zone, bounded retries, or terminal condition. Other open DD-0017 proposals are not approved by this erratum.
