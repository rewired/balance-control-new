# EXP-01 — Economy & Labor

Simulation Specification (Atomic, Deterministic)
Requires: CORE-01

---

# SECTION INDEX

EXP-01-00 Scope
EXP-01-01 New Resort Definition
EXP-01-02 Components
EXP-01-03 Setup Modifications
EXP-01-04 Production Rules
EXP-01-05 System Tile
EXP-01-06 Measures
EXP-01-07 Restrictions
EXP-01-08 Rule Interaction

---

# EXP-01-00 SCOPE

EXP-01-00-01 EXP-01 extends CORE-01.
EXP-01-00-02 CORE-01 remains valid unless explicitly overridden.
EXP-01-00-03 EXP-01 introduces one additional Resource resort: ECO.
EXP-01-00-04 EXP-01 does not modify victory conditions.
EXP-01-00-05 EXP-01 adds two Political Actions: TakeMeasure and PlayMeasure.

---

# EXP-01-01 NEW RESORT DEFINITION

EXP-01-01-01 EXP-01 defines exactly one additional Resource resort: ECO.
EXP-01-01-02 ECO stands for Economy.
EXP-01-01-03 ECO represents economic output and cost leverage within this simulation.
EXP-01-01-04 ECO is a valid Resource type.
EXP-01-01-05 A Resource with resort ECO behaves identically to DOM, FOR, and INF unless explicitly modified.
EXP-01-01-06 ECO Resources may be used wherever a rule requires “a Resource” unless restricted by tile text.
EXP-01-01-07 ECO counts as a distinct Resource type for all “different resorts” requirements.
EXP-01-01-08 ECO exists only while EXP-01 is active.

---

# EXP-01-02 COMPONENTS

EXP-01-02-01 EXP-01 adds additional Tiles to DrawPile.
EXP-01-02-02 EXP-01 adds ECO ResortTiles to DrawPile.
EXP-01-02-03 EXP-01 adds one Hotspot Tile (“Labor Market”) to DrawPile.
EXP-01-02-04 EXP-01 adds one System Tile (“Investment Program”) to DrawPile.

## ECO ResortTiles — Counts by Player Count

EXP-01-02-05 For 2–4 players, add the following ECO ResortTiles to DrawPile:

* ECO-W1 ×2
* ECO-W2 ×1
* ECO-W3 ×1

EXP-01-02-06 For 5–6 players, additionally add the following ECO ResortTiles to DrawPile:

* ECO-W1 ×1
* ECO-W2 ×1
* ECO-W3 ×1

EXP-01-02-07 ECO ResortTiles have printed production values (W-number).
EXP-01-02-08 ECO ResortTiles produce ECO Resources only.
EXP-01-02-09 ECO production follows CORE-01-06 production rules.

## Hotspot Tile

EXP-01-02-10 Add Hotspot “Labor Market” ×1 to DrawPile.
EXP-01-02-11 Labor Market resolves identically to CORE Hotspot rules.
EXP-01-02-12 Labor Market produces no Resources.

## System Tile

EXP-01-02-13 Add System Tile “Investment Program” ×1 to DrawPile.
EXP-01-02-14 Investment Program is not a Committee, not a Grassroots tile, and not a Hotspot.

## Measure System Components

EXP-01-02-15 EXP-01 introduces MeasureCards.
EXP-01-02-16 MeasureCards exist in the following zones:

* MeasureDrawPile
* OpenMeasures
* PlayerHand
* MeasureRecyclePile
* MeasureFinalDiscard

EXP-01-02-17 ECO Resources exist in the same zones as other Resources: PersonalSupply, Bank, Noise.

---

# EXP-01-03 SETUP MODIFICATIONS

EXP-01-03-01 During Setup, ECO ResortTiles are shuffled into DrawPile.
EXP-01-03-02 Shuffle all MeasureCards to form MeasureDrawPile.
EXP-01-03-03 Place exactly three MeasureCards face up in OpenMeasures.
EXP-01-03-04 No modification to Starting Influence.
EXP-01-03-05 No modification to Turn Structure.

---

# EXP-01-04 PRODUCTION RULES

