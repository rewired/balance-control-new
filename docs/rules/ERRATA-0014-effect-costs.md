# ERRATA-0014 — Effect costs and payers

Date: 2026-11-07
Status: Accepted for R15a only
Applies to: CORE-01 v1.0.14, EXP-01 v1.3, EXP-02 v1.0
Decision: DD-0017, R15a; approved by the user during the rules review. R15b and R15c were subsequently approved separately.

## Defect

Cost increases applied to broadly defined effects, including automatic outcomes with no designated payer. Immediate card instructions and their containing action could also be charged twice if the resolver split them internally. State of Exception's all-effects wording inherited those ambiguities.

## Approved correction

The authoritative correction is incorporated in the affected rule files:

- CORE-01-06-00-07 exempts automatic Resort Production and the normal Hotspot Influence payout from Resource surcharges, while preserving prohibitions and output modifiers.
- Player actions and player-executed Measure/Regulation operations have a payer even at base cost 0. Later triggered operations use their Measure's player unless an explicit cost rule assigns otherwise.
- CORE-01-06-00-08 combines an immediate Measure and its contained Regulation placement into one cost basis and applies modifiers once. Internal payment, modifier evaluation, and bookkeeping do not create additional taxes. A granted Political Action remains a separate resolution.
- CORE-01-06-00-09 checks explicitly later operations at their actual trigger without recalculating prior card payments or charging passive modifier application to exempt automatic payouts.
- EXP-01-06-05B applies these boundaries to the shared PlayMeasure procedure.
- EXP-02-02-C-05 and EXP-02-04-A-06 apply them to Regulations.
- EXP-02-02-G-05A/-05B make Inner Order's voluntary operation payable by its majority leader, with Inner Order as the single ContextTile, preserving remote object/destination legality.
- EXP-02-08-M10-03 limits State of Exception to player-paid resolutions; EXP-02-10-03 removes a production Resource-cost stage.

Prohibitions precede payment, costs must be fully paid atomically, additive stacking remains, and Start Committee immunity and explicit consumption-on-failure rules remain applicable. Existing rule IDs are preserved.

## Examples for later implementation verification

1. An otherwise unmodified controlled W3 with Administration produces three Resources without a production fee. PlaceOrMoveInfluence targeting that Tile can incur Administration's +1 cost.
2. State of Exception adds +1 to an otherwise free Place, Move, TakeMeasure, or Apparatus activation, but not to automatic production or a normal Hotspot Influence payout.
3. Threat Situation has base card cost SEC+INF and an immediate normal Regulation placement costing 2 SEC: the combined base is 3 SEC + 1 INF. An applicable global +1 is added once, not once for the card and again for the embedded placement.
4. The extra Political Action after that PlayMeasure has its own applicable costs; it is not included in the card's one-pass exemption.
5. Emergency Decree pays its card price at play and its later placement cost at trigger under the then-current modifiers. The earlier payment is not recalculated.
6. Inner Order's majority leader pays the chosen Regulation operation's required costs. The alternative is not a free automatic Influence reward.
7. A prohibited effect pays nothing. A specific consumed-on-failed-attempt rule can still consume a pending effect without making a partial payout or payment.

## Scope and implementation status

This erratum approves only R15a. R15b was subsequently approved and is documented in ERRATA-0015-settlement-sequence.md. R15c was subsequently approved in ERRATA-0016-no-legal-action.md, which defines mandatory completion when no legal Political Action exists. R16 output semantics were subsequently approved in ERRATA-0017-securitylevel-output.md; general active-instance ordering remains R17.

Only rule documents are changed. Game code has not yet been adapted or verified against these cost boundaries. No unrelated open DD-0017 proposal is approved by this erratum.
