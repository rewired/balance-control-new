# BALANCE // CONTROL

# CORE-01 Simulation Specification (Atomic, Deterministic)

Version: 01
Scope: Core Rules v1.0.14 only with variants (no expansions)

---

# SECTION INDEX

CORE-01-00 State Model (Declarative)
CORE-01-01 Foundations
CORE-01-02 Components
CORE-01-03 Setup
CORE-01-04 Turn Structure
CORE-01-05 Control
CORE-01-06 Effects
CORE-01-07 Round Structure
CORE-01-08 Restrictions
CORE-01-09 End Game
CORE-01-10 Rule Hierarchy
VAR-01 Variants
ADD56-01 5–6 Player Add-On

---

# CORE-01-00 STATE MODEL (Declarative)

CORE-01-00-01 Every game object exists in exactly one zone at any time.
CORE-01-00-02 Zones are containers; moving an object means transferring it between zones.
CORE-01-00-03 Influence zones are: PersonalSupply, Board.
CORE-01-00-04 Resource zones are: PersonalSupply, Bank, Noise.
CORE-01-00-05 Tile zones are: DrawPile, Board, DiscardFaceUp.
CORE-01-00-06 No object may exist in multiple zones simultaneously.
CORE-01-00-07 The board uses a topology parameter that defines adjacency between Tiles.
CORE-01-00-08 Any rule that references adjacency uses the current topology’s adjacency definition.
CORE-01-00-09 A topology attachment must be defined before game start.
CORE-01-00-10 The topology attachment specifies how adjacency between Tiles is determined.
CORE-01-00-11 The topology attachment does not modify any other rule.

---

# TOPOLOGY ATTACHMENT (Implementation Contract)

CORE-01-00-T01 A topology implementation must define a function Adjacent(TileA, TileB) → Boolean.
CORE-01-00-T02 Adjacent(TileA, TileB) must be deterministic.
CORE-01-00-T03 All adjacency-based rules reference Adjacent(TileA, TileB).
CORE-01-00-T04 The topology implementation may represent hexagonal, orthogonal, or other grid structures.
CORE-01-00-T05 Changing topology does not alter any rule outside adjacency evaluation.

---

# CORE-01-01 FOUNDATIONS

CORE-01-01-01 Influence is the only victory metric.
CORE-01-01-02 Resources exist solely to enable Influence-related actions.
CORE-01-01-03 Relative majority enables control.
CORE-01-01-04 Tie results in no control.

---

# CORE-01-02 COMPONENTS

CORE-01-02-01 The game contains exactly one Start Committee tile.
CORE-01-02-02 The Start Committee tile is not part of the DrawPile.
CORE-01-02-03 A tile in the DrawPile is drawn only during DrawAndPlaceTile.

CORE-01-02-04 Core tile types are: ResortTiles, Committees, Grassroots, Lobbyists, Hotspots.

CORE-01-02-04A The core game defines exactly three Resource resorts: DOM, FOR, INF.
CORE-01-02-04B DOM represents Domestic Affairs.
CORE-01-02-04C FOR represents Foreign Affairs.
CORE-01-02-04D INF represents Information / Media Control.
CORE-01-02-04E A “Resource type” in this specification refers exclusively to one of these resorts.
CORE-01-02-04F No additional Resource resorts exist in CORE-01 unless introduced by an explicit expansion.
CORE-01-02-04G Each Resource object has exactly one resort attribute.

CORE-01-02-05 ResortTiles produce Resources during Round Settlement.
CORE-01-02-06 Committees enable the FormalizeInfluence action.
CORE-01-02-07 Grassroots enable the ConvertResources action.
CORE-01-02-08 Lobbyists contribute virtual Influence for majority calculation only.
CORE-01-02-09 Hotspots resolve when fully surrounded.

