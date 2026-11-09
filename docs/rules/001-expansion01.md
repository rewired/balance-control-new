# EXP-01 — Economy & Labor

Fully Engine-Formalized Specification v1.3
Requires: CORE-01 (v1.0.14)
Applied errata: ERRATA-0006 (2026-11-07, one-time Hotspot resolution).
Applied errata: ERRATA-0009 (2026-11-07, Measure acquisition and market refill).
Applied errata: ERRATA-0010 (2026-11-07, shared Measure framework).
Applied errata: ERRATA-0012 (2026-11-07, future Measure triggers).
Applied errata: ERRATA-0014 (2026-11-07, effect costs and payers).
Applied errata: ERRATA-0033 (2026-11-09, neutral Grassroots and conversion-assisted formalization).

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
EXP-01-02-C-08 Add exactly one Labor Market to DrawPile for both 2–4 and 5–6 players. The 5–6 setup adds no further copy.

## EXP-01-02-D Investment Program

EXP-01-02-D-01 Add System Tile “Investment Program” ×1 to DrawPile for both 2–4 and 5–6 players. The 5–6 setup adds no further copy.
EXP-01-02-D-02 It is not a Committee, not a Grassroots tile, and not a Hotspot.

## EXP-01-02-E Measure Components

EXP-01-02-E-01 Measure zones are:
• MeasureDrawPile
• OpenMeasures (3 ordered slots, holding up to 3 face-up Measures)
• PlayerHand
• MeasureRecyclePile
• MeasureFinalDiscard

EXP-01-02-E-01A These Measure zones exist as an EXP-01-specific instance.
They do not contain Measures from any other expansions.
EXP-01-02-E-01B OpenMeasures slots have fixed order 1, 2, 3. Setup fills them in that order from the top of the expansion's MeasureDrawPile. Removing a card leaves its slot vacant until refill.

---

# EXP-01-03 SETUP

EXP-01-03-01 Shuffle the ECO ResortTiles for the player count, exactly one Labor Market, and exactly one Investment Program into the Tile DrawPile under EXP-01-03-07.
EXP-01-03-02 Shuffle all MeasureCards to form MeasureDrawPile.
EXP-01-03-03 Place exactly 3 Measures face up in OpenMeasures.
EXP-01-03-04 No modification to Starting Influence.
EXP-01-03-05 No modification to Round structure.
EXP-01-03-06 Every Measure's play counter starts at 0. All PlayerHands start empty; cards are initially distributed only between MeasureDrawPile and OpenMeasures by setup.
EXP-01-03-07 With EXP-01 active, its Tile contribution is six Tiles for 2–4 players: ECO-W1×2, ECO-W2×1, ECO-W3×1, Labor Market×1, and Investment Program×1. For 5–6, additionally include one ECO-W1, one ECO-W2, and one ECO-W3, for nine Tiles in total; the two special Tiles still occur once each. Component descriptions and setup refer to these same physical Tiles, not extra copies. MeasureCards use their separate Measure zones and are not included in the Tile DrawPile. With EXP-01 inactive, none of these EXP-01 Tiles is included.

---

# EXP-01-04 ROUND & PRODUCTION MODEL

## EXP-01-04-A Round Definition

EXP-01-04-A-01 Use the shared round structure in CORE-01-07, including Settlement and the shortened final round.
EXP-01-04-A-02 This round follows CORE-01-07-10 and includes the complete current Settlement.
EXP-01-04-A-03 Next round follows CORE-01-07-12, beginning only with the actual next round and including its Settlement.

## EXP-01-04-B Production Resolution Order

EXP-01-04-B-01 Production during Round Settlement follows CORE-01-06-16 (Production Resolution Order).
EXP-01-04-B-02 For EXP-01, “doubling effects” refers to any Measure that doubles printed production value (e.g., Economic Stimulus).
EXP-01-04-B-03 EXP-01 production reductions and increases are additive output modifiers in CORE-01-06-16(a)(3), combined with all other applicable additive production modifiers before the single floor in (a)(4). Doubling remains in (a)(2); source-specific exclusions such as Investment Freeze remain applicable.

---

# EXP-01-05 SYSTEM TILE — INVESTMENT PROGRAM

