# EXP-01 — Economy & Labor

Simulation Specification v1.1 (Deterministic)

Requires: CORE-01

---

# SECTION INDEX

EXP-01-00 Scope
EXP-01-01 ECO Resource
EXP-01-02 Components
EXP-01-03 Setup
EXP-01-04 Production
EXP-01-05 System Tile
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

For 2–4 players:
• ECO-W1 ×2
• ECO-W2 ×1
• ECO-W3 ×1

For 5–6 players:
• +ECO-W1 ×1
• +ECO-W2 ×1
• +ECO-W3 ×1

## EXP-01-02-B Printed Production Value

EXP-01-02-B-01 The production value of a ResortTile equals the number printed after “W”.
EXP-01-02-B-02 ECO-W1 = 1.
EXP-01-02-B-03 ECO-W2 = 2.
EXP-01-02-B-04 ECO-W3 = 3.
EXP-01-02-B-05 “Printed production value” refers only to this base value.

## EXP-01-02-C "Labor Market"-Tile

EXP-01-02-C-01 Name: Labor Market
EXP-01-02-C-02 Type: Hotspot Tile
EXP-01-02-C-03 Resolution Trigger: Full enclosure, following CORE Hotspot rules.
EXP-01-02-C-04 Resolution Effect: Majority leader receives exactly 1 Influence marker.
EXP-01-02-C-05 Labor Market produces no Resources.
EXP-01-02-C-06 Labor Market has no additional special rules.

## EXP-01-02-D “Investment Program” System Tile

EXP-01-02-D-01 Add System Tile “Investment Program” ×1.
EXP-01-02-D-02 It is not a Committee, not a Grassroots tile, and not a Hotspot.

## EXP-01-02-E Measure Components

Measure zones:
• MeasureDrawPile
• OpenMeasures (3 face up)
• PlayerHand
• MeasureRecyclePile
• MeasureFinalDiscard

---

# EXP-01-03 SETUP

EXP-01-03-01 Shuffle ECO tiles into DrawPile.
EXP-01-03-02 Shuffle all MeasureCards to form MeasureDrawPile.
EXP-01-03-03 Place exactly 3 face up in OpenMeasures.
EXP-01-03-04 No modification to Starting Influence.
EXP-01-03-05 No modification to Round structure.

---

# EXP-01-04 PRODUCTION RULES

EXP-01-04-01 ECO ResortTiles produce ECO only.
EXP-01-04-02 Production resolves during Round Settlement.
EXP-01-04-03 ECO production follows CORE majority and tie rules.
EXP-01-04-04 Production cannot become negative.

---

# EXP-01-05 SYSTEM TILE — INVESTMENT PROGRAM

EXP-01-05-01 When performing ConvertResources, the controlling player may exchange 2 ECO for 1 Resource of a different resort.
EXP-01-05-02 This exchange is optional.
EXP-01-05-03 This does not create a new Political Action.
EXP-01-05-04 This effect does not stack.

---

# EXP-01-06 POLITICAL ACTION EXTENSION

Political Actions are:

• PlaceOrMoveInfluence
• FormalizeInfluence
• ConvertResources
• TakeMeasure
• PlayMeasure

EXP-01-06-01 A player may perform at most one PlayMeasure per round.
EXP-01-06-02 A player may hold at most 2 Measures.

EXP-01-06-02 TakeMeasure ends the turn immediately.

EXP-01-06-04 When performing PlayMeasure:
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

Timing keywords allowed:
• This turn
• This round
• During this Round Settlement
• Next round
• Until consumed

No other timing windows exist.

---

# EXP-01-08 — MEASURE DEFINITIONS (Numbered, Deterministic)

---

## EXP-01-08-M01 — Budget Compromise

EXP-01-08-M01-01 Name: Budget Compromise
EXP-01-08-M01-02 Cost: DOM + ECO + INF
EXP-01-08-M01-03 Target: One Hotspot Tile in Board
EXP-01-08-M01-04 Duration: This round
EXP-01-08-M01-05 Effect: The targeted Hotspot does not resolve when it would normally resolve during this round.
EXP-01-08-M01-06 Clarification: This prevents the Hotspot’s resolution effect only. It does not remove Influence and does not prevent enclosure.

---

## EXP-01-08-M02 — Economic Stimulus

EXP-01-08-M02-01 Name: Economic Stimulus
EXP-01-08-M02-02 Cost: ECO + FOR
EXP-01-08-M02-03 Target: One ResortTile in Board
EXP-01-08-M02-04 Duration: This Round Settlement
EXP-01-08-M02-05 Effect: During this Round Settlement, double the tile’s printed production value before majority calculation.
EXP-01-08-M02-06 Clarification: Doubling applies to printed value only.
EXP-01-08-M02-07 Clarification: Other modifiers that change production output apply after doubling.
EXP-01-08-M02-08 Constraint: Production cannot become negative.

---

## EXP-01-08-M03 — Collective Bargaining

EXP-01-08-M03-01 Name: Collective Bargaining
EXP-01-08-M03-02 Cost: ECO + ECO
EXP-01-08-M03-03 Duration: This round
EXP-01-08-M03-04 Effect: During this round, ConvertResources may not convert ECO into any other resort.
EXP-01-08-M03-05 Clarification: This restriction applies to ConvertResources only.
EXP-01-08-M03-06 Clarification: This restriction does not affect costs or reclassification effects (e.g., EXP-01-08-M08).

