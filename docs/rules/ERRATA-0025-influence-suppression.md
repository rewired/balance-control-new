# ERRATA-0025 — Influence gain suppression and Greenwashing replacement

Date: 2026-11-08
Status: Accepted for R23
Applies to: EXP-03 v1.0 and CORE/active expansion Influence operations
Decision: DD-0017, R23; approved by the user during the rules review.

## Defect

“Generate Influence” did not identify whether suppression covered creation, ordinary marker transfers, or Hotspot rewards transferred from PersonalSupply. Greenwashing's replacement lacked a clear unit, payer, and boundary against other prohibitions. The broad majority-suppression wording could also affect unrelated placements.

## Approved correction

The authoritative correction is incorporated in `003-expansion03.md`:

- EXP-03-06-06/-07 and EXP-03-08-M05-04/-09 define Greenwashing's global scope: FormalizeInfluence and normal Hotspot Influence payouts, including Labor Market and Transformationsdruck. The existing-marker transfer is explicitly a gain for this purpose.
- EXP-03-08-M07-04/-05 restrict Protest Movement to those Hotspot Influence payouts. Both cards leave ordinary PlaceOrMoveInfluence, virtual Influence, majority, Resources, and Inner Order's Regulation outcome unaffected.
- EXP-03-06-08 preserves Start Committee immunity with no replacement fee, retaining its timing, once-per-game limit, and base costs. Suppressed Hotspots remain processed once without later retry.
- EXP-03-08-M05-05 charges the beneficiary 1 CLM or 1 INF to Bank once per affected gain resolution, not per marker or per active Greenwashing instance. This is an explicit recipient-paid replacement even for an otherwise free automatic Hotspot payout.
- EXP-03-08-M05-06/-07 apply the fixed payment atomically with the permitted outcome and normal formalization costs. It cannot be waived/replaced/transferred as an additional surcharge, including by Supplemental Budget or Intergenerational Pact, and creates no extra tax or action.
- EXP-03-08-M05-08 and EXP-03-08-M07-06 retain other prohibitions and prerequisites. Greenwashing payment does not lift Protest Movement, Blockade, Budget Compromise, or missing marker supply. Pay no fee if another requirement still prevents the outcome. Other output modifiers remain applicable and can produce a paid zero-output outcome.

The two cards' printed costs and durations remain unchanged. “Generate” is now explicitly mapped to operations rather than inferred from whether a marker object is newly created.

## Examples for later implementation verification

1. Under Greenwashing, Standard Committee formalization requires the beneficiary's 1 CLM/INF replacement in addition to normal applicable payment; without it, formalization is prohibited.
2. A normal Hotspot payout under Greenwashing may be restored by its beneficiary's replacement payment, including when someone else is the active player. Marker source and all other prerequisites remain unchanged.
3. Protest Movement suppresses the Hotspot reward even if Greenwashing is active; no Greenwashing fee is paid to bypass it.
4. Ordinary Influence placement/movement and Inner Order's Regulation outcome are unaffected by both cards. Canonical control and virtual Influence are unchanged.
5. Start Committee formalization pays no Greenwashing fee, retaining its own ordinary restrictions.
6. Multiple applicable Greenwashing instances retain one replacement fee per gain resolution. The fixed fee cannot be transferred with Pact or replaced with Supplemental Budget.
7. A restored otherwise legal outcome can still have output reduced to 0 by SecurityLevel. A suppressed Hotspot is processed once and never pays later when suppression expires.

## Scope and implementation status

R23 is approved. R24a Climate-effect classification was subsequently approved in ERRATA-0026-climate-cost-classification.md and R24b protection scope/transfer order in ERRATA-0027-climate-protection-scope.md. Timing vocabulary remains R25, and other unresolved DD-0017 findings remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against these suppression scopes.