EXP-01-05-01 When performing ConvertResources, the active player may exchange 2 ECO for 1 Resource of a different active resort if they control both the chosen Grassroots and Investment Program under CORE-01-05-03A/-03B. This option is available for both standalone and conversion-assisted actions.
EXP-01-05-02 This exchange is optional and replaces the ordinary 3:1 exchange for that action. The player may instead choose the ordinary legal Grassroots exchange under CORE-01-04-21A/-22A.
EXP-01-05-03 This option grants no new Political Action, additional exchange, or separate Investment Program activation.
EXP-01-05-04 Perform exactly one of the two exchange options per action. The option does not stack and permits neither repetition nor chaining within that action.
EXP-01-05-05 Canonical control, including virtual-only control under CORE-01-05-03B, is sufficient for both Investment Program and the chosen Grassroots. The Tiles need not be adjacent. An exchange at a neutral Grassroots uses the ordinary rate.
EXP-01-05-06 ContextTile is exclusively the chosen Grassroots. Apply its prohibitions, cost modifiers, and output modifiers once under the canonical resolver. Investment Program supplies only the eligibility condition and is not a second execution Tile; its Tile-local modifiers are not evaluated for this exchange. A Blockade on Investment Program alone does not disable this passive option; a Blockade on the chosen Grassroots prevents the exchange.
EXP-01-05-07 The 2 ECO replace only the ordinary three-Resource base payment. Add all applicable additional costs. Pay from the active player's PersonalSupply to Bank and transfer the output from Bank to that PersonalSupply atomically under CORE-01-06-00-10/-11. Any different active resort is a permitted output; ECO itself and inactive resorts are not.
EXP-01-05-08 Applicable output modifiers at the Grassroots affect this alternative normally. If SecurityLevel reduces output 1 to 0, an otherwise legal fully paid standalone exchange still succeeds under EXP-02-04-B-05. Conversion-assisted FormalizeInfluence requires a positive exchange output under CORE-01-04-19B.

---

# EXP-01-06 POLITICAL ACTION EXTENSION

EXP-01-06-00 Shared Measure Framework
The structural definitions in EXP-01-02-E-01/-01B, counter initialization in EXP-01-03-06, action rules in EXP-01-06, and lifecycle rules in EXP-01-07 define the shared Measure framework. It is active whenever at least one enabled expansion provides a Measure deck, including EXP-02 or EXP-03 without EXP-01. An exhausted deck or market does not disable the framework. These definitions remain applicable as shared rules regardless of EXP-01 activation.
EXP-01-06-00A Each active expansion has its own Measure zones and cards. Applying shared definitions does not activate another expansion's Resource resorts, components, cards, or zones. Shared player-wide usage state belongs to the shared framework, not to a disabled expansion.
EXP-01-06-00B If no expansion providing a Measure deck is active, TakeMeasure, PlayMeasure, Measure hand zones, and shared Measure usage flags do not exist in the match.

EXP-01-06-01 Political Actions are:
• PlaceOrMoveInfluence
• FormalizeInfluence
• ConvertResources
• TakeMeasure
• PlayMeasure

EXP-01-06-01A TakeMeasure and PlayMeasure select cards from one chosen active expansion. Card selection and lifecycle transfers use only that expansion's Measure zones. A Measure taken from one expansion cannot be played as a Measure of another expansion.

EXP-01-06-02 A player may perform at most one PlayMeasure per round in total across all active expansions. Choosing another expansion does not grant another use.
EXP-01-06-02A Track one shared playedMeasureThisRound flag per player, initially false when the shared framework is set up. Set it when that player plays a Measure under EXP-01-07-01. Reset it only at the beginning of the next round, after Round Settlement has ended. It is independent of any per-Measure effect usage flags.
EXP-01-06-03 A player may hold at most 2 Measures in total across all active expansions. Count the sum of that player's separate expansion-specific PlayerHand zones; the zones themselves remain separate.
EXP-01-06-04 A successful TakeMeasure ends the turn immediately after its card transfer and mandatory market refill have completed.
EXP-01-06-04A TakeMeasure selects exactly one occupied OpenMeasures slot of the chosen active expansion and transfers that Measure into the active player's PlayerHand for the same expansion. The applicable hand limit must remain satisfied.
EXP-01-06-04B TakeMeasure cannot be chosen when that market has no face-up Measure or when taking the card would exceed the applicable hand limit.
EXP-01-06-04C TakeMeasure has a base Resource cost of 0. Any explicitly applicable prohibition or additional cost must be resolved before the card transfer; if it prevents the action, no card is taken and no refill is triggered by that failed action.
EXP-01-06-04D After a successful transfer, immediately refill only that expansion's OpenMeasures under EXP-01-07-05 through -05D, then end the turn under EXP-01-06-04.

