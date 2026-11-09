# EXP-03 — Climate & Future

Fully Engine-Formalized Specification v1.0
Requires: CORE-01 (v1.0.14) 
Compatible with: EXP-01 (v1.3) , EXP-02 (v1.0) 
Applied errata: ERRATA-0007 (2026-11-07, draw resolution and bounded recycling).
Applied errata: ERRATA-0009 (2026-11-07, Measure acquisition and market refill).
Applied errata: ERRATA-0010 (2026-11-07, shared Measure framework).
Applied errata: ERRATA-0011 (2026-11-07, ECO-dependent Climate Measure eligibility).

---

# SECTION INDEX

EXP-03-00 Scope
EXP-03-01 CLM Resource
EXP-03-02 Components & Definitions
EXP-03-03 Setup
EXP-03-04 Round & Countdown Model
EXP-03-05 Production Rules
EXP-03-06 Political Action Interaction
EXP-03-07 Measure System
EXP-03-08 Measure Definitions
EXP-03-09 Restrictions
EXP-03-10 Rule Interaction

---

# EXP-03-00 SCOPE

EXP-03-00-01 EXP-03 extends CORE-01.
EXP-03-00-02 CORE-01 remains valid unless explicitly overridden.
EXP-03-00-03 EXP-03 introduces the Resource type CLM.
EXP-03-00-04 EXP-03 introduces Climate ResortTiles.
EXP-03-00-05 EXP-03 introduces one Hotspot Tile “Transformation Pressure”.
EXP-03-00-06 EXP-03 introduces a Measure deck.
EXP-03-00-07 Victory conditions remain unchanged.
EXP-03-00-08 CountdownMarkers are reserved and inactive in this rule version under EXP-03-02-C-00. EXP-03 does not create CountdownMarker state.
EXP-03-00-09 No implicit round-based effects are introduced. Explicit Measure duration boundaries follow CORE-01-07-07 through -18; Countdown remains reserved and inactive.

---

# EXP-03-01 CLM RESOURCE

EXP-03-01-01 CLM is a Resource type.
EXP-03-01-02 CLM represents Climate.
EXP-03-01-03 CLM behaves identically to DOM, FOR, INF unless explicitly modified.
EXP-03-01-04 CLM counts as a distinct resort for all “different resorts” requirements.
EXP-03-01-05 CLM may be used wherever “a Resource” is required.
EXP-03-01-06 CLM is never treated as substitution for another Resource unless explicitly stated.
EXP-03-01-07 CLM exists only while EXP-03 is active.

---

# EXP-03-02 COMPONENTS & DEFINITIONS

## EXP-03-02-A Climate ResortTiles

EXP-03-02-A-01 For 2–4 players add:
• CLM-W1 ×2
• CLM-W2 ×2

EXP-03-02-A-02 For 5–6 players additionally add:
• CLM-W1 ×1
• CLM-W2 ×1
EXP-03-02-A-02A Thus the total CLM ResortTile set is CLM-W1×2 and CLM-W2×2 for 2–4 players, or CLM-W1×3 and CLM-W2×3 for 5–6. These totals include the base set and, where applicable, the two additions; do not add another copy from this summary. Transformation Pressure remains the separate single Hotspot under EXP-03-03-04.

EXP-03-02-A-03 CLM ResortTiles are ResortTiles.
EXP-03-02-A-04 CLM ResortTiles follow CORE Resort production rules.

---

## EXP-03-02-B Hotspot — Transformation Pressure

EXP-03-02-B-01 Add Hotspot “Transformation Pressure” ×1 to DrawPile.
EXP-03-02-B-02 Transformation Pressure resolves as an ordinary CORE Hotspot, including the normal majority Influence payout and one-time enclosure processing under CORE-01-06-04 through -07. Its reserved Countdown reference grants no additional effect.
EXP-03-02-B-03 Transformation Pressure produces no Resources.
EXP-03-02-B-04 Transformation Pressure's capacity to hold CountdownMarkers is reserved under EXP-03-02-C-00; no such markers may be created or attached in this rule version.

