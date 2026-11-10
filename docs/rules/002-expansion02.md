# EXP-02 — Security & Order

Fully Engine-Formalized Specification v1.0
Requires: CORE-01 (v1.0.14) 
Compatible with: EXP-01 (v1.3)
Applied errata: ERRATA-0003 (2026-11-07, movement ContextTile).
Applied errata: ERRATA-0006 (2026-11-07, one-time Hotspot resolution).
Applied errata: ERRATA-0009 (2026-11-07, Measure acquisition and market refill).
Applied errata: ERRATA-0010 (2026-11-07, shared Measure framework).
Applied errata: ERRATA-0012 (2026-11-07, future Measure triggers).
Applied errata: ERRATA-0013 (2026-11-07, Authority Apparatus activation).
Applied errata: ERRATA-0014 (2026-11-07, effect costs and payers).
Applied errata: ERRATA-0015 (2026-11-07, Round Settlement sequence).

---

# SECTION INDEX

EXP-02-00 Scope
EXP-02-01 SEC Resource
EXP-02-02 Components & Definitions
EXP-02-03 Setup
EXP-02-04 Regulation Model
EXP-02-05 System Tile
EXP-02-06 Political Action Extension
EXP-02-07 Measure System
EXP-02-08 Measure Definitions
EXP-02-09 Restrictions
EXP-02-10 Rule Interaction

---

# EXP-02-00 SCOPE

EXP-02-00-01 EXP-02 extends CORE-01.
EXP-02-00-02 CORE-01 remains valid unless explicitly overridden.
EXP-02-00-03 EXP-02 introduces the Resource type SEC.
EXP-02-00-04 EXP-02 introduces the persistent object type Regulation.
EXP-02-00-05 EXP-02 introduces one System Tile and one Hotspot Tile.
EXP-02-00-06 EXP-02 introduces a Measure deck.
EXP-02-00-07 Victory conditions remain unchanged.
EXP-02-00-08 Security produces no Resources.

---

# EXP-02-01 SEC RESOURCE

EXP-02-01-01 SEC is a Resource type.
EXP-02-01-02 SEC represents Security.
EXP-02-01-03 SEC behaves identically to DOM, FOR, INF unless explicitly modified.
EXP-02-01-04 SEC counts as a distinct resort for all “different resorts” requirements.
EXP-02-01-05 SEC may be used wherever “a Resource” is required.
EXP-02-01-06 SEC exists only while EXP-02 is active.

---

# EXP-02-02 COMPONENTS & DEFINITIONS

## EXP-02-02-A Regulation

EXP-02-02-A-01 A Regulation is a persistent modifier attached to exactly one Tile on Board.
EXP-02-02-A-02 A Regulation is not a Tile and not a Resource.
EXP-02-02-A-03 A Regulation exists in exactly one of two zones: RegulationSupply or BoardAttached.
EXP-02-02-A-04 When attached, a Regulation references exactly one target Tile.
EXP-02-02-A-05 Regulations modify effects, not ownership.
EXP-02-02-A-06 Regulations apply to all players equally.
EXP-02-02-A-07 Regulations have no upkeep.
EXP-02-02-A-08 There is no limit to the number of Regulations in RegulationSupply.
EXP-02-02-A-09 Multiple Regulations may be attached to the same Tile.
EXP-02-02-A-10 Regulations stack independently.

---

## EXP-02-02-B Regulation Types

EXP-02-02-B-01 Exactly four Regulation types exist:

• SecurityLevel
• Control
• Administration
• Blockade

