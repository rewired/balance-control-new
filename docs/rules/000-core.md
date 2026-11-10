# BALANCE // CONTROL

# CORE-01 Simulation Specification (Atomic, Deterministic)

Version: 01
Scope: Core Rules v1.0.14 only with variants (no expansions)
Applied errata: ERRATA-0001 (2026-11-07, Lobbyist bonus).
Applied errata: ERRATA-0002 (2026-11-07, Grassroots conversion).
Applied errata: ERRATA-0003 (2026-11-07, movement ContextTile).
Applied errata: ERRATA-0004 (2026-11-07, initial Resources and unbounded Bank).
Applied errata: ERRATA-0005 (2026-11-07, final turn and Settlement).
Applied errata: ERRATA-0006 (2026-11-07, one-time Hotspot resolution).
Applied errata: ERRATA-0007 (2026-11-07, draw resolution and bounded recycling).
Applied errata: ERRATA-0008 (2026-11-07, ownership, activation rights, and zero-majority production).
Applied errata: ERRATA-0010 (2026-11-07, shared Measure framework).
Applied errata: ERRATA-0014 (2026-11-07, effect costs and payers).
Applied errata: ERRATA-0015 (2026-11-07, Round Settlement sequence).
Applied errata: ERRATA-0031 (2026-11-09, hexagonal topology).
Applied errata: ERRATA-0032 (2026-11-09, victory at the Influence limit).
Applied errata: ERRATA-0034 (2026-11-10, resort supply cap).
Applied errata: ERRATA-0035 (2026-11-10, influence recall).
Applied errata: ERRATA-0036 (2026-11-10, influence distance and disruption actions).

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
CORE-01-00-04A Bank provides an unbounded supply of every Resource resort active in the match. A rule-prescribed Resource transfer from Bank never fails or pays out partially because of Bank stock shortage.
CORE-01-00-04B If a prescribed transfer from Bank requires more Resource objects of an active resort than are currently in Bank, create exactly the missing objects in Bank as part of that transfer's atomic resolution, then transfer the required objects to the prescribed destination. Every existing Resource object remains in exactly one zone.
CORE-01-00-04C Inactive Resource resorts have no Resource objects or resort-specific counters in any zone. Unbounded Bank availability applies only to active resorts.
CORE-01-00-04D Unbounded Bank availability does not pay a player's costs. Costs must be paid from the source specified by the applicable rule, including the player's PersonalSupply where required.
CORE-01-00-05 Tile zones are: DrawPile, DrawResolution, Board, DiscardFaceUp.
CORE-01-00-05A DrawResolution contains at most one Tile: the currently drawn Tile awaiting placement, discard, or return to DrawPile. That Tile is not simultaneously in DrawPile or any other zone.
CORE-01-00-06 No object may exist in multiple zones simultaneously.
CORE-01-00-07 The board uses a topology parameter that defines adjacency between Tiles.
CORE-01-00-08 Any rule that references adjacency uses the current topology’s adjacency definition.
CORE-01-00-09 A topology attachment must be defined before game start.
CORE-01-00-10 The topology attachment specifies how adjacency between Tiles is determined.
CORE-01-00-11 The topology attachment does not modify any other rule.
CORE-01-00-12 Expansion-specific zones
If an expansion introduces additional zones (e.g., Measure zones), those zones exist separately per expansion.
Zones introduced by different expansions never share objects unless a rule explicitly defines cross-expansion mixing.

---

# TOPOLOGY ATTACHMENT (Implementation Contract)

CORE-01-00-T01 A topology implementation must define a function Adjacent(TileA, TileB) → Boolean.
CORE-01-00-T02 Adjacent(TileA, TileB) must be deterministic.
CORE-01-00-T03 All adjacency-based rules reference Adjacent(TileA, TileB).
CORE-01-00-T04 This edition uses hexagonal adjacency.
CORE-01-00-T05 Changing topology does not alter any rule outside adjacency evaluation.
CORE-01-00-T06 Hex distance is the minimum number of adjacent steps between two positions on the hex grid. Empty positions count as steps.

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
CORE-01-02-09 Each Hotspot triggers one enclosure event when it first becomes fully surrounded, following CORE-01-06-01 through -07.