EXP-01-04-01 ECO ResortTiles produce ECO Resources only.
EXP-01-04-02 ECO production is resolved during Round Settlement.
EXP-01-04-03 ECO production follows CORE-01-06-11 through CORE-01-06-15.
EXP-01-04-04 ECO production may be modified by Measures.
EXP-01-04-05 ECO production cannot become negative.

---

# EXP-01-05 SYSTEM TILE: Investment Program

EXP-01-05-01 Investment Program is a System Tile placed on Board.
EXP-01-05-02 Investment Program does not create a new action type.
EXP-01-05-03 When performing ConvertResources, the controlling player may additionally exchange 2 ECO for 1 Resource of a different resort.
EXP-01-05-04 This exchange is optional.
EXP-01-05-05 This exchange is executed as part of the ConvertResources resolution.
EXP-01-05-06 This effect applies only while the player controls Investment Program.
EXP-01-05-07 This effect does not stack with itself.

---

# EXP-01-06 MEASURES

## Political Action Extension

EXP-01-06-01 ExactlyOnePoliticalAction in CORE-01-04-09 is extended to include:
PlaceOrMoveInfluence,
FormalizeInfluence,
ConvertResources,
TakeMeasure,
PlayMeasure.

---

## Taking a Measure (Political Action)

EXP-01-06-02 TakeMeasure moves exactly one Measure from OpenMeasures to PlayerHand.
EXP-01-06-03 A player may hold at most 2 MeasureCards.
EXP-01-06-04 After a Measure is taken, immediately refill OpenMeasures to three from MeasureDrawPile.
EXP-01-06-05 If MeasureDrawPile is empty, refill it from MeasureRecyclePile and shuffle.
EXP-01-06-06 If both MeasureDrawPile and MeasureRecyclePile are empty, OpenMeasures is not refilled.

---

## Playing a Measure (Political Action)

EXP-01-06-07 PlayMeasure selects one Measure from PlayerHand.
EXP-01-06-08 The Measure cost must be fully paid.
EXP-01-06-09 Paid Resources move to Bank.
EXP-01-06-10 The Measure effect resolves immediately unless otherwise specified.
EXP-01-06-11 After resolution, increment that Measure’s play counter by 1.

EXP-01-06-12 If the Measure has been played exactly once in this game, move it to MeasureRecyclePile.
EXP-01-06-13 If the Measure has been played exactly twice in this game, move it to MeasureFinalDiscard.
EXP-01-06-14 A Measure in MeasureFinalDiscard cannot re-enter MeasureDrawPile.
EXP-01-06-15 A Measure may resolve at most twice per game.

---

## Recycling Rule

EXP-01-06-16 When MeasureDrawPile is empty and at least one card exists in MeasureRecyclePile, shuffle MeasureRecyclePile to form a new MeasureDrawPile.
EXP-01-06-17 Recycling does not reset play counters.

---

## Round Restriction

EXP-01-06-18 A player may perform at most one PlayMeasure per round.
EXP-01-06-19 TakeMeasure does not count toward the PlayMeasure per-round limit.

---

## Measure Definitions

### Measure 01 — Budget Compromise

EXP-01-06-M01-01 Cost: DOM + ECO + INF.
EXP-01-06-M01-02 Target: One Hotspot Tile in Board.
EXP-01-06-M01-03 Duration: This round.
EXP-01-06-M01-04 Effect: The targeted Hotspot does not resolve when it would resolve during this round.

### Measure 02 — Economic Stimulus

EXP-01-06-M02-01 Cost: ECO + FOR.
EXP-01-06-M02-02 Target: One ResortTile in Board.
EXP-01-06-M02-03 Duration: This Round Settlement.
EXP-01-06-M02-04 Effect: During this Round Settlement, that tile produces double its printed production value.
EXP-01-06-M02-05 Minimum: Production cannot be negative.

### Measure 03 — Collective Bargaining

EXP-01-06-M03-01 Cost: ECO + ECO.
EXP-01-06-M03-02 Duration: This round.
EXP-01-06-M03-03 Effect: During this round, ConvertResources may not convert ECO into any other resort.

### Measure 04 — Subsidy Reduction