EXP-02-02-B-02 Each applicable SecurityLevel reduces the Resource or Influence output quantity defined in EXP-02-02-B-02A by 1, with a minimum output of 0. Apply Tile-local SecurityLevel only at the assigned ContextTile and preserve Start Committee immunity.
EXP-02-02-B-02A Reducible outputs are Resort Production before distribution/Noise; Resource output from ConvertResources, including Investment Program; direct Resource gains such as Future Investment; new Influence from FormalizeInfluence; and the normal Hotspot Influence payout, including Labor Market. A Hotspot's granted Influence payout is reducible even though it transfers an existing marker from PersonalSupply rather than creating a new one. This classification modifies the prescribed output quantity, not the underlying prerequisites or payment requirements.
EXP-02-02-B-02B SecurityLevel does not reduce ordinary PlaceOrMoveInfluence or RecallInfluence; Regulation placement, movement, or removal, including Authority Apparatus and Inner Order operations; card taking, refill, or recycling; Tile placement; majority or virtual Influence; costs or payments; prohibitions, durations, or other nonnumeric modifiers. Counting objects in an instruction does not by itself make that instruction a reducible output.

EXP-02-02-B-03 Control increases effect cost by +1 Resource.
EXP-02-02-B-04 Control may only be attached to Tiles that neither produce nor convert Resources.

EXP-02-02-B-05 Administration increases effect cost by +1 Resource.
EXP-02-02-B-06 Administration may only be attached to Tiles that produce or convert Resources.

EXP-02-02-B-07 Blockade prohibits effect execution.

---

## EXP-02-02-C Cost Increase

EXP-02-02-C-01 “Cost increase” means adding +1 Resource of any resort to the total cost.
EXP-02-02-C-02 Additional costs must be paid before effect execution.
EXP-02-02-C-03 If total cost cannot be fully paid, the effect does not resolve.
EXP-02-02-C-04 If effect does not resolve, no partial effect occurs.
EXP-02-02-C-05 Regulation cost increases follow CORE-01-06-00-07 through -09. They apply to player-paid resolutions, including base-cost-0 actions, but not to automatic Resort Production or the normal Hotspot Influence payout. Prohibitions and output reductions are not waived by this cost exemption.

---

## EXP-02-02-D Prohibition

EXP-02-02-D-01 “Prohibition” means the effect cannot be executed.
EXP-02-02-D-02 No costs are paid if execution is prohibited before cost payment.
EXP-02-02-D-03 Blockade prohibits effects whose ContextTile is its Tile; by itself, it does not prohibit an object from leaving that Tile when the effect's assigned ContextTile is elsewhere. Explicit movement or removal restrictions still apply under CORE-01-06-00-05B.

---

## EXP-02-02-E Removal

EXP-02-02-E-01 “Removal” means moving a Regulation from BoardAttached to RegulationSupply.
EXP-02-02-E-02 Removal does not refund placement costs.
EXP-02-02-E-03 When a Measure directly instructs removal of a Regulation, ContextTile is the Tile carrying that Regulation. Removal embedded in an Authority Apparatus activation follows EXP-02-05-04 instead.

---

## EXP-02-02-F Move Regulation

EXP-02-02-F-01 “Move Regulation” means transferring a Regulation from one Tile to another Tile.
EXP-02-02-F-02 Move Regulation does not change the Regulation type.
EXP-02-02-F-03 Move Regulation does not require additional SEC unless explicitly stated.
EXP-02-02-F-04 When a Measure directly instructs movement of a Regulation between two Tiles, ContextTile is the destination Tile. Movement embedded in an Authority Apparatus activation follows EXP-02-05-04 instead. The source must contain the Regulation, the destination must be permitted for its Regulation type, and explicit movement restrictions on the Regulation must be satisfied.

---

## EXP-02-02-G Hotspot "Inner Order"

EXP-02-02-G-01 Name: Inner Order.
EXP-02-02-G-02 Type: Hotspot Tile.
EXP-02-02-G-03 Resolution Trigger: Full enclosure, following CORE Hotspot rules.
EXP-02-02-G-04 Resolution Effect: Majority leader may either
(a) place exactly one Regulation, or
(b) move one existing Regulation.
EXP-02-02-G-05 If placement is chosen, normal placement cost applies.
EXP-02-02-G-05A The majority leader pays the costs of the chosen Regulation operation from PersonalSupply. This voluntary operation is a player-paid resolution under CORE-01-06-00-07(b), not the exempt normal Hotspot Influence payout; a base-cost-0 movement can still incur applicable increases.
EXP-02-02-G-05B ContextTile of this Hotspot outcome remains Inner Order, including an embedded Regulation placement or movement referencing other Tiles. Apply local effect modifiers once there. Regulation destination eligibility and explicit restrictions on the affected Regulation remain additional legality checks under CORE-01-06-00-05B, without another local modifier pass at remote Tiles.
EXP-02-02-G-06 Inner Order produces no Resources.
EXP-02-02-G-07 Inner Order does not generate Influence.

