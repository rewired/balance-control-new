# EXP-01 — Economy & Labor

Fully Engine-Formalized Specification v1.3
Requires: CORE-01 (v1.0.14)

---

# SECTION INDEX

EXP-01-00 Scope
EXP-01-01 ECO Resource
EXP-01-02 Components & Definitions
EXP-01-03 Setup
EXP-01-04 Round & Production Model
EXP-01-05 System Tile — Investment Program
EXP-01-06 Political Action Extension
EXP-01-07 Measure System
EXP-01-08 Measure Definitions
EXP-01-09 Restrictions
EXP-01-10 Rule Interaction

---

# EXP-01-00 SCOPE

EXP-01-00-01 EXP-01 extends CORE-01.
EXP-01-00-02 CORE-01 remains valid unless explicitly overridden.
EXP-01-00-03 EXP-01 introduces the Resource type ECO.
EXP-01-00-04 Victory conditions remain unchanged.
EXP-01-00-05 EXP-01 modifies Political Action timing for PlayMeasure.

---

# EXP-01-01 ECO RESOURCE

EXP-01-01-01 ECO is a Resource type.
EXP-01-01-02 ECO represents Economy.
EXP-01-01-03 ECO behaves identically to DOM, FOR, INF unless explicitly modified.
EXP-01-01-04 ECO counts as a distinct resort for all “different resorts” requirements.
EXP-01-01-05 ECO may be used wherever “a Resource” is required.
EXP-01-01-06 ECO exists only while EXP-01 is active.

---

# EXP-01-02 COMPONENTS & DEFINITIONS

## EXP-01-02-A ECO ResortTiles

EXP-01-02-A-01 For 2–4 players add:
• ECO-W1 ×2
• ECO-W2 ×1
• ECO-W3 ×1

EXP-01-02-A-02 For 5–6 players additionally add:
• ECO-W1 ×1
• ECO-W2 ×1
• ECO-W3 ×1

## EXP-01-02-B Printed Production Value

EXP-01-02-B-01 The production value of a ResortTile equals the number printed after “W”.
EXP-01-02-B-02 ECO-W1 = 1.
EXP-01-02-B-03 ECO-W2 = 2.
EXP-01-02-B-04 ECO-W3 = 3.
EXP-01-02-B-05 “Printed production value” refers exclusively to this base value.

## EXP-01-02-C Labor Market

EXP-01-02-C-01 Name: Labor Market.
EXP-01-02-C-02 Type: Hotspot Tile.
EXP-01-02-C-03 Resolution Trigger: Full enclosure, following CORE Hotspot rules.
EXP-01-02-C-04 Resolution Effect: Majority leader receives exactly 1 Influence marker.
EXP-01-02-C-05 Labor Market produces no Resources.
EXP-01-02-C-06 Labor Market has no additional special rules.
EXP-01-02-C-07 Tile text: “When fully surrounded: if you have majority, gain 1 Influence.”

## EXP-01-02-D Investment Program

EXP-01-02-D-01 Add System Tile “Investment Program” ×1.
EXP-01-02-D-02 It is not a Committee, not a Grassroots tile, and not a Hotspot.

## EXP-01-02-E Measure Components

EXP-01-02-E-01 Measure zones are:
• MeasureDrawPile
• OpenMeasures (3 face up)
• PlayerHand
• MeasureRecyclePile
• MeasureFinalDiscard

---

# EXP-01-03 SETUP

EXP-01-03-01 Shuffle ECO ResortTiles into DrawPile.
EXP-01-03-02 Shuffle all MeasureCards to form MeasureDrawPile.
EXP-01-03-03 Place exactly 3 Measures face up in OpenMeasures.
EXP-01-03-04 No modification to Starting Influence.
EXP-01-03-05 No modification to Round structure.

---

# EXP-01-04 ROUND & PRODUCTION MODEL

## EXP-01-04-A Round Definition

EXP-01-04-A-01 A round consists of one full cycle of player turns followed by Round Settlement.
EXP-01-04-A-02 “This round” refers to the current round until the next Round Settlement begins.
EXP-01-04-A-03 “Next round” refers to the round immediately following the next Round Settlement.

## EXP-01-04-B Production Resolution Order

EXP-01-04-B-01 Start with the printed production value.
EXP-01-04-B-02 Apply doubling effects.
EXP-01-04-B-03 Apply production output modifiers (reductions or increases).
EXP-01-04-B-04 Apply floors (minimum 0).
EXP-01-04-B-05 Evaluate majority and tie rules.

EXP-01-04-B-06 ECO production follows CORE majority and tie rules.

---

# EXP-01-05 SYSTEM TILE — INVESTMENT PROGRAM

EXP-01-05-01 When performing ConvertResources, the controlling player may exchange 2 ECO for 1 Resource of a different resort.
EXP-01-05-02 This exchange is optional.
EXP-01-05-03 This does not create a new Political Action.
EXP-01-05-04 This effect does not stack.

---

# EXP-01-06 POLITICAL ACTION EXTENSION

EXP-01-06-01 Political Actions are:
• PlaceOrMoveInfluence
• FormalizeInfluence
• ConvertResources
• TakeMeasure
• PlayMeasure

EXP-01-06-02 A player may perform at most one PlayMeasure per round.
EXP-01-06-03 A player may hold at most 2 Measures.
EXP-01-06-04 TakeMeasure ends the turn immediately.

EXP-01-06-05 When performing PlayMeasure:
(a) Resolve the Measure completely.
(b) After resolution, perform exactly one additional Political Action.
(c) The additional action may not be PlayMeasure.
(d) The additional action does not grant further additional actions.

---

