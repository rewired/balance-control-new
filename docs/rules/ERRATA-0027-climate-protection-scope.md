# ERRATA-0027 — Climate protection scope and transfer sequence

Date: 2026-11-08
Status: Accepted for R24b
Applies to: EXP-03 v1.0 and shared payment planning with EXP-01/CORE
Decision: DD-0017, R24b; approved by the user during the rules review.

## Defect

The protection cards did not consistently identify global, action-specific, or personal scope. Cost transfer could move a component to a personally protected recipient without a defined second-waiver/consumption procedure. Technology Initiative's before-action wording also needed binding to ordinary PlayMeasure and its additional action.

## Approved correction

The authoritative correction is incorporated in `003-expansion03.md`:

- EXP-03-02-D-07 checks protection against the original rule-assigned payer before transfer. A newly assigned payer gets no second protection check; component source/kind remain unchanged and their assigned share must be paid fully.
- EXP-03-02-D-08 preserves immunity/prohibition checks and orders the payment plan: collect costs, apply eligible Climate waivers, optionally use Supplemental Budget, optionally transfer a remaining positive surcharge, then validate allowed payment substitutions and commit atomically. Removed components and fixed replacement fees cannot be transferred.
- EXP-03-08-M08-04/-05 make Adaptation Strategy global, including opponents' cost-bearing Tile placements and separately triggered player-paid operations.
- EXP-03-08-M09-04 through -06 bind Technology Initiative to ordinary PlayMeasure and exactly its owner's subsequent permitted non-PlayMeasure additional Political Action this turn. It does not cover its completed card play, Tile placement, or separate later operation. A no-legal-option slot grants no deferred protected action.
- EXP-03-08-M10-04/-05 protect components whose original payer is Future Pact's owner, including cost-bearing Tile placement and their later operations during another player's turn. Personal protection does not apply anew merely because another payer transfers a surcharge to that owner.
- EXP-03-08-M13-10 permits transfer only after waivers/replacement and only for a remaining transferable component. Without an actual transfer there is no Pact consumption; successful atomic completion remains required.

The three cards' printed costs and durations remain unchanged. New protections do not apply retroactively to their completed card play. Timing-boundary definitions remain R25.

## Examples for later implementation verification

1. Global Adaptation Strategy removes applicable Climate surcharges from A and B before any transfer, including a cost-bearing ResortTile placement.
2. Technology Initiative protects the one following non-PlayMeasure action, including TakeMeasure if otherwise legal. A skipped additional slot does not carry protection into another turn.
3. A's active Future Pact removes an eligible Climate surcharge originally owed by A before transfer selection. There is no remaining component to transfer or consume Pact for.
4. Only B has Future Pact; A originally owes a Climate surcharge and transfers it to B. B must fully pay it; B's personal protection is not reapplied after assignment.
5. With two surcharges, a waiver or Supplemental Budget replacement may remove one; Pact may transfer only another remaining eligible additional component. Fixed replacement fees are ineligible.
6. If the final plan cannot complete, no partial payment or Pact consumption occurs, subject to existing explicit failure-consumption exceptions. Earlier successful plays remain completed.

## Scope and implementation status

R24a and R24b are approved. R25a shared timing was subsequently approved in ERRATA-0028-shared-game-clock.md and R25b production wording in ERRATA-0029-canonical-production-wording.md. Duplicate/faulty anchors remain R26.

Only rule documents are changed. Game code has not yet been adapted or verified against these protection scopes and sequence.