---

# EXP-02-03 SETUP

EXP-02-03-01 Shuffle all EXP-02 Measures to form the EXP-02 MeasureDrawPile.
EXP-02-03-02 Place exactly 3 EXP-02 Measures face up in EXP-02 OpenMeasures.
EXP-02-03-03 Add Hotspot “Inner Order” ×1 to DrawPile.
EXP-02-03-04 Add System Tile “Authority Apparatus” ×1 to DrawPile.
EXP-02-03-05 No modification to Starting Influence.
EXP-02-03-06 No modification to Round structure.

---

# EXP-02-04 REGULATION MODEL

## EXP-02-04-A Placement

EXP-02-04-A-01 Placing a Regulation normally costs exactly 2 SEC.
EXP-02-04-A-02 Cost is paid from PersonalSupply to Bank.
EXP-02-04-A-03 Cost must be paid in full simultaneously.
EXP-02-04-A-04 If cost cannot be paid, placement fails.
EXP-02-04-A-05 After payment, move Regulation from RegulationSupply to BoardAttached.
EXP-02-04-A-06 If a Measure explicitly instructs to place a Regulation, placement cost applies unless the Measure explicitly overrides placement cost. Immediate placement shares the Measure's cost basis under CORE-01-06-00-08; an explicitly later triggered placement is a separate resolution under CORE-01-06-00-09.
EXP-02-04-A-07 When a Measure directly instructs placement of a Regulation on a Tile, ContextTile is that target Tile. The target must be permitted for the chosen Regulation type.

---

## EXP-02-04-B Resolution Order

EXP-02-04-B-01 When resolving an effect on a Tile, evaluate Regulations in the following order:

1. Blockade
2. Cost increases (Control and Administration)
3. Output reduction (SecurityLevel)

EXP-02-04-B-02 Multiple cost increases stack additively.
EXP-02-04-B-03 Multiple SecurityLevel Regulations stack additively.
EXP-02-04-B-04 Minimum output after reduction is 0.
EXP-02-04-B-05 An otherwise legal, fully payable action whose output is reduced to 0 remains legal and resolves successfully. Pay its full applicable costs and consume its action slot without refund. This includes ConvertResources and FormalizeInfluence; zero resulting gain is not an inability to execute the action. Such an available option prevents mandatory completion without an action under CORE-01-04-09A/-09B.
EXP-02-04-B-06 A prohibition, invalid target, unmet prerequisite, or inability to pay still prevents resolution under its applicable rule. The zero-output rule does not waive any such requirement, any explicit consumption-on-failure exception, or Start Committee immunity.
EXP-02-04-B-07 A Hotspot payout reduced to 0 still processes its enclosure event exactly once under CORE-01-06-04A. No payout is deferred or retried when SecurityLevel later ceases to apply.

---

## EXP-02-04-C Interaction with CORE Majority

EXP-02-04-C-01 Regulations do not alter majority calculation.
EXP-02-04-C-02 Regulations modify effect resolution without altering the canonical majority calculation or moving canonical resolution steps. In Resort Production, SecurityLevel is an output modifier in CORE-01-06-16(a)(3), before majority and distribution in (b)/(c). For Hotspot events, follow CORE-01-06-04.
EXP-02-04-C-03 If Blockade applies to a Hotspot, its effect does not resolve.
EXP-02-04-C-04 A Hotspot's enclosure event is still processed when Blockade prevents its outcome, following CORE-01-06-04A. Removing or moving Blockade later does not retry or defer that Hotspot's resolution.