---

## EXP-03-02-C CountdownMarker

EXP-03-02-C-00 Reserved, Inactive Mechanic
All CountdownMarker provisions in this specification are reserved descriptions, not active match rules in this version. Create no CountdownMarkers, CountdownSupply, Countdown-specific BoardAttached entries, counters, or empty placeholder state. The reserved definitions authorize no action, placement, removal, scoring effect, or automatic resolution. Activation requires a separate rule revision defining supply, placement, and actual function; it cannot be inferred from the reserved text.
EXP-03-02-C-01 CountdownMarker is a reserved persistent object type, inactive under EXP-03-02-C-00.
EXP-03-02-C-02 A CountdownMarker exists in exactly one of two zones: CountdownSupply or BoardAttached.
EXP-03-02-C-03 A CountdownMarker attached to Board references exactly one Transformation Pressure Hotspot.
EXP-03-02-C-04 CountdownMarkers have no intrinsic effect.
EXP-03-02-C-05 CountdownMarkers are placed only when explicitly instructed by a Climate effect.
EXP-03-02-C-06 CountdownMarkers are persistent until removed by explicit effect.
EXP-03-02-C-07 CountdownMarkers stack without limit.
EXP-03-02-C-08 CountdownMarkers have no upkeep.
EXP-03-02-C-09 No Implicit Countdown Resolution
CountdownMarkers never trigger any effect and are never evaluated automatically.
CountdownMarkers affect the game state only when explicitly referenced by an effect.

---

## EXP-03-02-D Climate Effect (Definition)

EXP-03-02-D-01 A Climate effect is any effect that:
(a) originates from an EXP-03 Measure instruction, including its registered continuing or later-triggered effect, or
(b) has an explicitly printed mandatory CLM base cost, or
(c) is expressly designated a Climate effect by its normative Tile or rule text.

EXP-03-02-D-02 Effects not meeting EXP-03-02-D-01 are not Climate effects.
EXP-03-02-D-03 Static Source and Cost Kind
Classify by the originating rule/effect, not the Resource actually selected for payment or the ContextTile's resort. Choosing CLM for an unrestricted payment does not turn a CORE action, Regulation surcharge, or unrelated component into a Climate effect. A permitted payment substitution does not remove an existing Climate source classification. Each cost component retains its causing rule/effect-instance identity and kind: base cost, additional surcharge, or fixed replacement payment. A Climate surcharge does not reclassify the whole action or other components. Intergenerational Pact changes the assigned payer, not that component's source or kind.
EXP-03-02-D-04 Cost-Waiver Boundary
Within each card's applicable protection scope, Adaptation Strategy, Technology Initiative, and Future Pact waive only additional Resource-cost components caused by Climate effects. They do not waive printed card prices, other base costs, fixed Greenwashing or Supplemental Budget replacement payments, prohibitions, or non-Climate surcharges. A Climate source alone does not make a base cost or fixed replacement payment an additional surcharge.
EXP-03-02-D-05 Replacement Component Identity
When Supplemental Budget replaces a surcharge, the original unit is omitted and its fixed replacement payment originates from EXP-01-08-M10. The new payment does not inherit the omitted unit's Climate classification. A merely transferred existing surcharge, by contrast, retains its original source and cost kind under EXP-03-02-D-03.
EXP-03-02-D-06 Nonrecursive Classification and Filtering
A Climate-cost waiver filters eligible cost components; it does not delete itself or another effect instance, create another cost-resolution pass, or recursively reclassify effects because their text mentions Climate costs or exemptions. Classification does not activate reserved or excluded content.
EXP-03-02-D-07 Protection Scope and Original Payer
Determine the original rule-assigned payer of each cost component before any Intergenerational Pact transfer, under CORE-01-06-00-07 or the explicit placement/operation rule. Apply global, action-specific, or personal protection as specified in EXP-03-08-M08/-M09/-M10. Personal protection is checked against that original payer; assigning a different payer through transfer does not trigger another protection check. The transferred component retains its source and kind and must be fully paid by its assigned recipient.
EXP-03-02-D-08 Waiver, Replacement, and Transfer Sequence
Preserve Start Committee immunity and check prohibitions first. After collecting applicable costs, apply all applicable Climate-surcharge waivers under EXP-03-02-D-04/-07. Each component can be removed only once. Then optionally apply Supplemental Budget to a remaining eligible surcharge, then Intergenerational Pact to a remaining positive transferable surcharge. Complete any permitted Resource-substitution choices and execute only the fully legal, payable final plan atomically under CORE-01-06-00-10/-11. Removed components and fixed replacement payments cannot be transferred. Waiver filtering itself creates no payment or effect consumption; specific consumption rules for the main resolution remain applicable.