CORE-01-02-10 Core tile counts (DOM ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-11 Core tile counts (FOR ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-12 Core tile counts (INF ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-13 Core tile counts (Committees): ×10.
CORE-01-02-14 Core tile counts (Grassroots): ×8.
CORE-01-02-14A All eight core Grassroots use the identical printed conversion text defined in CORE-01-04-22A.
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
CORE-01-03-07 Each player starts with 0 Resources. Noise starts empty.
CORE-01-03-08 Setup creates no Resource objects in Bank. Its unbounded availability for active resorts is provided on demand under CORE-01-00-04A and -04B. Paid Resources return to Bank as prescribed by their cost rules.
CORE-01-03-09 DrawResolution starts empty.

---

# CORE-01-04 TURN STRUCTURE

CORE-01-04-01 A turn consists of exactly two phases.
CORE-01-04-02 Phase 1 is DrawAndPlaceTile.
CORE-01-04-03 Phase 2 is ExactlyOnePoliticalAction.

CORE-01-04-04 Each draw attempt transfers exactly one Tile from DrawPile to DrawResolution. DrawAndPlaceTile may contain repeated attempts under CORE-01-04-06/-07 or VAR-01-01, but places at most one Tile on Board. Successful placement transfers the drawn Tile from DrawResolution to Board and ends the drawing sequence.
CORE-01-04-05 A tile placement is legal only if adjacent to at least one Tile in Board.
CORE-01-04-05A A geometric placement satisfies the current topology's adjacency and free-space requirements. A payable legal placement additionally satisfies all applicable placement restrictions and permits full payment of all required placement costs.
CORE-01-04-05B Required placement costs are paid from the active player's PersonalSupply to Bank atomically with successful placement. A failed placement pays no partial costs and places no Tile on Board.
CORE-01-04-06 If the drawn Tile has no payable legal placement, move it from DrawResolution to DiscardFaceUp.
CORE-01-04-07 After such a discard, immediately make another draw attempt within the same DrawAndPlaceTile phase if DrawPile is not empty. Otherwise, with DrawResolution empty, follow CORE-01-09-01B.
CORE-01-04-08 A tile may be placed only on free table space.
CORE-01-04-08A If at least one payable legal placement exists, the player must choose such a placement; the player may not voluntarily discard or recycle the Tile instead.

CORE-01-04-09 ExactlyOnePoliticalAction requires exactly one legal Political Action from PlaceOrMoveInfluence, FormalizeInfluence, ConvertResources, RecallInfluence, CounterLobby, DisplaceInfluence, DamageResort, and any action types enabled by active expansions, except for mandatory slot completion under CORE-01-04-09A through -09C.
CORE-01-04-09A After all resolutions required before a mandatory Political Action slot have completed, determine whether any legal option permitted in that slot exists. Include all permitted targets, payment alternatives, cost substitutions, cost transfers, and Start Committee immunity. For an additional action after PlayMeasure, exclude PlayMeasure. If any legal option exists, one must be chosen; voluntary passing is not permitted.
CORE-01-04-09B If no such legal option exists, automatically complete that slot without performing an action or making any payment. This applies both to ExactlyOnePoliticalAction and to the mandatory additional non-PlayMeasure action. It is not an action attempt and triggers or consumes no pending effect unless a rule explicitly provides otherwise; EXP-01-08-M06-07A is such an exception. Complete the slot without reopening it after that exception is processed.
CORE-01-04-09C Mandatory completion without an action preserves all previously completed Tile placement, Hotspot resolutions, successful Measure play, paid costs, and shared PlayMeasure usage. It creates no additional PlayMeasure usage, card transfer, or payment; in particular, Intergenerational Pact is not consumed without its actual cost transfer. Continue with the normal turn, round, and final-Settlement procedures.

CORE-01-04-10 PlaceOrMoveInfluence may be chosen as the Political Action.
CORE-01-04-11 PlaceOrMoveInfluence (Place) moves exactly one Influence from the active player’s PersonalSupply to Board on a chosen Tile.
CORE-01-04-12 PlaceOrMoveInfluence (Move) moves exactly one Influence belonging to the active player from one Board Tile to another Board Tile. The ordinary Move action cannot move another player's Influence.
CORE-01-04-12A An ordinary Move may cover at most three hex steps under CORE-01-00-T06.
CORE-01-04-12B The base cost of an ordinary Move is zero Resources at distance one, one Resource at distance two, and three Resources at distance three. The acting player chooses each unit from any active resort. Multiple units may come from the same resort. Apply destination prohibitions and payment rules under CORE-01-06-00-05A and CORE-01-06-00-07 through -11. Place under CORE-01-04-11 has no distance cost.

CORE-01-04-13 FormalizeInfluence may be chosen as the Political Action.
CORE-01-04-14 FormalizeInfluence is performed via a Committee tile.
CORE-01-04-14A The active player must control the Standard Committee used for FormalizeInfluence, determined under CORE-01-05-03A/-03B. Start Committee formalization is exempt from this control requirement under CORE-01-08-07A.
CORE-01-04-15 FormalizeInfluence (Standard Committee) cost requires paying 2 Resources of different resorts.
CORE-01-04-16 FormalizeInfluence (Standard Committee) moves paid Resources from the active player’s PersonalSupply to Bank.
CORE-01-04-17 FormalizeInfluence (Standard Committee) creates exactly one new Influence in the active player’s PersonalSupply.
CORE-01-04-18 FormalizeInfluence fails if the required Resources cannot be fully paid.
CORE-01-04-19 If FormalizeInfluence fails, no state change occurs.

CORE-01-04-20 ConvertResources may be chosen as the Political Action.
CORE-01-04-21 ConvertResources is performed via a Grassroots tile.
CORE-01-04-21A The active player must control the Grassroots used for ConvertResources, determined under CORE-01-05-03A/-03B.
CORE-01-04-22 ConvertResources cost and effect are defined by the specific Grassroots tile text.
CORE-01-04-22A The printed text of every core Grassroots is: “Pay 3 Resources of the same resort to gain exactly 1 Resource of a different resort.”
CORE-01-04-22B Both the input resort and the output resort must be active in the match. Resource resorts introduced by active expansions are eligible as inputs and outputs; inactive resorts cannot be selected.
CORE-01-04-22C The three paid Resources move from the active player's PersonalSupply to Bank. The gained Resource moves from Bank to that player's PersonalSupply.
CORE-01-04-22D Unless explicitly overridden, ConvertResources performs exactly one exchange per Political Action. The exchange may not be repeated or chained within that action.
CORE-01-04-22E Applicable additional costs are added to the three-Resource base cost; they do not replace any of the three same-resort Resources required by the printed text. Payment and output resolve atomically under CORE-01-06-00-02 and -03.

CORE-01-04-23 RecallInfluence may be chosen as the Political Action, including in an additional Political Action slot. Each player may resolve it successfully at most once per round across all slots. Reset the usage at the beginning of the next round.
CORE-01-04-24 Choose exactly one real Influence marker owned by another player on a Board Tile other than the Start Committee. The marker's Tile is the ContextTile. The active player may choose the marker regardless of who controls the Tile and whether the active player has Influence there. Apply applicable prohibitions and payment modifiers.
CORE-01-04-25 The base cost is one Resource from each of three different active resorts. Pay the complete cost from the active player's PersonalSupply to Bank, subject to CORE-01-06-00-07 through -12, and transfer the selected marker from Board to its owner's PersonalSupply in the same resolution. Mark the action used only on success.
CORE-01-04-26 The recalled marker retains its identity and owner. It contributes no Board Influence while in PersonalSupply, and its owner may later place it under CORE-01-04-11. A recalled Starting Influence marker retains its origin and its completed first placement for CORE-01-08-02/-03.

CORE-01-04-27 CounterLobby, DisplaceInfluence, and DamageResort may each be chosen as a Political Action, including in an additional Political Action slot.
CORE-01-04-28 Each action selects its base payment from any active resorts, with repeated resorts permitted. Pay from PersonalSupply to Bank under CORE-01-06-00-07 through -11. Each action uses its target Tile as its sole ContextTile, including the marker's source Tile for DisplaceInfluence. Measure range under CORE-01-00-T06.
CORE-01-04-29 CounterLobby costs two Resources. Choose a standard Committee within two hex steps of one of the acting player's real Board markers and an adjacent Lobbyist controlled by another player. The chosen Committee must have no active CounterLobby.
CORE-01-04-30 For that Lobbyist and Committee pair only, suppress the Lobbyist's contribution for the player who controlled the Lobbyist when the action resolved. The suppression expires at the end of that player's next actual turn, before any ensuing Settlement. All other contributions are calculated under CORE-01-05-04 through -09.
CORE-01-04-31 DisplaceInfluence costs two Resources and may resolve at most once per acting player per round. Reset this limit at the beginning of the next round. Choose a real opposing marker on a Board Tile within one hex step of one of the acting player's real Board markers. A marker on the same Tile is in range. The Start Committee is excluded.
CORE-01-04-32 The action requires at least one adjacent Board destination other than the Start Committee where the displacement response is permitted. Determine eligible destinations before payment, using each destination as the ContextTile of that response. After payment, the chosen marker's owner must select one of those destinations before the acting player's turn can finish. The response has no payment, output modification, or Political Action slot. Transfer the same marker directly between Board Tiles, preserving its identity and ownership.
CORE-01-04-33 DamageResort costs three Resources and may resolve at most once per acting player per match. Choose an undamaged ResortTile controlled by another player within two hex steps of one of the acting player's real Board markers.
CORE-01-04-34 A damaged ResortTile has a permanent additive production modifier of -1 at CORE-01-06-16(a)(3). Apply the normal floor after all modifiers. Damage stays on the Tile through changes in control.

---

# CORE-01-05 CONTROL

CORE-01-05-01 A player controls a Tile if that player has strictly more Influence on that Tile than any other player.
CORE-01-05-02 If two or more players tie for highest Influence on a Tile, no player controls that Tile.
CORE-01-05-03 Control updates immediately after any Influence movement onto, off, or between Board Tiles.

CORE-01-05-03A A player controls a Tile if computeMajority(Tile) == that player.
If computeMajority(Tile) returns None (tie), the Tile is uncontrolled.

computeMajority(Tile):

1. For each player:
   totalInfluence =
      Influence markers on the Tile
      + all applicable modifiers (e.g., Lobbyist adjacency bonus)

2. The player with strictly highest totalInfluence is returned.

3. If two or more players share the highest totalInfluence,
   return None.

CORE-01-05-03B A Tile-control requirement is satisfied by the result of the canonical majority calculation, including applicable virtual Influence. No additional real Influence marker on that Tile is required; control entirely through an applicable Lobbyist bonus is sufficient.

CORE-01-05-04 Each controlled Lobbyist contributes +1 virtual Influence for its controller to each adjacent Tile other than a Lobbyist or the Start Committee, subject to CORE-01-04-30.
CORE-01-05-05 Lobbyist contribution applies only to majority calculation.
CORE-01-05-06 Lobbyist contribution does not create or move Influence objects.
CORE-01-05-06A Virtual Influence does not count toward Influence caps or victory scoring.
CORE-01-05-07 Lobbyists receive no virtual Influence from other Lobbyists. Majority on a Lobbyist is determined solely by the real Influence markers on that Lobbyist, using the canonical computeMajority function.
CORE-01-05-08 An uncontrolled Lobbyist contributes no virtual Influence.
CORE-01-05-09 Contributions from multiple controlled Lobbyists stack additively. A player need not have real Influence on the receiving Tile to receive the bonus.

---

# CORE-01-06 EFFECTS

CORE-01-06-00-01 Definition — “Effect”
An “Effect” is any rule-defined state change that is executed as a result of:
(a) resolving a Tile’s printed behavior (including Resort production during Round Settlement), or
(b) resolving a triggered Tile behavior (e.g., Hotspot resolution), or
(c) resolving a Political Action permitted by CORE-01 or an active expansion's rules, or
(d) resolving any Measure or Regulation instruction.

CORE-01-06-00-02 Paying costs, checking prohibitions, and applying modifiers are part of effect resolution.
CORE-01-06-00-03 If an Effect does not resolve, no partial state changes occur unless explicitly stated.

CORE-01-06-00-04 Effect Context (Tile Binding)
An effect resolves with exactly one ContextTile (nullable).
Rules that apply “on that Tile” evaluate against ContextTile.

CORE-01-06-00-05 ContextTile Assignment (Canonical)
Assign ContextTile as follows:
(a) If the effect is a Political Action performed via a Tile (Committee / Grassroots / Start Committee), ContextTile = that Tile.
(b) If the effect targets exactly one Tile (e.g., “target one ResortTile / Hotspot”), ContextTile = that target Tile.
(c) If the effect is Resort Production during Round Settlement, ContextTile = the producing ResortTile.
(d) If the effect is Hotspot resolution, ContextTile = that Hotspot Tile.
(e) If none applies, ContextTile = null.

CORE-01-06-00-05A Influence Placement and Movement Context
For PlaceOrMoveInfluence, ContextTile is the destination Tile. For a movement between two Board Tiles, the source Tile is a parameter and does not become an additional ContextTile.

CORE-01-06-00-05B Local Modifiers and Explicit Object Restrictions
Tile-local prohibitions, cost modifiers, and output modifiers are evaluated only at the assigned ContextTile. An explicit restriction on moving or removing an object must additionally be checked even when the object is on a different Tile. This independent legality check does not assign another ContextTile or apply that other Tile's local effect modifiers.

CORE-01-06-00-06 Multiple-Tile References
If an instruction references multiple Tiles, it must explicitly state which Tile is the ContextTile; otherwise the effect is invalid and does not resolve.

CORE-01-06-00-07 Effect Costs and Payers
(a) Automatic Resort Production and the normal Hotspot Influence payout have no payer and receive no Resource cost increases. Applicable prohibitions and output modifiers still apply; this is not general effect immunity.
(b) A Political Action or player-executed Measure/Regulation operation is a player-paid resolution. Its payer is the acting player, or the player who played the Measure for a separately triggered later operation, unless an explicit rule assigns a cost component otherwise. Applicable increases apply even when its base Resource cost is 0.
(c) Evaluate prohibitions before payment. Required costs must be fully paid from the prescribed sources before execution; inability to pay causes atomic failure. Explicit consumption-on-failure exceptions and Start Committee immunity remain applicable.

CORE-01-06-00-08 One Cost-Modifier Pass per Resolution
A single action or Measure resolution receives one cost-modifier pass. If a Measure contains an immediate Regulation placement, combine the card's printed cost and the Regulation's normal placement cost into that resolution's base cost, then apply applicable cost modifiers once. Internal resolver steps, payment, bookkeeping, and majority/modifier evaluation do not create further taxed resolutions. An additional Political Action granted by PlayMeasure is its own resolution with its own applicable costs.

CORE-01-06-00-09 Separately Triggered Later Operations
An explicitly separate later operation, including a Regulation placement or movement instructed by a previously played Measure, receives its own cost check at its actual trigger under CORE-01-06-00-07. Previously paid card costs are not recalculated or refunded because the later operation fails. This does not create charges for applying a passive modifier to the automatic outcomes exempted by CORE-01-06-00-07(a).

CORE-01-06-00-10 Complete Payment Plan
Before making payment or executing the main effect, determine its applicable costs and all selected legal substitutions, optional payment-effect uses, and cost transfers. Every assigned payer must be able to pay their final share in full from the prescribed source. Each Resource may satisfy only one cost component. Within that resolution, each additional cost component may be transferred at most once by Intergenerational Pact; it cannot be forwarded again or enter a transfer cycle. Separate permitted instances may transfer different components. This planning step does not itself pay, transfer, consume, or mark an effect used, and does not bypass the canonical prohibition, cost, output-modifier, or floor order.

CORE-01-06-00-11 Atomic Payment, Effect, and Usage
On successful resolution, apply all required payments, the immediate main effect, any continuing/future effect registration, and the consumption or usage flags caused by those successful payments together atomically. If a prohibition, invalid target, unmet prerequisite, or inability to pay prevents resolution, apply no partial payment or main effect; merely proposed substitutions or transfers do not consume Intergenerational Pact or use Economic Council. Explicit consumption-on-failure rules, including Budget Deficit, Emergency Decree, and Deployment Order, remain effective only to their stated extent. A separately triggered later resolution never rolls back an already completed predecessor. An otherwise legal, paid zero-output action under EXP-02-04-B-05 is successful, not a failure.

CORE-01-06-00-12 Rejected Inputs
An input that is illegal from the outset is rejected rather than becoming a rule-defined action attempt; it does not consume Budget Deficit or cause payment, action-slot use, or other action-attempt consequences. Mandatory completion when no legal action exists remains governed by CORE-01-04-09A through -09C, including its explicit Budget Deficit exception.

CORE-01-06-01 A Hotspot becomes “fully surrounded” when all positions adjacent to that Hotspot are occupied by Tiles.
CORE-01-06-02 The check for full enclosure occurs immediately after a Tile is placed during DrawAndPlaceTile.
CORE-01-06-02A Each Hotspot begins with its enclosure event unprocessed. Its first full enclosure generates exactly one event; once processed, that Hotspot cannot generate another enclosure event.
CORE-01-06-03 Process every enclosure event generated by the placement immediately, before proceeding to the Political Action phase of that turn, unless an event ends the game under CORE-01-09-00.
CORE-01-06-03A If one placement fully encloses multiple Hotspots, process their events sequentially in ascending ordinal lexicographic order of their unique, immutable Tile IDs, assigned before game start. Resolve each event completely before the next; each event uses the then-current game state for its pre-majority effects and majority calculation.
CORE-01-06-04 Hotspot resolution follows this order:
(a) Resolve already active effects explicitly defined as occurring “before majority resolution.” This window does not itself grant permission to play a Measure from hand outside its otherwise permitted timing.
(b) Determine majority on that Hotspot using the canonical majority rules.
(c) Evaluate prohibitions, costs, and output modifiers in the applicable resolution order, before executing the majority outcome. A prohibited outcome pays no costs and makes no payout changes.
(d) Execute the permitted majority outcome atomically, then mark the enclosure event processed under CORE-01-06-04A.
CORE-01-06-04A The enclosure event is processed exactly once, including when its outcome is prevented or produces no payout because of a tie, Blockade, Budget Compromise, unavailable Influence in PersonalSupply, or another applicable prohibition, unpaid cost, or output modifier. Recording that the event was processed is event bookkeeping, separate from the atomic payout; a failed payout makes no partial payout changes. No deferred payout or retry occurs after the restriction expires, the prohibition is removed, or the state changes.
CORE-01-06-05 Subject to CORE-01-06-04 and any explicit Tile-text override, the normal majority outcome places exactly one Influence on that Hotspot for the majority player.
CORE-01-06-06 Hotspot placement moves one Influence from that player’s PersonalSupply to the Hotspot Tile in Board.
CORE-01-06-07 If the majority player has no available Influence in PersonalSupply, Hotspot placement cannot occur.
CORE-01-06-08 Hotspots do not produce Resources.

CORE-01-06-09 Resort Production is resolved only during Round Settlement.
CORE-01-06-10 Each ResortTile has a printed production value.
CORE-01-06-11 When a player controls a ResortTile, that ResortTile produces Resources equal to its printed production value.
CORE-01-06-12 Produced Resources are moved from Bank to the controlling player’s PersonalSupply.
CORE-01-06-13 If the highest total Influence on a ResortTile under the canonical majority rules is 0, that Tile produces 0 Resources and transfers nothing to any player or Noise. Totals include applicable virtual Influence.
CORE-01-06-14 If two or more players tie for the highest total Influence at a positive value, divide the production output evenly among only those tied leaders. Players below that highest value receive none from that Tile.
CORE-01-06-15 Any remainder from a tied ResortTile production is moved to Noise.
CORE-01-06-16 Production Resolution Order (Canonical)
CORE-01-06-16-00 Modifier Collection Step
Before resolving production for a tile, collect all modifiers applicable to that production instance, respecting their source-specific eligibility and suppression rules, including Investment Freeze when active.
No modifier is applied until the canonical order steps (a)–(c) begin.

When resolving a ResortTile’s production during Round Settlement, use the following order:

(a) Determine the total production output amount using the applicable modifier steps:
    1. Start with the tile’s printed production value.
    2. Apply each expressly permitted applicable doubling effect (if any). This step grants no additional effect instances or stacking permission.
    3. Sum all applicable additive production output modifiers, reductions and increases, from active sources including EXP-01, EXP-03, and Regulation output modifiers such as SecurityLevel, and apply the net change to the doubled amount. Do not clamp intermediate totals by source, expansion, or individual modifier. Regulation prohibitions and cost increases are not numeric production-output deductions.
    4. Apply one final minimum-0 floor to that complete modified output.

(b) Determine control and the leading players' total Influence for that Tile using the canonical majority rules, including applicable virtual Influence.

(c) Determine the regular Resource shares and tie remainder:
    - If the highest total Influence is 0, produce 0 and transfer nothing to players or Noise.
    - Otherwise, if exactly one player controls the Tile, assign that player the full amount as their regular share.
    - Otherwise, assign equal regular shares to the players tied for the highest positive total; assign the division remainder to Noise. Other players receive none.

CORE-01-06-16A Transfer the regular shares and tie remainder determined in CORE-01-06-16(c), subject to any explicitly applicable recipient-specific receipt limit. Calculate that recipient's final receipt from their regular share under the limiting effect's rule before executing transfers; do not transfer a provisional share and then reclaim it. A receipt limit is not a Tile-output modifier in CORE-01-06-16(a)(3). Supply Chain Disruption applies under EXP-03-08-M11-05 through -09.

CORE-01-06-17 Check effect-level prohibitions before executing the production calculation. If one applies (e.g., Blockade), production output is treated as 0 and no Resources are distributed. Automatic Resort Production receives no Resource cost increases under CORE-01-06-00-07(a). Only instructions expressly modifying Resort Production enter this production pipeline; an immediate Resource gain such as Future Investment is not itself Resort Production.

---

# CORE-01-07 ROUND STRUCTURE

CORE-01-07-01 A round consists of one complete player cycle in turn order followed by Round Settlement, subject to the shortened final round in CORE-01-07-01A.
CORE-01-07-01A The final round may end before that player cycle is complete, following CORE-01-09-00 through -02.
CORE-01-07-02 After the last player completes a turn in a round, Round Settlement begins.
CORE-01-07-03 Round Settlement resolves Resort Production for all ResortTiles within the sequence defined in CORE-01-07-04 through -06.
CORE-01-07-04 Settlement Sequence
(a) Determine which registered effects apply under their explicit timing windows.
(b) Resolve applicable registered one-time Settlement operations, including De-escalation and Loss of Control, before production, in registration order with ties broken by ascending ordinal lexicographic order of stable effect-instance IDs. Complete each operation before the next. Production modifiers such as Economic Stimulus are not executed as separate pre-production operations; collect them for the relevant production instance instead.
(c) Resolve each ResortTile's production completely in ascending ordinal lexicographic order of its stable, unique Tile ID, using CORE-01-06-16 without reordering its steps. This includes Regulation output modifiers before the majority/distribution steps.
(d) Complete any explicitly applicable subsequent Settlement effects. Only after these are complete has Round Settlement ended.
(e) If another round begins, perform its beginning-of-round resets after Settlement has ended. After a final Settlement, score and end the game under CORE-01-09; do not start another round or perform its resets.
CORE-01-07-04A At the end of each regular or final Round Settlement, after production and subsequent Settlement effects, cap each active Resource resort at 12 in each player's PersonalSupply. Transfer every excess directly from PersonalSupply to Noise in one resolution.
CORE-01-07-05 Registration order is the order of game events that registered the effects, not system time. Resolving a registered Settlement effect grants no new permission to play a Measure from hand or perform an additional Political Action.
CORE-01-07-06 Determine effect applicability using the shared game clock in CORE-01-07-07 through -18 and any explicit specific override. This round effects remain applicable throughout their current Round Settlement and expire afterward under CORE-01-07-10/-17.

CORE-01-07-07 Shared Game Clock
All duration boundaries use actual game events, never system time. For registered continuing or future effects, registration is not retroactive: they apply only after successful registration and, for an explicitly future window, only after that window begins. Immediate effects resolve within their permitted resolution without requiring a pending instance. These definitions apply across active expansions without activating disabled expansion content.
CORE-01-07-08 Complete Turn Boundary
A turn begins with Phase 1 and includes DrawAndPlaceTile, required Hotspot resolutions, the full Political Action sequence including a granted additional action, mandatory refill, and prescribed follow-up resolutions. Complete all required parts before the turn ends; turn-end durations expire before any ensuing Settlement. A begun turn ending through unsuccessful drawing under CORE-01-09-01B counts as begun even though its Political Action is omitted.
CORE-01-07-09 Immediate and This turn
Immediate resolves completely within its currently permitted resolution. This turn lasts from registration through the complete end of the current turn under CORE-01-07-08, not into Settlement. Neither term creates a new action or play window.
CORE-01-07-10 This round
This round lasts from registration through the complete current Round Settlement, including a final Settlement, and expires after that Settlement under CORE-01-07-17. It does not expire when Settlement begins.
CORE-01-07-11 Settlement Duration Terms
During this Round Settlement, During Round Settlement, and During the next Round Settlement bind a normally played Measure to the next upcoming actual Round Settlement, including a final one. The effect applies in that Settlement's prescribed stage and ends after that Settlement. These terms do not permit playing a new card from hand during Settlement.
CORE-01-07-12 Next round
Next round begins only when the actual next round starts after the current Settlement and lasts through that next round's Settlement. It does not apply during the current round or current Settlement. If no next round begins, its future window never activates.
CORE-01-07-13 Until the end of the next round
This duration applies from registration, including the rest of the current round, through the complete Settlement of the actual next round. It differs from Next round by applying immediately after registration.
CORE-01-07-14 Until the beginning of your next turn
This duration applies from registration until immediately before Phase 1 of the original effect owner's next actually begun turn. A later change of source-card holder does not change that owner or boundary.
CORE-01-07-15 During the target player's next turn
This duration applies only in the target player's next actually begun turn after registration, from its Phase 1 boundary through its complete end under CORE-01-07-08. It does not apply retroactively to the current turn if the target is already active when registration occurs.
CORE-01-07-16 Until consumed
This duration ends only upon the rule-defined consumption event, including any explicitly specified consumption on failure. Round changes or source-card circulation do not implicitly consume it.
CORE-01-07-17 Boundary Processing Order
At the boundary of an actually begun turn, first expire effects ending before that turn, then activate effects assigned to that turn, before DrawAndPlaceTile. After all Settlement resolutions finish, expire effects whose duration ends after that Settlement. Only if a new round actually begins, then perform its prescribed usage-flag resets and activate Next round windows. No beginning-of-round reset or activation occurs after a final Settlement.
CORE-01-07-18 End of Game and Completed Outcomes
A final Settlement is an actual Settlement for these definitions. Do not invent a later turn or round to activate, expire, or replay a future window that never occurs. Effect expiry does not undo completed outcomes: placed Regulations, Influence, and Resources remain subject to their object rules unless an explicit rule removes them. Duration boundaries create no new hand-card play permission, Political Action, or implicit Countdown operation; reserved Countdown rules remain inactive.

---

# CORE-01-08 RESTRICTIONS

CORE-01-08-01 A player may not exceed 7 Influence objects in total.

CORE-01-08-02 FormalizeInfluence may not be performed until all players have placed each of their Starting Influence markers onto the Board at least once. A later recall preserves the completed first placement under CORE-01-04-26.
CORE-01-08-03 This restriction applies to all Committees, including the Start Committee.

CORE-01-08-04 No Influence may be placed on the Start Committee.
CORE-01-08-05 The Start Committee cannot be controlled.
CORE-01-08-06 The Start Committee is immune to all effects, Measures, and Regulations.

CORE-01-08-06A Immunity Scope:
When an action is performed via the Start Committee (including Start Committee formalization),
ignore any external modifiers that would:
(a) prohibit execution (e.g., Blockade),
(b) increase or alter costs,
(c) reduce or alter output,
unless that modifier explicitly states it affects the Start Committee.

CORE-01-08-06B The Start Committee’s immunity does not override CORE-01-08-02 (timing restriction) and does not allow placing or moving Influence onto the Start Committee.

CORE-01-08-07 Each player may FormalizeInfluence via the Start Committee at most once per game.
CORE-01-08-07A FormalizeInfluence via the Start Committee does not require control of it. Its existing timing restriction, immunity, once-per-game limit, costs, and output remain applicable.
CORE-01-08-08 Start Committee formalization cost requires paying 3 Resources of different resorts plus 1 additional Resource of any resort.
CORE-01-08-09 Start Committee formalization moves all paid Resources from the active player’s PersonalSupply to Bank.
CORE-01-08-10 Start Committee formalization creates exactly one new Influence in the active player’s PersonalSupply.

---

# CORE-01-09 END GAME

CORE-01-09-00 The first player to reach their Influence limit on Board wins when the effect that placed the last required Influence finishes. Use the limit in CORE-01-08-01 (7), or ADD56-01-03-00-01 (8) with the 5–6 Player Add-On. Count only that player's real Influence objects on Board. If the same effect brings multiple players to the limit, they share victory.
CORE-01-09-00A Complete the winning effect, including its payments and bookkeeping, then end the game immediately. Each Hotspot enclosure event is a separate resolution for this purpose. Do not resolve later enclosure events, start another Political Action, or begin a Round Settlement. This victory takes precedence over DrawPile exhaustion, including on the last Tile.

CORE-01-09-01 If no player has won under CORE-01-09-00 and no further Tiles can be drawn from DrawPile, follow the final-turn procedure below; exhaustion alone does not interrupt resolution of an already drawn Tile or immediately end the game.
CORE-01-09-01A If the last drawn Tile is successfully placed and DrawPile is exhausted, finish all Hotspot resolutions triggered by that placement and the active player's full Political Action sequence, including any additional action explicitly granted by active rules. Then begin the final Round Settlement.
CORE-01-09-01B If DrawAndPlaceTile exhausts DrawPile through unsuccessful placement and discard attempts without placing a Tile, and DrawResolution is empty, omit the Political Action phase of that begun turn and immediately begin the final Round Settlement. VAR-01-01-08 also applies this conclusion when recycling leaves only geometrically unplaceable Tiles in DrawPile.
CORE-01-09-01C Perform exactly one final Round Settlement. If it coincides with the regular end-of-round Settlement, these are the same event, not two Settlements. No further player turn or new round begins.
CORE-01-09-02 Complete all production and other effects that apply during the final Round Settlement before scoring. Immediately after that Settlement completes, determine victory under CORE-01-09-03 and -04 and end the game.
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
VAR-01-01-02 When TileRecycling is active, replace CORE-01-04-06 with VAR-01-01-04 and -04A.
VAR-01-01-03 When TileRecycling is active, replace CORE-01-04-07 with VAR-01-01-06 through -08.
VAR-01-01-04 If the drawn Tile has no geometric placement, move it from DrawResolution back into DrawPile.
VAR-01-01-04A If a geometric placement exists but no payable legal placement exists, move the Tile from DrawResolution to DiscardFaceUp without paying placement costs. This discard applies even while TileRecycling is active; unpaid placement costs do not cause return to DrawPile.
VAR-01-01-05 After returning a geometrically unplaceable Tile to DrawPile, shuffle DrawPile deterministically using the match's seeded random state.
VAR-01-01-06 After a return and shuffle, or a discard under VAR-01-01-04A, immediately continue the same DrawAndPlaceTile phase by drawing the first not-yet-attempted Tile in the current DrawPile order, unless VAR-01-01-08 ends the phase. Already attempted Tiles are skipped in place and remain in DrawPile.
VAR-01-01-07 At the start of each DrawAndPlaceTile phase with TileRecycling active, the set of attempted Tile IDs is empty. Mark each Tile attempted when drawn, before evaluating its placement. Each physical Tile may be attempted at most once in that phase; do not reset the set between retries. A successful placement ends the drawing sequence under CORE-01-04-04.
VAR-01-01-08 If DrawResolution is empty and DrawPile is empty, follow CORE-01-09-01B. If DrawPile is nonempty but every remaining Tile has already been attempted and returned for lacking a geometric placement, treat the pile as permanently undrawable: end the drawing phase, omit the Political Action, and perform the single final Round Settlement under CORE-01-09-01B/-01C and -02. In this second case the remaining Tiles stay in DrawPile; physical pile emptiness is not required for this explicit terminal condition.

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
ADD56-01-01-13A These two additional Grassroots use the identical printed conversion text defined in CORE-01-04-22A.

ADD56-01-01-14 Add Hotspot (DOM) ×1 to DrawPile.
ADD56-01-01-15 Add Hotspot (FOR) ×1 to DrawPile.
ADD56-01-01-16 These Hotspot labels do not modify Hotspot resolution rules.

ADD56-01-02-01 For 5 players, assign 2 Influence objects to each player’s PersonalSupply during setup.
ADD56-01-02-02 For 6 players, assign 2 Influence objects to each player’s PersonalSupply during setup.

ADD56-01-03-00-01 Influence cap adjustment
For 5 players, a player may not exceed 8 Influence objects in total.
For 6 players, a player may not exceed 8 Influence objects in total.
This overrides CORE-01-08-01 while the 5–6 Player Add-On is active.

ADD56-01-03-01 All other CORE-01 rules remain unchanged when the 5–6 Player Add-On is active.
