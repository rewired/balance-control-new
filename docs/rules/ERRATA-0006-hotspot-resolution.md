# ERRATA-0006 — One-time Hotspot resolution

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, EXP-01 v1.3, EXP-02 v1.0
Decision: DD-0017, R06; approved by the user during the rules review.

## Defect

CORE-01-06-04 determined majority before pre-majority effects and listed prohibitions after resolving the outcome. The normative rules did not explicitly settle once-only processing or later retry of prevented payouts. Multiple simultaneous enclosures had no specified order.

## Approved correction

The authoritative correction is incorporated in the affected rule files:

- CORE-01-02-09 and CORE-01-06-02A define exactly one first-enclosure event per Hotspot, initially unprocessed.
- CORE-01-06-03 and -03A process triggered events before the Political Action, in ascending ordinal lexicographic order of stable, unique Tile IDs assigned before game start. Each event resolves completely using the then-current state.
- CORE-01-06-04 orders already active pre-majority effects, canonical majority calculation, prohibitions/costs/output checks, and atomic outcome execution. It grants no additional Measure-playing window.
- CORE-01-06-04A consumes the event even if no payout occurs. Event bookkeeping is explicitly separate from the atomic payout; later expiry, removal, or other state changes do not grant a retry.
- CORE-01-06-05 retains the normal one-Influence outcome subject to modifiers and explicit Tile-text overrides. CORE-01-06-06/-07 continue to require a transfer of an available existing Influence object from PersonalSupply.
- EXP-01-08-M01-06 explicitly makes Budget Compromise consume the first-enclosure event without a deferred payout.
- EXP-02-04-C-04 explicitly prevents retry after a Blockade is removed or moved.

Existing rule IDs are preserved. A Hotspot's special printed outcome, such as Inner Order's Regulation operation, remains in effect instead of the normal Influence payout.

## Examples for later implementation verification

1. First enclosure with an eligible sole majority transfers one existing Influence from that player's PersonalSupply. Later Influence movement and Tile placements do not repeat it.
2. A tie on first enclosure consumes the event without a payout; breaking the tie later does not resolve it again.
3. A sole majority with no Influence in PersonalSupply receives none. Acquiring Influence later does not create a retry.
4. Blockade or Budget Compromise prevents the payout, but the event is still processed. Removing the Regulation or expiry of the Measure does not revive it.
5. An explicitly applicable, already active pre-majority effect executes before majority is determined. It does not permit an otherwise unavailable PlayMeasure action.
6. If one placement encloses two Hotspots and their common majority player has one Influence remaining, their fixed Tile-ID order determines which normal payout can use that marker. Majority and resource availability for the second event use the state after the first event.

## Scope and implementation status

This correction does not create the missing Measure windows in R13, decide automatic-effect payers in R15, or define nonnumeric Regulation output semantics in R16. The event-processing record is not an extra payout and does not authorize partial payment for a failed outcome.

Only rule documents are changed. Game code has not yet been adapted or verified against this correction. Other open DD-0017 proposals are not approved by this erratum.