---

# EXP-02-05 SYSTEM TILE — AUTHORITY APPARATUS

EXP-02-05-01 Authority Apparatus is a System Tile that neither produces nor converts Resources. Its complete base function is ActivateAuthorityApparatus as defined below.
EXP-02-05-02 ActivateAuthorityApparatus is a Political Action performed via the Apparatus. The active player must control that Apparatus under the canonical majority rules, including applicable virtual Influence, and chooses exactly one of:

(a) Move exactly one existing Regulation from a Board Tile to another legal Board Tile, or
(b) Remove exactly one existing Regulation from a Board Tile to RegulationSupply.

EXP-02-05-02A The Regulation may be on any Tile on Board; no additional adjacency requirement applies. Activation does not place a new Regulation from RegulationSupply.
EXP-02-05-03 The activation has a base Resource cost of 0. Explicitly applicable cost modifiers still apply and must be paid by the active player from PersonalSupply to Bank before execution.
EXP-02-05-04 ContextTile for an Authority Apparatus activation is that Authority Apparatus Tile, including any Regulation movement or removal embedded in the activation. Evaluate Tile-local prohibitions, cost modifiers, and output modifiers once at the Apparatus; do not apply another Tile's local effect modifiers a second time to the embedded operation.
EXP-02-05-05 Embedded movement or removal must still satisfy explicit restrictions on the Regulation, including Surveillance on its source Tile. A movement destination must be permitted for the Regulation type. These checks do not create another ContextTile.
EXP-02-05-06 ActivateAuthorityApparatus may be the one additional otherwise legal non-PlayMeasure action granted by PlayMeasure. It does not itself grant any additional Political Action.

---

# EXP-02-06 POLITICAL ACTION EXTENSION

EXP-02-06-01 With EXP-02 active, Political Actions include the CORE-01 actions, ActivateAuthorityApparatus under EXP-02-05, and TakeMeasure/PlayMeasure from the shared framework in EXP-01-06. EXP-01 need not be active; shared Measure limits and additional-action rules apply across all enabled Measure decks.
EXP-02-06-02 Regulation placement is not a standalone Political Action.
EXP-02-06-03 Regulation placement occurs only via:

(a) Hotspot resolution, or
(b) Measure effects.

---

# EXP-02-07 MEASURE SYSTEM

EXP-02-07-00-01 EXP-02 uses its own Measure zones (separate from any other expansion).
EXP-02-07-01 EXP-02 Measures use the shared framework defined under EXP-01-06-00, including its lifecycle rules. Referencing those definitions does not activate EXP-01, ECO, or EXP-01 cards or zones.
EXP-02-07-01A For any otherwise permitted EXP-02 TakeMeasure or PlayMeasure, use the acquisition procedure EXP-01-06-04 through -04D and market/lifecycle procedure EXP-01-07-01 through -05D within EXP-02's own zones. Its OpenMeasures has the three ordered slots from EXP-01-02-E-01B, and its cards start with play counter 0 and no cards in PlayerHand under EXP-01-03-06. These procedural references do not by themselves grant new action timings.
EXP-02-07-01B Emergency Decree and Deployment Order are played only through ordinary PlayMeasure timing. Registering their future effects completes their immediate resolution for card lifecycle and the granted additional action. A later trigger resolves an already registered effect, not a new PlayMeasure, and grants no additional Political Action. No new permission to play a card from hand during DrawAndPlaceTile or another player's turn is granted.
EXP-02-07-01C EXP-02 uses the shared active-effect procedure in EXP-01-06-05D and EXP-01-07-08 through -15, including triggered-operation ordering and successful/failed PlayMeasure handling. Registered effects remain independent of their physical cards and of any later play of those cards.
EXP-02-07-02 Use the shared duration vocabulary and boundaries in CORE-01-07-07 through -18, including each expressly defined card duration. Specific overrides follow CORE-01-10; this grants no new PlayMeasure timing.