---

# EXP-03-03 SETUP

EXP-03-03-01 Shuffle CLM ResortTiles into DrawPile.
EXP-03-03-02 Before shuffling, determine eligible EXP-03 Measures under EXP-03-03-02A through -02D. Shuffle one copy of each eligible Measure to form the EXP-03 MeasureDrawPile.
EXP-03-03-02A Energy Crisis (EXP-03-08-M06), Technology Initiative (EXP-03-08-M09), and Supply Chain Disruption (EXP-03-08-M11) are eligible only when EXP-01 is active. With EXP-01 inactive, these three cards are not part of the match material and exist in none of its zones. The unconditional exclusions in EXP-03-03-02D also apply.
EXP-03-03-02B Eligibility is determined at setup under EXP-03-03-02A/-02D, before any card draws. Later Resource-cost substitution effects do not introduce excluded cards or change this setup decision; neither does recycling. Printed costs of eligible cards remain unchanged.
EXP-03-03-02C For the listed EXP-03 Measure set, the eligible deck contains 13 cards with EXP-01 active and 10 without EXP-01. These counts are before the three setup cards are moved to OpenMeasures.
EXP-03-03-02D Transformation Blockade (EXP-03-08-M14) and Future Committee (EXP-03-08-M15) are reserved and excluded from match material in this rule version, regardless of EXP-01 activation. They exist in none of the match's zones and cannot enter through draw, refill, recycling, or cost substitution.
EXP-03-03-03 Place exactly 3 EXP-03 Measures face up in EXP-03 OpenMeasures.
EXP-03-03-04 Add Transformation Pressure Hotspot ×1 to DrawPile.
EXP-03-03-05 No modification to Starting Influence.
EXP-03-03-06 No modification to Round structure.
EXP-03-03-07 Do not initialize any CountdownMarker objects, supply, counters, or Countdown-specific attached entries, including empty placeholders. Apply EXP-03-02-C-00 even while EXP-03 is active. Transformation Pressure remains exactly one ordinary Hotspot added under EXP-03-03-04, not an additional copy from its component description.

---

# EXP-03-04 ROUND & COUNTDOWN MODEL

## EXP-03-04-A Round Definition

EXP-03-04-A-01 Use the shared round structure in CORE-01-07, including Settlement and the shortened final round.
EXP-03-04-A-02 This turn follows CORE-01-07-08/-09 and includes the complete turn before Settlement.
EXP-03-04-A-03 This round follows CORE-01-07-10 and includes the complete current Settlement.
EXP-03-04-A-04 Next round follows CORE-01-07-12, beginning only with the actual next round and including its Settlement.

---

## EXP-03-04-B Countdown Placement (reserved under EXP-03-02-C-00)

EXP-03-04-B-01 CountdownMarkers are placed only when an effect explicitly instructs placement.
EXP-03-04-B-02 Placement requires moving one CountdownMarker from CountdownSupply to BoardAttached on Transformation Pressure.
EXP-03-04-B-03 If CountdownSupply is empty, placement fails with no partial effect.
EXP-03-04-B-04 Placement is not automatic at any timing window.
EXP-03-04-B-05 No CountdownMarker moves automatically between rounds.

---

## EXP-03-04-C Countdown Prohibition (reserved under EXP-03-02-C-00)

