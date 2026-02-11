# EXP-03 — Climate & Future

Fully Engine-Formalized Specification v1.0
Requires: CORE-01 (v1.0.14) 
Compatible with: EXP-01 (v1.3) , EXP-02 (v1.0) 

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
EXP-03-00-05 EXP-03 introduces one Hotspot Tile “Transformationsdruck”.
EXP-03-00-06 EXP-03 introduces a Measure deck.
EXP-03-00-07 Victory conditions remain unchanged.
EXP-03-00-08 EXP-03 introduces CountdownMarkers as persistent state objects attached to exactly one Hotspot.
EXP-03-00-09 No automatic round-based triggers are introduced.

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

EXP-03-02-A-02 For 5–6 players add:
• +2 additional CLM ResortTiles (identical distribution logic as other resorts).

EXP-03-02-A-03 CLM ResortTiles are ResortTiles.
EXP-03-02-A-04 CLM ResortTiles follow CORE Resort production rules.

---

## EXP-03-02-B Hotspot — Transformationsdruck

EXP-03-02-B-01 Add Hotspot “Transformationsdruck” ×1 to DrawPile.
EXP-03-02-B-02 Transformationsdruck resolves using CORE Hotspot majority rules.
EXP-03-02-B-03 Transformationsdruck produces no Resources.
EXP-03-02-B-04 Transformationsdruck may hold CountdownMarkers.

---

## EXP-03-02-C CountdownMarker

EXP-03-02-C-01 CountdownMarker is a persistent object type.
EXP-03-02-C-02 A CountdownMarker exists in exactly one of two zones: CountdownSupply or BoardAttached.
EXP-03-02-C-03 A CountdownMarker attached to Board references exactly one Transformationsdruck Hotspot.
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
(a) requires CLM as cost, or
(b) references CLM explicitly in its effect text, or
(c) references “Climate effect”, or
(d) modifies costs or prohibitions based on Climate measures.

EXP-03-02-D-02 Effects not meeting EXP-03-02-D-01 are not Climate effects.

---

# EXP-03-03 SETUP

EXP-03-03-01 Shuffle CLM ResortTiles into DrawPile.
EXP-03-03-02 Shuffle all EXP-03 Measures to form the EXP-03 MeasureDrawPile.
EXP-03-03-03 Place exactly 3 EXP-03 Measures face up in EXP-03 OpenMeasures.
EXP-03-03-04 Add Transformationsdruck Hotspot ×1 to DrawPile.
EXP-03-03-05 No modification to Starting Influence.
EXP-03-03-06 No modification to Round structure.

---

# EXP-03-04 ROUND & COUNTDOWN MODEL

## EXP-03-04-A Round Definition

EXP-03-04-A-01 A round consists of one full cycle of player turns followed by Round Settlement.
EXP-03-04-A-02 “This turn” refers to the active player’s current turn from Phase 1 start until Political Action resolution ends.
EXP-03-04-A-03 “This round” refers to the current round until the next Round Settlement begins.
EXP-03-04-A-04 “Next round” refers to the round immediately following the next Round Settlement.

---

## EXP-03-04-B Countdown Placement

EXP-03-04-B-01 CountdownMarkers are placed only when an effect explicitly instructs placement.
EXP-03-04-B-02 Placement requires moving one CountdownMarker from CountdownSupply to BoardAttached on Transformationsdruck.
EXP-03-04-B-03 If CountdownSupply is empty, placement fails with no partial effect.
EXP-03-04-B-04 Placement is not automatic at any timing window.
EXP-03-04-B-05 No CountdownMarker moves automatically between rounds.

---

## EXP-03-04-C Countdown Prohibition

EXP-03-04-C-01 If an effect prohibits placement of CountdownMarkers, placement attempts fail.
EXP-03-04-C-02 Prohibition prevents placement before cost payment.
EXP-03-04-C-03 If placement is prohibited, no cost for placement is paid.

---

# EXP-03-05 PRODUCTION RULES

EXP-03-05-01 CLM production follows CORE Resort Production timing.
EXP-03-05-02 Production during Round Settlement follows CORE-01-06-16 (Production Resolution Order).
EXP-03-05-03 Climate Measures that modify production are applied as “production output modifiers” in CORE-01-06-16(a)(3).
EXP-03-05-04 If EXP-02 is active, Regulation-based output reductions (SecurityLevel) are also applied as “production output modifiers” in CORE-01-06-16(a)(3), following EXP-02-04-B (Regulation Resolution Order) for effect modification.
EXP-03-05-05 Climate never replaces other Resources during production unless explicitly stated.

---

# EXP-03-06 POLITICAL ACTION INTERACTION

EXP-03-06-01 Political Actions remain unchanged from CORE-01 and EXP-01.
EXP-03-06-02 Climate Measures are played via PlayMeasure rules (EXP-01 lifecycle).
EXP-03-06-03 Climate effects that increase costs add +1 Resource of any resort unless otherwise specified.
EXP-03-06-04 Additional costs must be paid before effect execution.
EXP-03-06-05 If additional costs cannot be paid, the effect fails completely.

EXP-03-06-06 Majority suppression effects prevent Influence placement but do not alter majority determination.
EXP-03-06-07 Suppressed Influence is not placed and no replacement occurs unless explicitly defined.