# EXP-01-07 MEASURE SYSTEM

EXP-01-07-01 When a Measure is played, increment its play counter.
EXP-01-07-02 After first play → move to MeasureRecyclePile.
EXP-01-07-03 After second play → move to MeasureFinalDiscard.
EXP-01-07-04 Measures in FinalDiscard never return.
EXP-01-07-05 If MeasureDrawPile is empty, shuffle MeasureRecyclePile.

EXP-01-07-06 Timing keywords allowed:
• This turn
• This round
• During this Round Settlement
• Next round
• Until consumed

EXP-01-07-07 No other timing windows exist.

---

# EXP-01-08 MEASURE DEFINITIONS

## EXP-01-08-M01 — Budget Compromise

EXP-01-08-M01-01 Name: Budget Compromise.
EXP-01-08-M01-02 Cost: DOM + ECO + INF.
EXP-01-08-M01-03 Target: One Hotspot Tile in Board.
EXP-01-08-M01-04 Duration: This round.
EXP-01-08-M01-05 Effect: The targeted Hotspot does not resolve when it would normally resolve during this round.

---

## EXP-01-08-M02 — Economic Stimulus

EXP-01-08-M02-01 Name: Economic Stimulus.
EXP-01-08-M02-02 Cost: ECO + FOR.
EXP-01-08-M02-03 Target: One ResortTile in Board.
EXP-01-08-M02-04 Duration: During this Round Settlement.
EXP-01-08-M02-05 Effect: During this Round Settlement, double the tile’s printed production value before majority calculation.

---

## EXP-01-08-M03 — Collective Bargaining

EXP-01-08-M03-01 Name: Collective Bargaining.
EXP-01-08-M03-02 Cost: ECO + ECO.
EXP-01-08-M03-03 Duration: This round.
EXP-01-08-M03-04 Effect: During this round, ConvertResources may not convert ECO into any other resort.

---

## EXP-01-08-M04 — Subsidy Reduction

EXP-01-08-M04-01 Name: Subsidy Reduction.
EXP-01-08-M04-02 Cost: ECO + FOR.
EXP-01-08-M04-03 Target: One opponent-controlled ECO ResortTile in Board.
EXP-01-08-M04-04 Duration: During this Round Settlement.
EXP-01-08-M04-05 Effect: During this Round Settlement, reduce that tile’s production by 1 (minimum 0).

---

## EXP-01-08-M05 — Location Debate

EXP-01-08-M05-01 Name: Location Debate.
EXP-01-08-M05-02 Cost: ECO + INF.
EXP-01-08-M05-03 Target: One ResortTile in Board.
EXP-01-08-M05-04 Duration: During this Round Settlement.
EXP-01-08-M05-05 Effect: During this Round Settlement, reduce that tile’s production by 1 (minimum 0).

---

## EXP-01-08-M06 — Budget Deficit

EXP-01-08-M06-01 Name: Budget Deficit.
EXP-01-08-M06-02 Cost: ECO + ECO.
EXP-01-08-M06-03 Target: One player.
EXP-01-08-M06-04 Duration: Until consumed.
EXP-01-08-M06-05 Effect: The targeted player’s next Political Action requires +1 additional Resource.
EXP-01-08-M06-06 If unpaid, the Action fails and produces no effect.
EXP-01-08-M06-07 The effect is consumed after that Action attempt.

---

## EXP-01-08-M07 — Debt Brake

EXP-01-08-M07-01 Name: Debt Brake.
EXP-01-08-M07-02 Cost: DOM + ECO + ECO.
EXP-01-08-M07-03 Duration: Next round.
EXP-01-08-M07-04 Effect: During the next round, ConvertResources may not be chosen as a Political Action by any player.

---

## EXP-01-08-M08 — Economic Council

EXP-01-08-M08-01 Name: Economic Council.
EXP-01-08-M08-02 Cost: ECO + ECO + ECO.
EXP-01-08-M08-03 Duration: This round.
EXP-01-08-M08-04 Effect: Once this round, when paying a cost that includes ECO, you may treat exactly 1 non-ECO Resource as ECO for that payment.

---

## EXP-01-08-M09 — Investment Freeze

EXP-01-08-M09-01 Name: Investment Freeze.
EXP-01-08-M09-02 Cost: ECO + ECO + INF.
EXP-01-08-M09-03 Target: One opponent player.
EXP-01-08-M09-04 Duration: This turn.
EXP-01-08-M09-05 Effect: During the targeted player’s current turn, ignore Measure effects that modify production output or printed production value.

---

## EXP-01-08-M10 — Supplemental Budget

EXP-01-08-M10-01 Name: Supplemental Budget.
EXP-01-08-M10-02 Cost: ECO.
EXP-01-08-M10-03 Duration: This turn.
EXP-01-08-M10-04 Effect: After paying the cost for a Political Action, you may pay 1 additional Resource.
EXP-01-08-M10-05 If you do, ignore exactly one additional cost component imposed by a Measure or by a cost-increasing Overlay for that Action.

---

# EXP-01-09 RESTRICTIONS

EXP-01-09-01 ECO does not modify Influence cap.
EXP-01-09-02 ECO does not alter majority calculation.
EXP-01-09-03 Measures do not bypass prohibitions unless explicitly stated.
EXP-01-09-04 Measures do not modify victory conditions.
EXP-01-09-05 No implicit effects exist.

---

# EXP-01-10 RULE INTERACTION

EXP-01-10-01 ECO counts as valid for Formalization.
EXP-01-10-02 ECO may be used for Start Committee formalization.
EXP-01-10-03 If EXP-01 is inactive, ECO and Measure rules do not exist.

---

END OF EXP-01 v1.3