EXP-03-04-C-01 If an effect prohibits placement of CountdownMarkers, placement attempts fail.
EXP-03-04-C-02 Prohibition prevents placement before cost payment.
EXP-03-04-C-03 If placement is prohibited, no cost for placement is paid.

---

# EXP-03-05 PRODUCTION RULES

EXP-03-05-01 CLM production follows CORE Resort Production timing.
EXP-03-05-02 Production during Round Settlement follows CORE-01-06-16 (Production Resolution Order).
EXP-03-05-03 Climate Measures expressly modifying Tile production output are additive modifiers in CORE-01-06-16(a)(3), combined with other applicable additive modifiers before the single floor in (a)(4). Supply Chain Disruption is instead a recipient limit after regular share calculation under CORE-01-06-16A; an immediate gain such as Future Investment is not Resort Production.
EXP-03-05-04 If EXP-02 is active, Regulation output reductions such as SecurityLevel are included in that same additive output step, retaining their applicable stacking rules. Blockade is checked before production; cost-increasing Regulations retain their cost function and are not output deductions. Do not introduce a separate Regulation or Climate floor before CORE-01-06-16(a)(4).
EXP-03-05-05 Climate never replaces other Resources during production unless explicitly stated.

---

# EXP-03-06 POLITICAL ACTION INTERACTION

EXP-03-06-01 With EXP-03 active, Political Actions include the CORE-01 actions plus TakeMeasure and PlayMeasure from the shared framework in EXP-01-06. EXP-01 need not be active; shared limits and additional-action rules apply across all enabled Measure decks.
EXP-03-06-02 Climate Measures use PlayMeasure from the shared framework; referring to those definitions does not activate ECO or EXP-01 cards or zones.
EXP-03-06-03 Climate effects that increase costs add +1 Resource of any resort unless otherwise specified.
EXP-03-06-04 Additional costs must be paid before effect execution.
EXP-03-06-05 If additional costs cannot be paid, the effect fails completely.

EXP-03-06-06 Influence suppression under Greenwashing and Protest Movement applies only to the gain operations defined in EXP-03-08-M05/-M07. It does not alter canonical majority, virtual Influence, ordinary PlaceOrMoveInfluence, Resource effects, or Inner Order's Regulation outcome.
EXP-03-06-07 A suppressed Influence gain does not occur. Only an expressly defined replacement can lift its specified suppression; it does not override another prohibition or an unmet prerequisite.
EXP-03-06-08 Start Committee immunity under CORE-01-08-06A remains applicable without a suppression-replacement fee. Its timing, once-per-game limit, and base costs remain unchanged. A suppressed Hotspot payout still processes its enclosure once under CORE-01-06-04A, without later payout or retry.

---

# EXP-03-07 MEASURE SYSTEM

EXP-03-07-00-01 EXP-03 uses its own Measure zones (separate from any other expansion).
EXP-03-07-01 EXP-03 Measures use the shared framework defined under EXP-01-06-00, including its lifecycle rules. Referencing those definitions does not activate EXP-01, ECO, or EXP-01 cards or zones.
EXP-03-07-01A For any otherwise permitted EXP-03 TakeMeasure or PlayMeasure, use the acquisition procedure EXP-01-06-04 through -04D and market/lifecycle procedure EXP-01-07-01 through -05D within EXP-03's own zones. Its OpenMeasures has the three ordered slots from EXP-01-02-E-01B, and its cards start with play counter 0 and no cards in PlayerHand under EXP-01-03-06. These procedural references do not by themselves grant new action timings.
EXP-03-07-01B EXP-03 uses the shared active-effect procedure in EXP-01-06-05D and EXP-01-07-08 through -15, including triggered-operation ordering and successful/failed PlayMeasure handling. Registered effects remain independent of their physical cards and of any later play of those cards.
EXP-03-07-02 Use the shared duration vocabulary and boundaries in CORE-01-07-07 through -18, including each expressly defined card duration. Specific overrides follow CORE-01-10; this grants no new PlayMeasure timing.