EXP-02-07-04 Per-Round Usage Flags
If a Measure grants an effect limited to “once this round”, the engine tracks a boolean flag per player and per active effect instance under EXP-01-07-08: usedThisRound. Card recycling, drawing, or replay does not reset an existing instance's flag.
Reset usedThisRound only at an actually begun new round after Settlement and due effect expiry under CORE-01-07-17, not after the final Settlement.
EXP-02-07-03 No additional play window is inferred from a duration. Ordinary PlayMeasure timing and explicit registered triggers remain applicable under the shared game clock.

---

# EXP-02-08 MEASURE DEFINITIONS

## EXP-02-08-M01 — Threat Situation

EXP-02-08-M01-01 Cost: SEC + INF.
EXP-02-08-M01-02 Duration: This turn.
EXP-02-08-M01-03 Effect: Place exactly one Regulation of your choice.

---

## EXP-02-08-M02 — Emergency Decree

EXP-02-08-M02-01 Cost: SEC + SEC.
EXP-02-08-M02-02 Duration: Until consumed.
EXP-02-08-M02-03 Target and effect: When played, choose one Hotspot on Board that is not fully surrounded and whose enclosure event is unprocessed. Before majority calculation in that Hotspot's first enclosure event, attempt to place exactly one Blockade on it.
EXP-02-08-M02-04 The player who played this Measure pays the normal Regulation placement cost and applicable modifiers at that trigger, in addition to the card cost already paid when playing the Measure. Apply the ordinary placement restrictions and ContextTile rules. If placement is prohibited or cannot be fully paid, no Blockade is placed and no placement cost is paid.
EXP-02-08-M02-05 Consume the registered effect after its first triggered placement attempt, including a failed attempt. Previously paid card costs are not refunded. Continue the Hotspot event under CORE-01-06-04; neither this effect nor the Hotspot payout is retried later.

---

## EXP-02-08-M03 — Deployment Order

EXP-02-08-M03-01 Cost: SEC.
EXP-02-08-M03-02 Duration: Until consumed.
EXP-02-08-M03-03 Effect: After the next successful Regulation placement performed by the player who played this Measure, that player may immediately move exactly that newly placed Regulation to another legal Tile. This registered follow-up is not a Political Action.
EXP-02-08-M03-04 Apply normal Regulation movement rules, including destination-type legality, explicit movement restrictions, and any applicable modifiers or costs. Consume this effect after that first triggering placement, whether the player moves the Regulation, declines, or cannot perform a legal fully paid movement. If no movement resolves, the successful placement remains in effect and is not rolled back.

---

## EXP-02-08-M04 — Jurisdiction Shift

EXP-02-08-M04-01 Cost: SEC.
EXP-02-08-M04-02 Duration: This turn.
EXP-02-08-M04-03 Effect: Move one existing Regulation.

---

## EXP-02-08-M05 — Competence Conflict

EXP-02-08-M05-01 Cost: SEC + DOM.
EXP-02-08-M05-02 Duration: This turn.
EXP-02-08-M05-03 Effect: After the next successful Authority Apparatus activation performed by the player who played this Measure during this turn, that player may place exactly one Control Regulation on that Apparatus.
EXP-02-08-M05-04 This optional placement is a separate, subsequent Measure effect, using that Apparatus as ContextTile. The Measure's player pays normal Regulation placement costs and applicable modifiers at that time, in addition to the unchanged card cost. Existing Regulation restrictions apply; declining or failing placement does not undo the successful activation.
EXP-02-08-M05-05 The newly placed Control affects only subsequent effects, not the already completed activation. Offer this placement once after the triggering activation; if no such activation occurs this turn, the Measure expires without this placement. This effect grants no additional Political Action.

---

## EXP-02-08-M06 — Order Partnership

EXP-02-08-M06-01 Cost: SEC + FOR.
EXP-02-08-M06-02 Duration: This round.
EXP-02-08-M06-03 Effect: During this round, SEC may substitute any one Resource when paying Regulation or Measure costs.

---

## EXP-02-08-M07 — Legal Review