---

## EXP-01-08-M04 — Subsidy Reduction

EXP-01-08-M04-01 Name: Subsidy Reduction
EXP-01-08-M04-02 Cost: ECO + FOR
EXP-01-08-M04-03 Target: One opponent-controlled ECO ResortTile in Board
EXP-01-08-M04-04 Duration: This Round Settlement
EXP-01-08-M04-05 Effect: During this Round Settlement, reduce that tile’s production by 1.
EXP-01-08-M04-06 Floor: Production has a minimum of 0.
EXP-01-08-M04-07 Clarification: This modifies production output only, not printed production value.

---

## EXP-01-08-M05 — Location Debate

EXP-01-08-M05-01 Name: Location Debate
EXP-01-08-M05-02 Cost: ECO + INF
EXP-01-08-M05-03 Target: One ResortTile in Board
EXP-01-08-M05-04 Duration: This Round Settlement
EXP-01-08-M05-05 Effect: During this Round Settlement, reduce that tile’s production by 1.
EXP-01-08-M05-06 Floor: Production has a minimum of 0.
EXP-01-08-M05-07 Clarification: This reduction is applied after any doubling effects.

---

## EXP-01-08-M06 — Budget Deficit

EXP-01-08-M06-01 Name: Budget Deficit
EXP-01-08-M06-02 Cost: ECO + ECO
EXP-01-08-M06-03 Target: One player
EXP-01-08-M06-04 Duration: Until consumed
EXP-01-08-M06-05 Effect: The targeted player’s next Political Action requires +1 additional Resource.
EXP-01-08-M06-06 Payment: The additional Resource may be of any resort.
EXP-01-08-M06-07 Failure: If the additional Resource is not paid, the Action fails and produces no effect.
EXP-01-08-M06-08 Clarification: This additional cost is a separate cost component.
EXP-01-08-M06-09 Consumption: This effect is consumed after that Action attempt, regardless of success.

---

## EXP-01-08-M07 — Debt Brake

EXP-01-08-M07-01 Name: Debt Brake
EXP-01-08-M07-02 Cost: DOM + ECO + ECO
EXP-01-08-M07-03 Duration: Next round
EXP-01-08-M07-04 Effect: During the next round, ConvertResources may not be chosen as a Political Action by any player.
EXP-01-08-M07-05 Clarification: This is a selection restriction, not a cost increase.

---

## EXP-01-08-M08 — Economic Council

EXP-01-08-M08-01 Name: Economic Council
EXP-01-08-M08-02 Cost: ECO + ECO + ECO
EXP-01-08-M08-03 Duration: This round
EXP-01-08-M08-04 Effect: Once this round, when paying a cost that includes ECO, you may treat exactly 1 non-ECO Resource as ECO for that payment.
EXP-01-08-M08-05 Clarification: The reclassified Resource counts as ECO only for that payment.
EXP-01-08-M08-06 Clarification: The Resource retains its original type afterward.
EXP-01-08-M08-07 Clarification: This does not alter “different resorts” requirements beyond that payment.

---

## EXP-01-08-M09 — Investment Freeze

EXP-01-08-M09-01 Name: Investment Freeze
EXP-01-08-M09-02 Cost: ECO + ECO + INF
EXP-01-08-M09-03 Target: One opponent player
EXP-01-08-M09-04 Duration: This turn
EXP-01-08-M09-05 Effect: During the targeted player’s current turn, ignore any Measure effect that would modify a tile’s production value.
EXP-01-08-M09-06 Clarification: This prevents production-value modification effects only; it does not prevent production itself.
EXP-01-08-M09-07 Clarification: This does not ignore cost increases.
EXP-01-08-M09-08 Clarification: This does not prevent Hotspot resolution.

---

## EXP-01-08-M10 — Supplemental Budget

EXP-01-08-M10-01 Name: Supplemental Budget
EXP-01-08-M10-02 Cost: ECO
EXP-01-08-M10-03 Duration: This turn
EXP-01-08-M10-04 Effect: After paying the cost for a Political Action, you may pay 1 additional Resource.
EXP-01-08-M10-05 Effect: If you do, ignore exactly one additional cost component imposed by a Measure or by an Overlay that increases cost for that Action.
EXP-01-08-M10-06 Clarification: This cannot ignore selection restrictions.
EXP-01-08-M10-07 Clarification: This cannot ignore prohibitions.
EXP-01-08-M10-08 Clarification: This cannot ignore production reductions.
EXP-01-08-M10-09 Clarification: This cannot ignore Influence caps.
EXP-01-08-M10-10 Scope: Only cost increases may be ignored.

---

# EXP-01-09 RESTRICTIONS

EXP-01-09-01 ECO does not modify Influence cap.
EXP-01-09-02 ECO does not alter majority calculation.
EXP-01-09-03 Measures do not bypass prohibitions unless explicitly stated.
EXP-01-09-04 Measures do not modify victory conditions.
EXP-01-09-05 No implicit effects exist.

---

# EXP-01-10 RULE INTERACTION

EXP-01-10-01 ECO counts as a valid resort for Formalization.
EXP-01-10-02 ECO may be used for Start Committee formalization.
EXP-01-10-03 If EXP-01 is inactive, ECO and Measure rules do not exist.

---

END OF EXP-01 v1.2