EXP-03-07-03 Per-Round Usage Flags
If a Measure grants an effect limited to “once this round”, the engine tracks a boolean flag per player and per active effect instance under EXP-01-07-08: usedThisRound. Card recycling, drawing, or replay does not reset an existing instance's flag.
Reset usedThisRound only at an actually begun new round after Settlement and due effect expiry under CORE-01-07-17, not after the final Settlement.
EXP-03-07-04 No additional play window is inferred from a duration. Ordinary PlayMeasure timing and explicit registered triggers remain applicable under the shared game clock.
EXP-03-07-05 Measures do not create hidden state.
EXP-03-07-06 Measures cannot bypass prohibitions unless explicitly stated.

---

# EXP-03-08 MEASURE DEFINITIONS

---

## EXP-03-08-M01 — Transformation Directive

EXP-03-08-M01-01 Name: Transformation Directive.
EXP-03-08-M01-02 Cost: CLM + CLM.
EXP-03-08-M01-03 Target: One ResortTile in Board.
EXP-03-08-M01-04 Duration: Until the beginning of your next turn.
EXP-03-08-M01-05 Effect: Each Action executed on that Tile requires +1 CLM or +1 DOM.
EXP-03-08-M01-06 If the additional cost cannot be paid, the Action fails.

---

## EXP-03-08-M02 — Carbon Levy

EXP-03-08-M02-01 Name: Carbon Levy.
EXP-03-08-M02-02 Cost: CLM + CLM.
EXP-03-08-M02-03 Target: One Resort.
EXP-03-08-M02-04 Duration: Until the end of the next round.
EXP-03-08-M02-05 Effect: Actions executed on ResortTiles of that Resort require +1 CLM or +1 DOM.
EXP-03-08-M02-06 Multiple instances of Carbon Levy may not target the same Resort simultaneously.
EXP-03-08-M02-07 If the additional cost cannot be paid, the Action fails.
EXP-03-08-M02-08 Scope Clarification
This applies only to actions whose ContextTile is a ResortTile of the targeted Resort.
It does not apply to actions whose ContextTile is not a ResortTile.

---

## EXP-03-08-M03 — Future Investment

EXP-03-08-M03-01 Name: Future Investment.
EXP-03-08-M03-02 Cost: CLM + CLM.
EXP-03-08-M03-03 Target: One ResortTile in Board.
EXP-03-08-M03-04 Duration: Immediate.
EXP-03-08-M03-05 Effect: Gain exactly 1 Resource of that Tile’s Resort from Bank.

---

## EXP-03-08-M04 — Future Resolution

EXP-03-08-M04-01 Name: Future Resolution.
EXP-03-08-M04-02 Cost: CLM + CLM.
EXP-03-08-M04-03 Target: One player.
EXP-03-08-M04-04 Duration: During the target player’s next turn.
EXP-03-08-M04-05 Effect: The targeted player may not perform PlayMeasure.

---

## EXP-03-08-M05 — Greenwashing

EXP-03-08-M05-01 Name: Greenwashing.
EXP-03-08-M05-02 Cost: CLM + INF.
EXP-03-08-M05-03 Duration: Until the beginning of your next turn.
EXP-03-08-M05-04 Effect: For all players, prohibit new Influence from FormalizeInfluence and the normal Hotspot Influence payout, including Labor Market and Transformation Pressure. A Hotspot payout is an Influence gain for this rule even though it transfers an existing marker from PersonalSupply. Apply Start Committee immunity under EXP-03-06-08.
EXP-03-08-M05-05 Replacement Rule: The player entitled to the gain may pay exactly 1 CLM or 1 INF from their PersonalSupply to Bank once for that formalization or Hotspot-payout resolution to lift only its Greenwashing suppression. The price is per gain resolution, not per marker; multiple applicable Greenwashing instances do not multiply it. This explicitly assigns the replacement payment to the recipient even for the otherwise cost-free automatic Hotspot payout.
EXP-03-08-M05-06 Without the selected, fully payable replacement, the gain remains prohibited. A formalization prohibited this way is not a legal action option. Execute the replacement atomically with formalization's complete payment and permitted result, or with the permitted Hotspot outcome, under CORE-01-06-00-10/-11. A failed resolution makes no partial transfer; explicit consumption-on-failure exceptions remain applicable.
EXP-03-08-M05-07 This fixed replacement payment is not an additional surcharge eligible for waiver, further replacement, or transfer; Supplemental Budget and Intergenerational Pact cannot replace or transfer it. It creates no separate taxed resolution, general Hotspot fee, or additional Political Action.
EXP-03-08-M05-08 First check other prohibitions and prerequisites. This payment does not bypass Protest Movement, Blockade, Budget Compromise, unavailable Influence in PersonalSupply, or other requirements. If another prohibition or unmet prerequisite still prevents the outcome, pay no Greenwashing fee. Output modifiers such as SecurityLevel still apply after Greenwashing suppression is lifted and may reduce an otherwise permitted paid outcome to 0.
EXP-03-08-M05-09 Ordinary PlaceOrMoveInfluence, virtual Influence, majority, Resource effects, and Inner Order's Regulation outcome are unaffected. Start Committee formalization is immune and requires no Greenwashing payment. Printed card cost and duration remain as specified in EXP-03-08-M05-02/-03.

