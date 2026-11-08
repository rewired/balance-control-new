# ERRATA-0010 — Shared Measure framework and global limits

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, EXP-01 v1.3, EXP-02 v1.0, EXP-03 v1.0
Decision: DD-0017, R10; approved by the user during the rules review.

## Defect

EXP-02/EXP-03 referenced EXP-01 Measure procedures without independently enabling the actions. EXP-01-10-03 disabled all Measure rules when EXP-01 was inactive. Limits were not explicitly shared across decks.

## Approved correction

The authoritative correction is incorporated in the existing normative files:

- EXP-01-06-00 through -00B define the shared framework, active whenever any enabled expansion provides a Measure deck. Definitions remain centralized in the existing EXP-01 document, but their common-rule applicability does not depend on EXP-01 activation or a currently nonempty deck.
- EXP-01-06-01/-01A enable the shared actions while keeping card selection and lifecycle transfers within the chosen active expansion's zones.
- EXP-01-06-02/-02A impose one PlayMeasure per player per round across all decks, tracked by one shared flag and reset only at the next round's beginning after Settlement.
- EXP-01-06-03 caps the total hand at two Measures across all active expansions, without merging their hand zones.
- EXP-01-06-05/-05A preserve one additional legal non-PlayMeasure action; choosing TakeMeasure ends the turn after its refill.
- EXP-01-10-03 removes only inactive EXP-01-specific content, not the shared definitions needed by other decks.
- EXP-02-06-01/-07-01 and EXP-03-06-01/-06-02/-07-01 explicitly enable independent use of the shared framework.
- CORE-01-06-00-01(c) covers Political Actions permitted by active expansion rules in the canonical Effect definition.

The common framework introduces no ECO, EXP-01 cards, or EXP-01 zones when that expansion is disabled. If no Measure-deck expansion is active, the common actions, hand zones, and usage flags are absent. Existing rule IDs are preserved.

## Examples for later implementation verification

1. With only EXP-02 active, TakeMeasure and PlayMeasure are available under their ordinary action timing. SEC exists, while ECO and EXP-01 cards/zones do not.
2. With only EXP-03 active, the same framework is available without EXP-01. This does not replace ECO in printed Climate costs; that remains R11.
3. One EXP-01 card and one EXP-03 card fill the player's total hand. A third card cannot be taken from any market until the total permits it.
4. After playing an EXP-03 Measure, the same player cannot play an EXP-01 Measure later in that round. Changing turn or deck does not reset the flag.
5. PlayMeasure may be followed by one otherwise legal TakeMeasure, which refills the chosen market and ends the turn. It cannot be followed by another PlayMeasure.
6. The shared flag resets at the next round's beginning after Settlement; per-card effect usage flags remain separate. No new round is started after a final Settlement under R05.
7. In CORE-only play, no shared Measure actions, hand zones, or usage flags exist.

## Scope and implementation status

No reaction window is added (R13), no failed-play consumption semantics or independent active effect instances are decided (R17), and printed resource dependencies are not replaced (R11).

Only rule documents are changed. Game code has not yet been adapted or verified against the shared activation, total hand limit, or global usage state. Other open DD-0017 proposals remain separate.