CORE-01-02-10 Core tile counts (DOM ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-11 Core tile counts (FOR ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-12 Core tile counts (INF ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-13 Core tile counts (Committees): ×10.
CORE-01-02-14 Core tile counts (Grassroots): ×8.
CORE-01-02-15 Core tile counts (Lobbyists): ×9.
CORE-01-02-16 Core tile counts (Hotspots): ×8.
CORE-01-02-17 ResortTiles have printed production value equal to their W number.

---

# CORE-01-03 SETUP

CORE-01-03-01 Setup places the Start Committee tile into Board.
CORE-01-03-02 Setup shuffles all non-Start tiles into DrawPile.
CORE-01-03-03 Setup determines a starting player.

CORE-01-03-04 For 2 players, assign 4 Influence objects to each player’s PersonalSupply.
CORE-01-03-05 For 3 players, assign 3 Influence objects to each player’s PersonalSupply.
CORE-01-03-06 For 4 players, assign 2 Influence objects to each player’s PersonalSupply.

---

# CORE-01-04 TURN STRUCTURE

CORE-01-04-01 A turn consists of exactly two phases.
CORE-01-04-02 Phase 1 is DrawAndPlaceTile.
CORE-01-04-03 Phase 2 is ExactlyOnePoliticalAction.

CORE-01-04-04 DrawAndPlaceTile draws exactly one Tile from DrawPile.
CORE-01-04-05 A tile placement is legal only if adjacent to at least one Tile in Board.
CORE-01-04-06 If the drawn Tile cannot be legally placed, move it from DrawPile to DiscardFaceUp.
CORE-01-04-07 If a Tile is moved to DiscardFaceUp due to illegality, the player immediately draws again from DrawPile.
CORE-01-04-08 A tile may be placed only on free table space.

CORE-01-04-09 ExactlyOnePoliticalAction allows exactly one action type from: PlaceOrMoveInfluence, FormalizeInfluence, ConvertResources.

CORE-01-04-10 PlaceOrMoveInfluence may be chosen as the Political Action.
CORE-01-04-11 PlaceOrMoveInfluence (Place) moves exactly one Influence from the active player’s PersonalSupply to Board on a chosen Tile.
CORE-01-04-12 PlaceOrMoveInfluence (Move) moves exactly one Influence from one Board Tile to another Board Tile.

CORE-01-04-13 FormalizeInfluence may be chosen as the Political Action.
CORE-01-04-14 FormalizeInfluence is performed via a Committee tile.
CORE-01-04-15 FormalizeInfluence (Standard Committee) cost requires paying 2 Resources of different resorts.
CORE-01-04-16 FormalizeInfluence (Standard Committee) moves paid Resources from the active player’s PersonalSupply to Bank.
CORE-01-04-17 FormalizeInfluence (Standard Committee) creates exactly one new Influence in the active player’s PersonalSupply.
CORE-01-04-18 FormalizeInfluence fails if the required Resources cannot be fully paid.
CORE-01-04-19 If FormalizeInfluence fails, no state change occurs.

CORE-01-04-20 ConvertResources may be chosen as the Political Action.
CORE-01-04-21 ConvertResources is performed via a Grassroots tile.
CORE-01-04-22 ConvertResources cost and effect are defined by the specific Grassroots tile text.

---

# CORE-01-05 CONTROL

CORE-01-05-01 A player controls a Tile if that player has strictly more Influence on that Tile than any other player.
CORE-01-05-02 If two or more players tie for highest Influence on a Tile, no player controls that Tile.
CORE-01-05-03 Control updates immediately after any Influence movement onto, off, or between Board Tiles.

CORE-01-05-04 Each Lobbyist adjacent to a Tile contributes +1 virtual Influence for majority calculation on that adjacent Tile.
CORE-01-05-05 Lobbyist contribution applies only to majority calculation.
CORE-01-05-06 Lobbyist contribution does not create or move Influence objects.

---

# CORE-01-06 EFFECTS

CORE-01-06-01 A Hotspot triggers when it becomes fully surrounded by Tiles.
CORE-01-06-02 Hotspot resolution performs a majority check on that Hotspot Tile.
CORE-01-06-03 If no player has majority on the Hotspot, no state change occurs.
CORE-01-06-04 If players tie for majority on the Hotspot, no state change occurs.
CORE-01-06-05 If a player has majority on the Hotspot, place exactly one Influence on that Hotspot for the majority player.
CORE-01-06-06 Hotspot placement moves one Influence from that player’s PersonalSupply to the Hotspot Tile in Board.
CORE-01-06-07 If the majority player has no available Influence in PersonalSupply, Hotspot placement cannot occur.
CORE-01-06-08 Hotspots do not produce Resources.

CORE-01-06-09 Resort Production is resolved only during Round Settlement.
CORE-01-06-10 Each ResortTile has a printed production value.
CORE-01-06-11 When a player controls a ResortTile, that ResortTile produces Resources equal to its printed production value.
CORE-01-06-12 Produced Resources are moved from Bank to the controlling player’s PersonalSupply.
CORE-01-06-13 If no player controls a ResortTile, that ResortTile produces no Resources.
CORE-01-06-14 If players tie for control of a ResortTile, divide the produced Resources evenly among tied players.
CORE-01-06-15 Any remainder from a tied ResortTile production is moved to Noise.

---

# CORE-01-07 ROUND STRUCTURE

CORE-01-07-01 A round consists of one complete player cycle in turn order.
CORE-01-07-02 After the last player completes a turn in a round, Round Settlement begins.
CORE-01-07-03 Round Settlement resolves Resort Production for all ResortTiles.

---

# CORE-01-08 RESTRICTIONS

CORE-01-08-01 A player may not exceed 7 Influence objects in total.

CORE-01-08-02 FormalizeInfluence may not be performed until all players have placed all of their Starting Influence onto the Board.
CORE-01-08-03 This restriction applies to all Committees, including the Start Committee.

CORE-01-08-04 No Influence may be placed on the Start Committee.
CORE-01-08-05 The Start Committee cannot be controlled.
CORE-01-08-06 The Start Committee is immune to all effects.

CORE-01-08-07 Each player may FormalizeInfluence via the Start Committee at most once per game.
CORE-01-08-08 Start Committee formalization cost requires paying 3 Resources of different resorts plus 1 additional Resource of any resort.
CORE-01-08-09 Start Committee formalization moves all paid Resources from the active player’s PersonalSupply to Bank.
CORE-01-08-10 Start Committee formalization creates exactly one new Influence in the active player’s PersonalSupply.

---

# CORE-01-09 END GAME

CORE-01-09-01 The game ends when no further Tiles can be drawn from DrawPile.
CORE-01-09-02 After the final Round Settlement completes, the game ends immediately.
CORE-01-09-03 The player with the highest total Influence on Board wins.
CORE-01-09-04 If two or more players tie for highest total Influence on Board, victory is shared.

---

# CORE-01-10 RULE HIERARCHY

CORE-01-10-01 Tile text overrides general rules.
CORE-01-10-02 Specific rules override general rules.
CORE-01-10-03 General rules apply unless overridden.
CORE-01-10-04 No implicit effects exist.

---

# VAR-01 VARIANTS (Simulation Specification)

VAR-01-01-01 TileRecycling is an optional variant.
VAR-01-01-02 When TileRecycling is active, CORE-01-04-06 is not used.
VAR-01-01-03 When TileRecycling is active, CORE-01-04-07 is not used.
VAR-01-01-04 If a drawn Tile cannot be legally placed, move it from the draw resolution back into DrawPile.
VAR-01-01-05 After returning the Tile to DrawPile, shuffle DrawPile.
VAR-01-01-06 After shuffling DrawPile, the active player immediately draws again as part of DrawAndPlaceTile.

VAR-01-02-01 FirstPlayerHandicap is an optional variant.
VAR-01-02-02 When FirstPlayerHandicap is active, the starting player receives one fewer Starting Influence during setup.
VAR-01-02-03 The reduction applies after the standard starting Influence assignment.
VAR-01-02-04 FirstPlayerHandicap modifies CORE-01-03-04.
VAR-01-02-05 FirstPlayerHandicap modifies CORE-01-03-05.
VAR-01-02-06 FirstPlayerHandicap modifies CORE-01-03-06.
VAR-01-02-07 If the 5–6 Player Add-On is active, FirstPlayerHandicap also modifies ADD56-01-02-01.
VAR-01-02-08 If the 5–6 Player Add-On is active, FirstPlayerHandicap also modifies ADD56-01-02-02.

---

# ADD56-01 5–6 PLAYER ADD-ON (Simulation Specification)

ADD56-01-01-01 The 5–6 Player Add-On extends the DrawPile tile set.

ADD56-01-01-02 Add DOM-W2 ×1 to DrawPile.
ADD56-01-01-03 Add DOM-W3 ×1 to DrawPile.
ADD56-01-01-04 Add DOM-W4 ×1 to DrawPile.

ADD56-01-01-05 Add FOR-W2 ×1 to DrawPile.
ADD56-01-01-06 Add FOR-W3 ×1 to DrawPile.
ADD56-01-01-07 Add FOR-W4 ×1 to DrawPile.

ADD56-01-01-08 Add INF-W2 ×1 to DrawPile.
ADD56-01-01-09 Add INF-W3 ×1 to DrawPile.
ADD56-01-01-10 Add INF-W4 ×1 to DrawPile.

ADD56-01-01-11 Add Committee ×2 to DrawPile.
ADD56-01-01-12 Add Lobbyist ×3 to DrawPile.
ADD56-01-01-13 Add Grassroots ×2 to DrawPile.

ADD56-01-01-14 Add Hotspot (DOM) ×1 to DrawPile.
ADD56-01-01-15 Add Hotspot (FOR) ×1 to DrawPile.
ADD56-01-01-16 These Hotspot labels do not modify Hotspot resolution rules.

ADD56-01-02-01 For 5 players, assign 2 Influence objects to each player’s PersonalSupply during setup.
ADD56-01-02-02 For 6 players, assign 2 Influence objects to each player’s PersonalSupply during setup.

ADD56-01-03-01 All other CORE-01 rules remain unchanged when the 5–6 Player Add-On is active.

---

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

---

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

EXP-02-03-01 Shuffle all EXP-02 Measures to form MeasureDrawPile.
EXP-02-03-02 Place exactly 3 Measures face up in OpenMeasures.
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

EXP-02-07-01 Measures follow EXP-01 lifecycle rules.
EXP-02-07-02 Timing windows allowed:

• This turn
• This round
• During Round Settlement
• Next round
• Until consumed

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
EXP-03-03-02 Shuffle all EXP-03 Measures to form MeasureDrawPile.
EXP-03-03-03 Place exactly 3 Measures face up in OpenMeasures.
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
EXP-03-05-02 Production Resolution Order is:

1. Start with printed production value.
2. Apply doubling effects (EXP-01).
3. Apply production output modifiers (reductions or increases).
4. Apply floors (minimum 0).
5. Evaluate majority and tie rules.
6. Apply Overlays output reduction (EXP-02 order if present).

EXP-03-05-03 Climate Measures modifying production are applied during step 3.
EXP-03-05-04 Climate never replaces other Resources during production unless explicitly stated.

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

EXP-03-07-01 Measures follow EXP-01 lifecycle rules.
EXP-03-07-02 Allowed timing windows:
• This turn
• This round
• During Round Settlement
• Next round
• Until consumed

EXP-03-07-03 No other timing windows exist.
EXP-03-07-04 Measures do not create hidden state.
EXP-03-07-05 Measures cannot bypass prohibitions unless explicitly stated.

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
EXP-03-10-02 Climate cost increases stack additively with Overlay cost increases.
EXP-03-10-03 Overlay Blockade overrides Climate cost modifications.
EXP-03-10-04 If both EXP-01 and EXP-03 production modifiers apply, apply EXP-01 doubling first, then Climate modifications, then Overlay reductions.
EXP-03-10-05 Measures cannot override CORE Rule Hierarchy.
EXP-03-10-06 No rule in EXP-03 introduces automatic Countdown resolution.

---

END OF EXP-03 v1.0

---