EXP-01-06-05 When performing PlayMeasure:
(a) Resolve the Measure completely.
(b) After resolution, perform exactly one additional Political Action, subject to mandatory completion without an action under CORE-01-04-09A through -09C if no legal option exists.
(c) The additional action may not be PlayMeasure.
(d) The additional action does not grant further additional actions.
EXP-01-06-05A The additional action may be any otherwise legal, enabled Political Action except PlayMeasure. If it is TakeMeasure, finish its transfer and refill and then end the turn. No choice of expansion bypasses the shared per-round limit or grants another additional action.
EXP-01-06-05B PlayMeasure uses the cost-resolution boundaries in CORE-01-06-00-07 through -09: an immediate contained Regulation placement shares the card's cost basis, while an explicitly later operation and the granted additional Political Action each have their own resolution. Granting an additional action does not waive that action's costs.
EXP-01-06-05C Apply CORE-01-04-09A through -09C to the additional non-PlayMeasure slot after the Measure's immediate resolution and mandatory market refill. If no legal option exists, completing that slot does not undo the successful Measure or its shared per-round PlayMeasure usage.
EXP-01-06-05D For a Measure with a continuing or future effect, complete its immediate instructions and register its effect instance under EXP-01-07-08 through -13. This completes its immediate resolution; do not wait for the registered effect to expire or trigger before completing card lifecycle, market refill, and the additional action. An immediate-only effect does not require a pending effect instance.

---

# EXP-01-07 MEASURE SYSTEM

EXP-01-07-01 When a Measure is played, increment its play counter.
EXP-01-07-02 After first play → move to MeasureRecyclePile.
EXP-01-07-03 After second play → move to MeasureFinalDiscard.
EXP-01-07-04 Measures in FinalDiscard never return.
EXP-01-07-05 When a card is needed for market refill and that expansion's MeasureDrawPile is empty, transfer the entire MeasureRecyclePile into MeasureDrawPile and shuffle it deterministically using the match's seeded random state, provided Recycle is nonempty. Do not use MeasureFinalDiscard.
EXP-01-07-05A Refill the affected expansion's market immediately after a successful TakeMeasure and after a played Measure has reached its prescribed MeasureRecyclePile or MeasureFinalDiscard. Complete refill before the turn ends or any granted additional Political Action begins.
EXP-01-07-05B Refill vacant OpenMeasures slots in ascending slot order, one card at a time from the top of the corresponding MeasureDrawPile, invoking EXP-01-07-05 when necessary, until all three slots are occupied or no card is available.
EXP-01-07-05C If both MeasureDrawPile and MeasureRecyclePile are empty, stop refill and leave remaining slots vacant. Fewer than three face-up Measures are allowed in this exhausted-market case. TakeMeasure remains unavailable while no face-up Measure exists; a later played card reaching Recycle can make the market accessible again through EXP-01-07-05A.
EXP-01-07-05D Transfers between MeasureDrawPile, OpenMeasures, PlayerHand, and MeasureRecyclePile do not reset play counters. Refill and recycling use only the affected expansion's zones and cards; MeasureFinalDiscard never returns under EXP-01-07-04.

EXP-01-07-06 Use the shared duration vocabulary and boundaries in CORE-01-07-07 through -18, including all duration terms expressly used by the card definitions. Specific normative overrides follow CORE-01-10; a duration alone grants no new play window.

EXP-01-07-07 Per-Round Usage Flags
If a Measure grants an effect limited to “once this round”, the engine tracks a boolean flag per player and per active effect instance under EXP-01-07-08: usedThisRound. Card recycling, drawing, or replay does not reset an existing instance's flag.
Reset usedThisRound only at an actually begun new round after Settlement and due effect expiry under CORE-01-07-17, not after the final Settlement.
EXP-01-07-07A No additional play window is inferred from a duration. Ordinary PlayMeasure timing and explicit registered triggers remain applicable under the shared game clock.