---

## EXP-03-08-M06 — Energy Crisis

EXP-03-08-M06-01 Name: Energy Crisis.
EXP-03-08-M06-02 Cost: CLM + ECO.
EXP-03-08-M06-03 Duration: Until the beginning of your next turn.
EXP-03-08-M06-04 Effect: ConvertResources requires +1 DOM.
EXP-03-08-M06-05 If the additional cost cannot be paid, ConvertResources fails.

---

## EXP-03-08-M07 — Protest Movement

EXP-03-08-M07-01 Name: Protest Movement.
EXP-03-08-M07-02 Cost: CLM.
EXP-03-08-M07-03 Duration: Until the beginning of your next turn.
EXP-03-08-M07-04 Effect: For all players, prohibit only the normal Hotspot Influence payout, including Labor Market and Transformation Pressure.
EXP-03-08-M07-05 FormalizeInfluence, ordinary PlaceOrMoveInfluence, virtual Influence, canonical majority, Resource effects, and Inner Order's Regulation outcome are unaffected. Start Committee immunity remains applicable.
EXP-03-08-M07-06 This card defines no replacement payment. Greenwashing's replacement lifts only Greenwashing and cannot lift Protest Movement; no Greenwashing fee is paid for an outcome that Protest Movement still prohibits. Process the suppressed Hotspot enclosure once without deferred payout under EXP-03-06-08. Printed card cost and duration remain unchanged.

---

## EXP-03-08-M08 — Adaptation Strategy

EXP-03-08-M08-01 Name: Adaptation Strategy.
EXP-03-08-M08-02 Cost: CLM + CLM.
EXP-03-08-M08-03 Duration: Until the beginning of your next turn.
EXP-03-08-M08-04 Effect: Globally waive additional Resource surcharges of Climate origin for all players' player-paid resolutions, including cost-bearing Tile placement and separately triggered operations, under EXP-03-02-D-04/-07/-08.
EXP-03-08-M08-05 This protection includes opponents and is not restricted to its owner's actions. It does not change printed costs, duration, or ordinary PlayMeasure timing; newly registered protection does not apply retroactively to its own completed card play.

---

## EXP-03-08-M09 — Technology Initiative

EXP-03-08-M09-01 Name: Technology Initiative.
EXP-03-08-M09-02 Cost: CLM + ECO + DOM.
EXP-03-08-M09-03 Duration: This turn.
EXP-03-08-M09-04 Timing: Play this card through ordinary PlayMeasure. Its protection applies only to the owner's one subsequent permitted non-PlayMeasure additional Political Action in this turn under EXP-01-06-05; it grants no separate hand-card play window.
EXP-03-08-M09-05 Effect: Waive additional Resource surcharges of Climate origin for that one Political Action under EXP-03-02-D-04/-07/-08. The protection does not cover the completed card play, Tile placement, or a separately triggered follow-up operation.
EXP-03-08-M09-06 If that additional slot completes without an action under CORE-01-04-09B, no protected action is deferred or granted later. The card grants no extra action beyond the ordinary PlayMeasure procedure and retains its printed cost and This turn duration.

