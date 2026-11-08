# ERRATA-0001 — Lobbyist bonus

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, CORE-01-05 Control
Decision: DD-0017, R01 only; approved by the user during the rules review.

## Defect

CORE-01-05-04 did not identify the player receiving a Lobbyist's virtual Influence. Assigning the bonus through control without defining its application to other Lobbyists could also introduce recursive majority dependencies.

## Approved correction

The authoritative correction is incorporated directly in `000-core.md`:

- CORE-01-05-04 assigns each controlled Lobbyist's bonus to its controller on every adjacent Tile except Lobbyists and the Start Committee.
- CORE-01-05-06A excludes virtual Influence from Influence caps and victory scoring.
- CORE-01-05-07 excludes incoming Lobbyist bonuses on Lobbyists. Their control is determined from real markers using the same canonical majority function.
- CORE-01-05-08 makes uncontrolled Lobbyists contribute no bonus, including ties.
- CORE-01-05-09 makes multiple bonuses additive and does not require a real marker on the receiving Tile.

Existing rule IDs are preserved. No resource, production, timing, or expansion rule is changed by this correction.

## Examples for later implementation verification

1. A controls a Lobbyist. An adjacent ResortTile has A=1 and B=1 real Influence. The bonus yields A=2, B=1, so A controls the ResortTile.
2. The receiving ResortTile instead has A=0 and B=1. One A-controlled adjacent Lobbyist yields a 1:1 tie; two yield A=2, B=1.
3. A Lobbyist with A=1 and B=1 real Influence is uncontrolled and contributes no bonus.
4. Adjacent Lobbyists do not change one another's majority. No Lobbyist bonus applies to the Start Committee.
5. Virtual bonuses never create markers, increase the Influence-object total, or increase the final victory score.

## Implementation status

This review step changes normative documentation only. Game code has not yet been adapted or verified against this correction. The remaining DD-0017 findings are not approved by this erratum.
