# ERRATA-0003 — Movement ContextTile

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14 and EXP-02 v1.0
Decision: DD-0017, R03; approved by the user during the rules review.

## Defect

Influence and Regulation movements refer to source and destination Tiles without explicitly assigning ContextTile as required by CORE-01-06-00-06. Authority Apparatus operations additionally reference an activation Tile. The scope of source restrictions versus local effect modifiers was not explicit.

## Approved correction

The authoritative correction is incorporated in `000-core.md` and `002-expansion02.md`:

| Operation | ContextTile | Normative section |
| --- | --- | --- |
| Place or move Influence | Destination Tile | CORE-01-06-00-05A |
| Place Regulation directly through a Measure | Target Tile | EXP-02-04-A-07 |
| Move Regulation directly through a Measure | Destination Tile | EXP-02-02-F-04 |
| Remove Regulation directly through a Measure | Current carrier Tile | EXP-02-02-E-03 |
| Activate Authority Apparatus, including its embedded operation | Apparatus Tile | EXP-02-05-04 |

CORE-01-06-00-05B separates ContextTile-local modifiers from explicit object movement/removal restrictions. EXP-02-02-D-03 states that source Blockade alone does not prevent leaving when ContextTile is elsewhere. EXP-02-05-05 preserves explicit source restrictions and destination-type legality for Apparatus operations.

## Examples for later implementation verification

1. Moving Influence from a blockaded source to an otherwise legal, unblocked destination is allowed. Destination-local modifiers apply; source-local modifiers do not.
2. Moving Influence onto a blockaded destination is prohibited and changes no state.
3. A Measure cannot move a Regulation away from a source under Surveillance, even when the destination is unblocked.
4. An Apparatus operation is modified at the Apparatus once. Local modifiers on a remote source or destination do not cause a second effect-modifier pass. Surveillance and Regulation-type destination restrictions still apply.
5. Direct Measure-based removal from a blockaded carrier Tile is prohibited; an otherwise legal Apparatus removal uses the Apparatus as ContextTile instead. These are different activation routes with explicitly different contexts.

## Scope and implementation status

This correction defines context and restriction checks. It does not decide who may move whose Influence (R08), when Authority Apparatus may be activated or what its normal effect is (R14), Regulation output semantics (R16), or new reaction windows (R13).

Only rule documents are changed. Game code has not yet been adapted or verified against this correction. Existing rule IDs are preserved; other open DD-0017 proposals are not approved by this erratum.