---

## EXP-03-08-M10 — Future Pact

EXP-03-08-M10-01 Name: Future Pact.
EXP-03-08-M10-02 Cost: CLM + DOM + FOR.
EXP-03-08-M10-03 Duration: Until the beginning of your next turn.
EXP-03-08-M10-04 Effect: Personally waive additional Resource surcharges of Climate origin whose original rule-assigned payer is this Measure's owner, under EXP-03-02-D-04/-07/-08. This includes their cost-bearing Tile placement and expressly triggered later operations, even when another player is active. Printed cost and duration remain unchanged.
EXP-03-08-M10-05 Personal protection is evaluated before transfer, for the original payer. It does not waive another player's surcharge merely because Intergenerational Pact later assigns its payment to this Measure's owner. Newly registered protection does not apply retroactively to its own completed card play.

---

## EXP-03-08-M11 — Supply Chain Disruption

EXP-03-08-M11-01 Name: Supply Chain Disruption.
EXP-03-08-M11-02 Cost: CLM + ECO.
EXP-03-08-M11-03 Target: One player.
EXP-03-08-M11-04 Duration: Until the beginning of your next turn.
EXP-03-08-M11-05 Effect: During each ResortTile production instance, the targeted player receives at most 1 Resource under EXP-03-08-M11-06 through -09.
EXP-03-08-M11-06 A production instance is the complete production of one ResortTile in a Settlement, including the final Settlement. Compute the Tile output under CORE-01-06-16(a), including doubling, SecurityLevel, other modifiers, and floor, then determine regular player shares and the original tie remainder under (b)/(c).
EXP-03-08-M11-07 After regular shares are determined, set the targeted player's final receipt to min(their regular share, 1). Other players retain their regular shares. Execute only the final transfers under CORE-01-06-16A. A regular share of 0 remains 0; this limit creates no minimum payout. Output 0, a production prohibition, or highest total Influence 0 still produces no player payout.
EXP-03-08-M11-08 The reduction is not issued from Bank and is not redistributed to another player or Noise. Noise receives only the original tie remainder. With the unbounded Bank, do not materialize Resources solely for the cancelled portion; any existing Bank Resources that would have funded it remain in Bank.
EXP-03-08-M11-09 Apply the limit separately to each affected player in each ResortTile production, not once for the whole Settlement. Multiple applicable instances impose the same maximum receipt of 1; they do not reduce that maximum to 0. This is a recipient-specific receipt limit, not a Tile-output modifier, and is not ignored by Investment Freeze. Printed cost, target, and duration remain as specified in EXP-03-08-M11-02 through -04.

---

## EXP-03-08-M12 — Extreme Weather Event

EXP-03-08-M12-01 Name: Extreme Weather Event.
EXP-03-08-M12-02 Cost: CLM.
EXP-03-08-M12-03 Duration: Until the beginning of your next turn.
EXP-03-08-M12-04 Effect: Placing ResortTiles requires +1 CLM or +1 DOM.
EXP-03-08-M12-05 If the additional cost cannot be paid, placement fails.
EXP-03-08-M12-06 If the drawn Tile has no payable legal placement because of these costs, discard it and continue drawing under CORE-01-04-06/-07 or VAR-01-01-04A/-06. It is discarded even with TileRecycling active. If a payable legal placement exists, CORE-01-04-08A requires choosing one instead of voluntarily discarding the Tile.

---

## EXP-03-08-M13 — Intergenerational Pact