---

# EXP-03-07 MEASURE SYSTEM

EXP-03-07-00-01 EXP-03 uses its own Measure zones (separate from any other expansion).
EXP-03-07-01 Measures follow EXP-01 lifecycle rules.
EXP-03-07-02 Allowed timing windows:
• This turn
• This round
• During Round Settlement
• Next round
• Until consumed

EXP-01-07-03 Per-Round Usage Flags
If a Measure grants an effect limited to “once this round”, the engine tracks a boolean flag per player and per measure instance: usedThisRound.
usedThisRound resets for all players at the beginning of each Round (immediately after Round Settlement ends).
EXP-03-07-04 No other timing windows exist.
EXP-03-07-05 Measures do not create hidden state.
EXP-03-07-06 Measures cannot bypass prohibitions unless explicitly stated.

---

Hier ist die **identische, vollständig durchnummerierte Measure-Sektion**,
mit **ausschließlich englischen Titeln**.
Keine weiteren Änderungen.
Keine Strukturveränderung.
Keine impliziten Ergänzungen.

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
EXP-03-08-M05-04 Effect: Effects do not generate Influence.
EXP-03-08-M05-05 Replacement Rule: An affected player may pay 1 CLM or 1 INF to generate Influence normally for themselves.
EXP-03-08-M05-06 If the replacement cost is not paid, no Influence is generated.

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
EXP-03-08-M07-04 Effect: Majority does not generate Influence.

---

## EXP-03-08-M08 — Adaptation Strategy

EXP-03-08-M08-01 Name: Adaptation Strategy.
EXP-03-08-M08-02 Cost: CLM + CLM.
EXP-03-08-M08-03 Duration: Until the beginning of your next turn.
EXP-03-08-M08-04 Effect: Actions that would incur additional costs from Climate effects incur none.

---

## EXP-03-08-M09 — Technology Initiative

EXP-03-08-M09-01 Name: Technology Initiative.
EXP-03-08-M09-02 Cost: CLM + ECO + DOM.
EXP-03-08-M09-03 Duration: This turn.
EXP-03-08-M09-04 Timing: Before executing your Political Action.
EXP-03-08-M09-05 Effect: Ignore additional costs imposed by Climate effects for that Action.

---

## EXP-03-08-M10 — Future Pact

EXP-03-08-M10-01 Name: Future Pact.
EXP-03-08-M10-02 Cost: CLM + DOM + FOR.
EXP-03-08-M10-03 Duration: Until the beginning of your next turn.
EXP-03-08-M10-04 Effect: Climate Measures affecting you do not impose additional costs.

---

## EXP-03-08-M11 — Supply Chain Disruption

EXP-03-08-M11-01 Name: Supply Chain Disruption.
EXP-03-08-M11-02 Cost: CLM + ECO.
EXP-03-08-M11-03 Target: One player.
EXP-03-08-M11-04 Duration: Until the beginning of your next turn.
EXP-03-08-M11-05 Effect: During each production instance, that player receives at most 1 Resource.

---

## EXP-03-08-M12 — Extreme Weather Event

EXP-03-08-M12-01 Name: Extreme Weather Event.
EXP-03-08-M12-02 Cost: CLM.
EXP-03-08-M12-03 Duration: Until the beginning of your next turn.
EXP-03-08-M12-04 Effect: Placing ResortTiles requires +1 CLM or +1 DOM.
EXP-03-08-M12-05 If the additional cost cannot be paid, placement fails.

---

## EXP-03-08-M13 — Intergenerational Pact

EXP-03-08-M13-01 Name: Intergenerational Pact.
EXP-03-08-M13-02 Cost: CLM + DOM.
EXP-03-08-M13-03 Duration: Until consumed.
EXP-03-08-M13-04 Effect: When additional costs occur, you may transfer exactly 1 of those additional cost components to another player.
EXP-03-08-M13-05 The effect is consumed immediately after one transfer.
EXP-03-08-M13-06 Transfer Rule (Deterministic)
The chosen other player must pay the transferred cost component from their PersonalSupply.
If the chosen player cannot fully pay that component, the original action fails and no state change occurs.
EXP-03-08-M13-07 No Refusal
The chosen player may not refuse the transfer.

---

## EXP-03-08-M14 — Transformation Blockade

EXP-03-08-M14-01 Name: Transformation Blockade.
EXP-03-08-M14-02 Cost: CLM + INF.
EXP-03-08-M14-03 Duration: Until the beginning of your next turn.
EXP-03-08-M14-04 Effect: Effects that place CountdownMarkers require +1 CLM or +1 DOM.
EXP-03-08-M14-05 If the additional cost cannot be paid, the Countdown placement fails.

---

## EXP-03-08-M15 — Future Committee

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
EXP-03-10-04 If both EXP-01 and EXP-03 production modifiers apply, apply EXP-01 doubling first, then Climate modifications, then Overlay reductions.
EXP-03-10-05 Measures cannot override CORE Rule Hierarchy.
EXP-03-10-06 No rule in EXP-03 introduces automatic Countdown resolution.

---

END OF EXP-03 v1.0
