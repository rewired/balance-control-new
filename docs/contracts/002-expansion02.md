# EXP-02 — Security & Order

Fully Engine-Formalized Specification v1.0
Requires: CORE-01 (v1.0.14) 
Compatible with: EXP-01 (v1.3)

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

EXP-02-02-B-02 SecurityLevel reduces effect output by 1 (minimum 0).

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

---

## EXP-02-02-D Prohibition

EXP-02-02-D-01 “Prohibition” means the effect cannot be executed.
EXP-02-02-D-02 No costs are paid if execution is prohibited before cost payment.

---

## EXP-02-02-E Removal

EXP-02-02-E-01 “Removal” means moving a Regulation from BoardAttached to RegulationSupply.
EXP-02-02-E-02 Removal does not refund placement costs.

---

## EXP-02-02-F Move Regulation

EXP-02-02-F-01 “Move Regulation” means transferring a Regulation from one Tile to another Tile.
EXP-02-02-F-02 Move Regulation does not change the Regulation type.
EXP-02-02-F-03 Move Regulation does not require additional SEC unless explicitly stated.

---

## EXP-02-02-G Hotspot "Inner Order"

EXP-02-02-G-01 Name: Inner Order.
EXP-02-02-G-02 Type: Hotspot Tile.
EXP-02-02-G-03 Resolution Trigger: Full enclosure, following CORE Hotspot rules.
EXP-02-02-G-04 Resolution Effect: Majority leader may either
(a) place exactly one Regulation, or
(b) move one existing Regulation.
EXP-02-02-G-05 If placement is chosen, normal placement cost applies.
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
EXP-02-04-A-06 If a Measure explicitly instructs to place a Regulation, placement cost applies unless the Measure explicitly overrides placement cost.

---

## EXP-02-04-B Resolution Order

EXP-02-04-B-01 When resolving an effect on a Tile, evaluate Regulations in the following order:

1. Blockade
2. Cost increases (Control and Administration)
3. Output reduction (SecurityLevel)

EXP-02-04-B-02 Multiple cost increases stack additively.
EXP-02-04-B-03 Multiple SecurityLevel Regulations stack additively.
EXP-02-04-B-04 Minimum output after reduction is 0.

---

## EXP-02-04-C Interaction with CORE Majority

EXP-02-04-C-01 Regulations do not alter majority calculation.
EXP-02-04-C-02 Regulations modify only effect resolution after majority is determined.
EXP-02-04-C-03 If Blockade applies to a Hotspot, its effect does not resolve.

---

# EXP-02-05 SYSTEM TILE — AUTHORITY APPARATUS

EXP-02-05-01 Authority Apparatus is a System Tile.
EXP-02-05-02 Instead of its normal effect, a player may:

(a) Move one Regulation, or
(b) Remove one Regulation.

EXP-02-05-03 These actions do not cost SEC unless specified by another effect.

---

# EXP-02-06 POLITICAL ACTION EXTENSION

EXP-02-06-01 Political Actions remain unchanged from CORE-01.
EXP-02-06-02 Regulation placement is not a standalone Political Action.
EXP-02-06-03 Regulation placement occurs only via:

(a) Hotspot resolution, or
(b) Measure effects.

---

# EXP-02-07 MEASURE SYSTEM

EXP-02-07-00-01 EXP-02 uses its own Measure zones (separate from any other expansion).
EXP-02-07-01 Measures follow EXP-01 lifecycle rules.
EXP-02-07-02 Timing windows allowed:

• This turn
• This round
• During Round Settlement
• Next round
• Until consumed

EXP-02-07-04 Per-Round Usage Flags
If a Measure grants an effect limited to “once this round”, the engine tracks a boolean flag per player and per measure instance: usedThisRound.
usedThisRound resets for all players at the beginning of each Round (immediately after Round Settlement ends).
EXP-02-07-03 No other timing windows exist.

---

# EXP-02-08 MEASURE DEFINITIONS

## EXP-02-08-M01 — Threat Situation

EXP-02-08-M01-01 Cost: SEC + INF.
EXP-02-08-M01-02 Duration: This turn.
EXP-02-08-M01-03 Effect: Place exactly one Regulation of your choice.

---

## EXP-02-08-M02 — Emergency Decree

EXP-02-08-M02-01 Cost: SEC + SEC.
EXP-02-08-M02-02 Duration: This turn.
EXP-02-08-M02-03 Effect: Before majority resolution of a Hotspot, place Blockade on that Hotspot.

---

## EXP-02-08-M03 — Deployment Order

EXP-02-08-M03-01 Cost: SEC.
EXP-02-08-M03-02 Duration: This turn.
EXP-02-08-M03-03 Effect: After placing a Regulation, move that Regulation to another Tile.

---

## EXP-02-08-M04 — Jurisdiction Shift

EXP-02-08-M04-01 Cost: SEC.
EXP-02-08-M04-02 Duration: This turn.
EXP-02-08-M04-03 Effect: Move one existing Regulation.

---

## EXP-02-08-M05 — Competence Conflict

EXP-02-08-M05-01 Cost: SEC + DOM.
EXP-02-08-M05-02 Duration: This turn.
EXP-02-08-M05-03 Effect: When activating Authority Apparatus, place Administration on that Tile.

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

---

## EXP-02-08-M09 — Parliamentary Oversight

EXP-02-08-M09-01 Cost: DOM + SEC.
EXP-02-08-M09-02 Duration: This round.
EXP-02-08-M09-03 Effect: Each Regulation adds +1 additional Resource cost when applied.

---

## EXP-02-08-M10 — State of Exception

EXP-02-08-M10-01 Cost: SEC + SEC + DOM.
EXP-02-08-M10-02 Duration: This round.
EXP-02-08-M10-03 Effect: All effects cost +1 additional Resource.

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
EXP-02-10-03 If EXP-01 and EXP-02 are both active, cost increases from Regulations apply before EXP-01 production modifiers.
EXP-02-10-04 If multiple global cost modifiers apply, they stack additively.
EXP-02-10-05 Blockade overrides all other modifications.

---

END OF EXP-02 v1.0

---