EXP-03-08-M13-01 Name: Intergenerational Pact.
EXP-03-08-M13-02 Cost: CLM + DOM.
EXP-03-08-M13-03 Duration: Until consumed.
EXP-03-08-M13-04 Effect: When additional costs occur, you may transfer exactly 1 of those additional cost components to another player.
EXP-03-08-M13-05 The effect is consumed immediately after one transfer.
EXP-03-08-M13-06 Transfer Rule (Deterministic)
The chosen other player must pay the transferred cost component from their PersonalSupply.
If the chosen player cannot fully pay that component, the original action fails with no partial payment or main-effect change. Explicit consumption-on-failure exceptions remain applicable under CORE-01-06-00-11.
EXP-03-08-M13-07 No Refusal
The chosen player may not refuse the transfer.
EXP-03-08-M13-08 Select the additional cost component and assigned payer in the complete payment plan under CORE-01-06-00-10. Every payer must be able to pay their complete final share. Each component may be transferred at most once within that resolution; separate permitted instances may transfer different components, but no component may be forwarded or enter a transfer cycle.
EXP-03-08-M13-09 The transfer and this instance's consumption occur atomically with all payments and the successful main resolution under CORE-01-06-00-11. Choosing a transfer is not yet performing it. If the resolution fails, no transfer occurs and this instance remains unconsumed, even if its proposed recipient could have paid their individual component.
EXP-03-08-M13-10 Apply Climate-cost waivers and any Supplemental Budget replacement before selecting a transfer under EXP-03-02-D-08. Only a remaining positive additional component can be transferred; a removed component or fixed replacement payment cannot. The new payer must fully pay without reopening personal protection checks. With no transferable component there is no transfer or consumption; actual transfer consumption still requires successful atomic resolution under EXP-03-08-M13-09.

---

## EXP-03-08-M14 — Transformation Blockade

EXP-03-08-M14-00 Reserved card definition; excluded from match material under EXP-03-03-02D. The following text does not activate a Countdown effect in this rule version.
EXP-03-08-M14-01 Name: Transformation Blockade.
EXP-03-08-M14-02 Cost: CLM + INF.
EXP-03-08-M14-03 Duration: Until the beginning of your next turn.
EXP-03-08-M14-04 Effect: Effects that place CountdownMarkers require +1 CLM or +1 DOM.
EXP-03-08-M14-05 If the additional cost cannot be paid, the Countdown placement fails.

---

## EXP-03-08-M15 — Future Committee

EXP-03-08-M15-00 Reserved card definition; excluded from match material under EXP-03-03-02D. The following text does not activate a Countdown effect in this rule version.
EXP-03-08-M15-01 Name: Future Committee.
EXP-03-08-M15-02 Cost: CLM + INF + ECO.
EXP-03-08-M15-03 Duration: Until the beginning of your next turn.
EXP-03-08-M15-04 Effect: Players placing CountdownMarkers must pay +1 CLM or +1 DOM.
EXP-03-08-M15-05 If the additional cost cannot be paid, placement fails.

---

# EXP-03-09 RESTRICTIONS

EXP-03-09-01 CLM does not modify Influence cap.
EXP-03-09-02 CLM does not alter majority calculation.
EXP-03-09-03 CountdownMarkers do not alter ownership or control.
EXP-03-09-04 CountdownMarkers have no automatic movement.
EXP-03-09-05 No implicit Climate effects exist.
EXP-03-09-06 No upkeep is introduced.

---

# EXP-03-10 RULE INTERACTION

EXP-03-10-01 If EXP-03 is inactive, CLM and Countdown rules do not exist.
EXP-03-10-02 Climate cost increases stack additively with Regulation cost increases.
EXP-03-10-03 Regulation Blockade overrides Climate cost modifications.
EXP-03-10-04 For every active expansion combination, use the single canonical production pipeline in CORE-01-06-16/-16A/-17: printed value, permitted doubling, combined applicable additive output modifiers from Measures and Regulations, one minimum-0 floor, canonical majority, regular shares/original Noise remainder, then recipient limits and final transfers. This includes EXP-01 output reductions and Regulation reductions; source-specific exclusions such as Investment Freeze still apply. No additional object type or production calculation is introduced.
EXP-03-10-05 Measures cannot override CORE Rule Hierarchy.
EXP-03-10-06 No rule in EXP-03 introduces automatic Countdown resolution.

---

END OF EXP-03 v1.0
