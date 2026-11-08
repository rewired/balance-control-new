# ERRATA-0012 — Future Measure triggers

Date: 2026-11-07
Status: Accepted
Applies to: EXP-01 v1.3 and EXP-02 v1.0
Decision: DD-0017, R13; approved by the user during the rules review.

## Defect

Emergency Decree and Deployment Order had no normally reachable trigger after being played in the Political Action phase with duration This turn. Investment Freeze targeted an opponent's current turn even though that opponent was not active, while production occurred later in Settlement.

## Approved correction

The authoritative correction is incorporated in `001-expansion01.md` and `002-expansion02.md`:

- EXP-02-07-01B registers future effects through ordinary PlayMeasure, then proceeds with card lifecycle and the one granted additional action. Later triggering is not a new card play or Political Action.
- EXP-02-08-M02-02 through -05 make Emergency Decree wait until the chosen unprocessed, unenclosed Hotspot's first enclosure. Before majority calculation, its owner attempts Blockade placement and pays normal placement costs at that time. Failure places nothing and pays no placement cost, but consumes the pending effect without refund of the original card cost.
- EXP-02-08-M03-02 through -04 make Deployment Order wait until its owner's next successful Regulation placement, then offer one immediate legal movement of that Regulation. It is consumed even if declined or movement cannot resolve. A failed follow-up never rolls back the already successful placement.
- EXP-01-08-M09-04 through -07 make Investment Freeze affect the next Settlement, including a final one. It ignores positive and negative Measure modifiers to printed value, doubling, and Tile output on ResortTiles controlled by the chosen opponent at production time.
- Tied Tiles are not controlled and therefore are not affected by Investment Freeze. Regulation modifiers remain applicable; receiving-player caps are not reclassified as Tile-output modifiers.

The three printed card prices are unchanged. No reaction window for playing additional cards from hand is created. Existing rule IDs are preserved. This erratum addresses R13; R12 already follows from ERRATA-0002 and has no separate erratum.

## Examples for later implementation verification

1. Emergency Decree played in Phase 2 can react to its selected Hotspot being enclosed by a later player's Tile placement. Only the previously registered effect triggers.
2. Its normal printed card cost is 2 SEC at play; an unmodified Blockade placement costs another 2 SEC when triggered. If that later placement cannot be paid, the effect is consumed without placing Blockade or refunding the earlier card payment.
3. Deployment Order can wait across rounds for an own placement through Inner Order. Its optional follow-up uses the same Regulation and ordinary movement restrictions; no extra Political Action is spent or granted.
4. Declining or failing that movement consumes Deployment Order but leaves the original placement and its paid costs intact.
5. At the next Settlement, Investment Freeze can ignore Economic Stimulus on a ResortTile then controlled by the target opponent. A tied Tile is unaffected; applicable SecurityLevel Regulations still modify production.
6. Registering these effects consumes the ordinary play under the shared per-round limit. Their later execution is not another PlayMeasure; the normal one-action follow-up occurs when initially playing the card.

## Scope and implementation status

This correction defines the three cards' triggers and consumption exceptions. It does not resolve generic active-instance storage and simultaneous-effect ordering (R17), all automatic-effect payer rules (R15), or Regulation output semantics (R16).

Only rule documents are changed. Game code has not yet been adapted or verified against these card changes. Other open DD-0017 proposals remain separate.