EXP-02-08-M07-01 Cost: SEC + DOM.
EXP-02-08-M07-02 Duration: This turn.
EXP-02-08-M07-03 Effect: Remove one Regulation.

---

## EXP-02-08-M08 — De-escalation

EXP-02-08-M08-01 Cost: SEC + INF.
EXP-02-08-M08-02 Duration: During Round Settlement.
EXP-02-08-M08-03 Effect: Remove all Regulations from one Hotspot.
EXP-02-08-M08-04 Resolve the registered one-time operation before Resort Production in the applicable Settlement under CORE-01-07-04(b). This does not permit playing a new Measure during Settlement.

---

## EXP-02-08-M09 — Parliamentary Oversight

EXP-02-08-M09-01 Cost: DOM + SEC.
EXP-02-08-M09-02 Duration: This round.
EXP-02-08-M09-03 Effect: Each Regulation adds +1 additional Resource cost when applied.

---

## EXP-02-08-M10 — State of Exception

EXP-02-08-M10-01 Cost: SEC + SEC + DOM.
EXP-02-08-M10-02 Duration: This round.
EXP-02-08-M10-03 Effect: Each player-paid resolution under CORE-01-06-00-07(b) costs +1 additional Resource, including actions with base cost 0. Automatic Resort Production and the normal Hotspot Influence payout receive no such surcharge. Apply the one-pass and later-operation boundaries under CORE-01-06-00-08/-09.

---

## EXP-02-08-M11 — Risk Address

EXP-02-08-M11-01 Cost: SEC.
EXP-02-08-M11-02 Duration: Next round.
EXP-02-08-M11-03 Effect: Target player may not PlayMeasure during next round.

---

## EXP-02-08-M12 — Loss of Control

EXP-02-08-M12-01 Cost: SEC + SEC.
EXP-02-08-M12-02 Duration: During Round Settlement.
EXP-02-08-M12-03 Effect: Place exactly one Regulation on one Hotspot (pay placement cost).
EXP-02-08-M12-04 Resolve the registered one-time operation before Resort Production in the applicable Settlement under CORE-01-07-04(b), paying its placement costs at that resolution under CORE-01-06-00-09. This does not permit playing a new Measure during Settlement.

---

## EXP-02-08-M13 — Surveillance

EXP-02-08-M13-01 Cost: SEC + INF.
EXP-02-08-M13-02 Duration: This round.
EXP-02-08-M13-03 Effect: Regulations on chosen Tile may not be moved or removed.

---

## EXP-02-08-M14 — File Status

EXP-02-08-M14-01 Cost: SEC + DOM.
EXP-02-08-M14-02 Duration: This round.
EXP-02-08-M14-03 Effect: One Regulation on chosen Tile counts twice for stacking calculation.

---

## EXP-02-08-M15 — Situation Assessment

EXP-02-08-M15-01 Cost: SEC.
EXP-02-08-M15-02 Duration: This round.
EXP-02-08-M15-03 Effect: Reduce cost of next Regulation placement this round by 1 SEC (minimum 1).

---

# EXP-02-09 RESTRICTIONS

EXP-02-09-01 Security produces no Resources.
EXP-02-09-02 Regulations do not modify Influence cap.
EXP-02-09-03 Regulations do not alter control ownership.
EXP-02-09-04 No Regulation creates Upkeep.
EXP-02-09-05 No implicit effects exist.

---

# EXP-02-10 RULE INTERACTION

EXP-02-10-01 If EXP-02 is inactive, SEC and Regulation rules do not exist.
EXP-02-10-02 Regulations do not override CORE-01 Rule Hierarchy.
EXP-02-10-03 Regulation cost increases apply to eligible player-paid resolutions under CORE-01-06-00-07 before execution. Automatic Resort Production has no Resource cost stage and retains the canonical production pipeline under CORE-01-06-16.
EXP-02-10-04 If multiple global cost modifiers apply, they stack additively.
EXP-02-10-05 Blockade overrides all other modifications.

---

END OF EXP-02 v1.0

---