EXP-01-06-M04-01 Cost: ECO + FOR.
EXP-01-06-M04-02 Target: One opponent-controlled ECO ResortTile in Board.
EXP-01-06-M04-03 Duration: Permanent.
EXP-01-06-M04-04 Effect: Reduce the targeted tile’s printed production value by 1.
EXP-01-06-M04-05 Floor: Printed production value has a minimum of 0.

### Measure 05 — Location Debate

EXP-01-06-M05-01 Cost: ECO + INF.
EXP-01-06-M05-02 Target: One ResortTile in Board.
EXP-01-06-M05-03 Duration: This Round Settlement.
EXP-01-06-M05-04 Effect: During this Round Settlement, reduce that tile’s production by 1.
EXP-01-06-M05-05 Floor: Production has a minimum of 0.

### Measure 06 — Budget Deficit

EXP-01-06-M06-01 Cost: ECO + ECO.
EXP-01-06-M06-02 Target: One player.
EXP-01-06-M06-03 Duration: Until consumed.
EXP-01-06-M06-04 Effect: The targeted player’s next Political Action costs +1 additional Resource.
EXP-01-06-M06-05 Payment: The additional Resource may be of any resort.
EXP-01-06-M06-06 If the targeted player cannot pay the additional Resource, that Political Action fails with no state change.
EXP-01-06-M06-07 After a Political Action attempt by the targeted player (success or fail), this effect is consumed.

### Measure 07 — Debt Brake

EXP-01-06-M07-01 Cost: DOM + ECO + ECO.
EXP-01-06-M07-02 Duration: Next round.
EXP-01-06-M07-03 Effect: During the next round, ConvertResources may not be chosen as the Political Action by any player.

### Measure 08 — Economic Council

EXP-01-06-M08-01 Cost: ECO + ECO + ECO.
EXP-01-06-M08-02 Owner: The player who played this Measure.
EXP-01-06-M08-03 Duration: This round.
EXP-01-06-M08-04 Effect: Once during this round, when paying a cost that includes at least 1 ECO, the owner may replace exactly 1 required ECO with exactly 2 Resources of different non-ECO resorts.
EXP-01-06-M08-05 Restriction: The two replacement Resources must be of different resorts.
EXP-01-06-M08-06 Restriction: Neither replacement Resource may be ECO.
EXP-01-06-M08-07 After the replacement is used once, it cannot be used again this round.

### Measure 09 — Investment Freeze

EXP-01-06-M09-01 Cost: ECO + ECO + INF.
EXP-01-06-M09-02 Target: One opponent player.
EXP-01-06-M09-03 Duration: This turn.
EXP-01-06-M09-04 Effect: During the targeted player’s current turn, any effect that would modify a tile’s production value does not apply.
EXP-01-06-M09-05 Note: This prevents production-value modification effects only; it does not prevent resource production itself.

### Measure 10 — Supplemental Budget

EXP-01-06-M10-01 Cost: ECO.
EXP-01-06-M10-02 Duration: This turn.
EXP-01-06-M10-03 Trigger: After the player pays the cost for a Political Action.
EXP-01-06-M10-04 Optional Additional Payment: The player may pay 1 additional Resource of any resort.
EXP-01-06-M10-05 Effect: If the chosen Political Action would otherwise be partially resolved due to a limitation, resolve it fully instead.

---

# EXP-01-07 RESTRICTIONS

EXP-01-06-01 ECO does not modify Influence cap (CORE-01-08-01).
EXP-01-06-02 ECO does not alter Control calculation.
EXP-01-06-03 ECO does not alter Lobbyist behavior.
EXP-01-06-04 ECO does not alter Hotspot resolution.
EXP-01-06-05 No Measure modifies victory condition.
EXP-01-06-06 No Measure creates implicit effects.

---

# EXP-01-08 RULE INTERACTION

EXP-01-07-01 When calculating “different resorts,” ECO is included.
EXP-01-07-02 FormalizeInfluence may use ECO as part of its cost.
EXP-01-07-03 Start Committee formalization may include ECO among the required 3 different resorts.
EXP-01-07-04 If EXP-01 is inactive, ECO and all Measure rules do not exist.

---
