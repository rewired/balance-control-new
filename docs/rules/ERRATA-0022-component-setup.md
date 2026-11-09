# ERRATA-0022 — Explicit expansion Tile quantities and setup

Date: 2026-11-08
Status: Accepted for R20
Applies to: EXP-01 v1.3 and EXP-03 v1.0, including 5–6-player setup
Decision: DD-0017, R20; approved by the user during the rules review.

## Defect

Labor Market had no explicit quantity. Investment Program had a quantity but no direct expansion setup instruction placing it in the Tile DrawPile. EXP-03 required two extra CLM Tiles for 5–6 players without specifying their values; the other expansions' distributions did not determine those two values uniquely.

## Approved correction

The authoritative correction is incorporated in `001-expansion01.md` and `003-expansion03.md`:

- EXP-01-02-C-08 and EXP-01-02-D-01 specify exactly one Labor Market and one Investment Program in DrawPile for either player-count range.
- EXP-01-03-01/-07 explicitly shuffle these two Tiles with the already defined ECO set. Component descriptions and setup reference the same copies. Measures remain in their separate zones; inactive EXP-01 contributes none of these Tiles.
- ECO quantities remain unchanged: W1×2/W2×1/W3×1 for 2–4 players, plus one of each for 5–6. Including the special Tiles, EXP-01 adds six or nine Tiles respectively.
- EXP-03-02-A-02/-02A specify one additional CLM-W1 and one additional CLM-W2 for 5–6 players. The total CLM set is two of each for 2–4, or three of each for 5–6.
- Transformation Pressure remains a separate single Hotspot. R18's inactive Countdown state and deck exclusions remain applicable.

The CLM additional values are an explicit approved design choice preserving the base set's equal W1/W2 distribution, not a conclusion uniquely derivable from the previous wording. This clarification is not a balance-test result.

## Examples for later implementation verification

1. With EXP-01 and 2–4 players, add four ECO ResortTiles, one Labor Market, and one Investment Program: six Tiles total.
2. With EXP-01 and 5–6 players, add seven ECO ResortTiles plus the same two single special Tiles: nine total.
3. With EXP-03 and 2–4 players, add two CLM-W1 and two CLM-W2; with 5–6, add three of each. The one Transformation Pressure is additional to those ResortTiles.
4. A component heading and a setup instruction do not produce duplicate special Tiles. MeasureCards never enter the Tile DrawPile.
5. Disabled expansions contribute no corresponding Tiles, regardless of player count. No Countdown state is introduced by the extra CLM Tiles.

## Scope and implementation status

R20 is approved. Investment Program's action integration was subsequently approved in ERRATA-0023-investment-program-conversion.md; its explicit setup placement alone grants no new action or exchange. The other unresolved DD-0017 findings remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against these quantities.