EXP-01-07-08 Active Effect Instances
Each successful Measure play with a continuing or future effect registers its own effect instance, separate from the physical card. Record an immutable unique instance ID, source card ID and that card's play number, the player who played it as effect owner, targets and parameters selected for that play, its rule-defined duration or trigger, and its own consumption and usage flags. Allocate instance IDs deterministically from game events, without system time or unseeded randomness. An effect record is not another physical card and does not put the source card in a second zone.
EXP-01-07-09 Independent Card Lifecycle
After immediate resolution and effect registration, move the card through its ordinary Recycle/FinalDiscard lifecycle and refill its market before the additional action under EXP-01-06-05. Card recycling, drawing, changing card holder, or entry into FinalDiscard does not end or change any registered effect, its owner, targets, or flags. A subsequent successful play of that physical card registers a new independent instance; it neither replaces nor resets an earlier instance.
EXP-01-07-10 Effect Lifetime
Each instance applies only while its own rule-defined duration and trigger conditions permit it. Once expired or consumed, it no longer applies; ending the effect does not move its source card. This procedure does not redefine any timing keyword or specific consumption rule.
EXP-01-07-11 Existing Instance Restrictions
Independent instances do not bypass shared PlayMeasure limits, explicit simultaneous-instance restrictions such as Carbon Levy, or specific stacking rules. An instance's usage flags are initialized for that instance and reset only when its own applicable rule requires it, never because its source card circulates. This rule creates no additional stacking permission.
EXP-01-07-12 Later Choices
Targets and parameters selected at play remain bound to that instance. Only choices expressly deferred by a rule are made at their specified trigger by the player designated by that rule, using the then-legal options. Record those choices as game events for replay. Do not invent or silently replace targets. Resolving such a choice is not another PlayMeasure, does not open a new hand-card play window, and grants no additional Political Action.
EXP-01-07-13 Shared Instance Procedure
The procedure in EXP-01-07-08 through -12 and -14/-15 applies to Measures of every active expansion using the shared framework, including EXP-02 or EXP-03 without EXP-01. It creates no cards, Resource resorts, zones, or effect instances belonging to a disabled expansion. Existing card-specific trigger and consumption rules remain applicable.
EXP-01-07-14 Triggered Operation Order
Canonical resolution stages and explicitly specified timing windows take precedence. Within the same window, resolve simultaneously triggered operations in their instances' game-event registration order, breaking ties by ascending ordinal lexicographic instance ID. At the triggering event, record which already registered instances triggered; each may trigger at most once for that event. Complete each operation before the next, checking its legality against the then-current state. A newly registered instance does not react retroactively to an event already begun. Passive modifiers remain in their canonical modifier stage and are not separately executed operations. Existing Settlement and Hotspot procedures retain their prescribed stages.
EXP-01-07-15 Successful and Failed PlayMeasure
Apply CORE-01-06-00-10 through -12. A successful PlayMeasure commits its payments, immediate effect, any effect registration, card play-counter increment, and shared PlayMeasure usage together; then complete its ordinary card lifecycle and market refill before the additional action. If that PlayMeasure fails, retain the card in PlayerHand without incrementing its play counter, changing shared PlayMeasure usage, registering a new effect, refilling because of that attempt, or granting an additional action. Explicit consumption-on-failure exceptions for existing effects remain applicable. Failure of a separate later trigger does not undo an earlier successful PlayMeasure.

---

# EXP-01-08 MEASURE DEFINITIONS

## EXP-01-08-M01 — Budget Compromise

EXP-01-08-M01-01 Name: Budget Compromise.
EXP-01-08-M01-02 Cost: DOM + ECO + INF.
EXP-01-08-M01-03 Target: One Hotspot Tile in Board.
EXP-01-08-M01-04 Duration: This round.
EXP-01-08-M01-05 Effect: The targeted Hotspot does not resolve when it would normally resolve during this round.
EXP-01-08-M01-06 If the targeted Hotspot's first enclosure occurs while this Measure applies, its enclosure event is processed without a payout under CORE-01-06-04A. Expiry of this Measure does not cause a deferred resolution or another enclosure event.

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
EXP-01-08-M04-02 Cost: ECO + DOM.
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
EXP-01-08-M06-07A Mandatory completion without an action under CORE-01-04-09B counts as a failed Action attempt solely for consuming the applicable Budget Deficit effect. No action is performed and no Resource is paid. The completed slot is not reopened after consumption; this exception does not trigger other action-attempt or payment effects.

---

## EXP-01-08-M07 — Debt Brake

