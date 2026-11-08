# ERRATA-0020 — Reserved Countdown mechanic and deck exclusions

Date: 2026-11-08
Status: Accepted for R18
Applies to: EXP-03 v1.0 and its setup with or without EXP-01
Decision: DD-0017, R18; approved by the user during the rules review.

## Defect

Countdown had no initialized supply, no placement/removal effect, and no intrinsic function. Transformation Blockade and Future Committee only increased costs for a placement that no existing effect instructed. Treating the reserved descriptions as an active mechanism would require inventing rules.

## Approved correction

The authoritative correction is incorporated in `003-expansion03.md`:

- EXP-03-00-08 and EXP-03-02-C-00/-01 reserve the Countdown mechanic as inactive in this version. All Countdown descriptions authorize no action or effect and create no markers, supply, counters, attached entries, or empty placeholders.
- Existing marker and placement descriptions remain available as reserved text; their automatic resolution remains prohibited. Activation requires a separate rule revision specifying supply, placement, and actual function.
- EXP-03-03-02D excludes Transformation Blockade (M14) and Future Committee (M15) unconditionally, independently of EXP-01 activation. The cards exist in no match zone and cannot return through draws, refill, recycling, or substitution.
- EXP-03-03-02/-02A/-02B/-02C combine this exclusion with the accepted R11 ECO filter. Three remaining cards require EXP-01: M06, M09, and M11. The eligible deck has 13 cards with EXP-01 or 10 without, before the unchanged three-card market setup.
- EXP-03-03-07 explicitly omits Countdown state even with EXP-03 active. EXP-03-02-B-02/-04 preserve exactly one ordinary Transformationsdruck Hotspot, with normal CORE majority Influence payout and no Resource production or Countdown effect.
- EXP-03-08-M14-00/-M15-00 mark the retained card texts as reserved definitions.

Existing rule IDs and the eligible cards' printed costs are preserved. This supersedes R11's earlier deck counts and Future Committee eligibility: M15 is now excluded even with EXP-01. Its exclusion is counted only once.

## Examples for later implementation verification

1. EXP-03 with EXP-01 contains 13 eligible Measures: M01 through M13, one of each, before setup transfers three to the market.
2. EXP-03 without EXP-01 contains 10 eligible Measures: exclude M06, M09, M11, M14, and M15 from the original fifteen.
3. M14 and M15 occur in no draw, market, hand, recycle, or FinalDiscard zone. A later substitution effect cannot introduce them.
4. No Countdown objects, counters, supply zone, or empty Countdown placeholders exist in state, including with all expansions active.
5. Transformationsdruck is added exactly once and resolves its normal CORE Hotspot payout and one-time processing rules. It creates no CountdownMarker and produces no Resources.
6. Refill and recycling operate only on eligible match cards; the three ordered market slots remain unchanged.

## Scope and implementation status

R18 is approved. R19 Supply Chain Disruption receipt limits were subsequently approved in ERRATA-0021-production-receipt-limit.md and R20 component quantities in ERRATA-0022-component-setup.md. The other unresolved DD-0017 decisions remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against these setup exclusions.