EXP-01-08-M07-01 Name: Debt Brake.
EXP-01-08-M07-02 Cost: DOM + ECO + ECO.
EXP-01-08-M07-03 Duration: Next round.
EXP-01-08-M07-04 Effect: During the next round, no player may perform ConvertResources, either as a standalone Political Action or as part of FormalizeInfluence.

---

## EXP-01-08-M08 — Economic Council

EXP-01-08-M08-01 Name: Economic Council.
EXP-01-08-M08-02 Cost: ECO + ECO + ECO.
EXP-01-08-M08-03 Duration: This round.
EXP-01-08-M08-04 Effect: Once this round, when paying a cost that includes ECO, you may treat exactly 1 non-ECO Resource as ECO for that payment.
EXP-01-08-M08-05 Select the substitution in the complete payment plan under CORE-01-06-00-10. Mark this effect instance's usage only atomically with successful payment and resolution under CORE-01-06-00-11; a proposed substitution in a failed resolution does not use it.

---

## EXP-01-08-M09 — Investment Freeze

EXP-01-08-M09-01 Name: Investment Freeze.
EXP-01-08-M09-02 Cost: ECO + ECO + INF.
EXP-01-08-M09-03 Target: One opponent player.
EXP-01-08-M09-04 Duration: During the next Round Settlement, including the final Settlement if that is the next one.
EXP-01-08-M09-05 Effect: For each ResortTile controlled by the targeted opponent when that Tile's production is resolved, ignore all Measure-based modifiers to its printed production value, doubling, and Tile production output, whether increases or reductions. Regulation and other non-Measure modifiers still apply.
EXP-01-08-M09-06 Evaluate the control condition with the canonical majority rules when collecting modifiers for that production instance, without replacing the canonical production pipeline. A tied, uncontrolled Tile is not affected. Do not calculate different Tile output amounts for individual recipients; a recipient-specific receipt limit is not a Tile-output modifier ignored by this Measure.
EXP-01-08-M09-07 This effect ends after that one Settlement. Registering it completes the Measure's immediate resolution for lifecycle and additional-action sequencing; its later application is not another PlayMeasure and grants no additional Political Action.

---

## EXP-01-08-M10 — Supplemental Budget

EXP-01-08-M10-01 Name: Supplemental Budget.
EXP-01-08-M10-02 Cost: ECO.
EXP-01-08-M10-03 Duration: This turn.
EXP-01-08-M10-04 Effect: After this Measure is successfully played, for a subsequent Political Action performed by its owner this turn, that player may select exactly one applicable additional Resource-cost unit imposed by a Measure or a cost-increasing Regulation. Select it in the complete payment plan before paying; at most one unit may be replaced per action.
EXP-01-08-M10-05 If a unit is selected, omit that unit from the payment plan and instead pay a fixed replacement payment of exactly 1 Resource of any active resort. Final costs are the action's base costs plus all remaining applicable additional costs plus this replacement payment. Do not pay the omitted unit or refund a previously paid unit.
EXP-01-08-M10-06 This option requires an actual eligible additional cost. It cannot replace base costs, waive prohibitions, or bypass minimum requirements. A selected unit is one Resource, not every additional cost from the same source. The card's printed 1 ECO cost is paid separately when played and cannot be retroactively changed by its own effect.
EXP-01-08-M10-07 The fixed replacement payment is part of that same payment plan, not a separate action or newly taxed resolution. It is not itself an additional surcharge eligible for further waiver, replacement, or transfer; in particular, neither Supplemental Budget nor Intergenerational Pact may replace or transfer it. The omitted original unit also cannot be transferred. Other legal payment-plan choices remain available under CORE-01-06-00-10/-11.
EXP-01-08-M10-08 Check prohibitions first, then execute only the fully payable final plan atomically with the action under CORE-01-06-00-11. Failure makes no partial payment or main effect and does not refund earlier successful payments; explicit consumption-on-failure exceptions remain applicable. This effect grants no additional Political Action and retains the duration in EXP-01-08-M10-03.

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
EXP-01-10-03 If EXP-01 is inactive, ECO, EXP-01 components, EXP-01 Measure cards, and EXP-01-specific Measure zones do not exist in the match. Shared framework definitions remain applicable for other active Measure decks under EXP-01-06-00/-00A; they do not activate EXP-01.

---

END OF EXP-01 v1.3
