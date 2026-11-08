# ERRATA-0026 — Static Climate origin and cost classification

Date: 2026-11-08
Status: Accepted for R24a only
Applies to: EXP-03 v1.0 and interactions with CORE/other expansion costs
Decision: DD-0017, R24a; approved by the user during the rules review. R24b was subsequently approved separately.

## Defect

Climate-effect classification could be read as depending on a freely chosen payment currency rather than the effect's origin. This could make a Regulation surcharge disappear when paid with CLM, or let a Climate-cost exemption reclassify the effects it inspected. Base costs, additional surcharges, and fixed replacement payments also needed separate treatment.

## Approved correction

The authoritative correction is incorporated in `003-expansion03.md`:

- EXP-03-02-D-01/-02 identify Climate effects by EXP-03 Measure origin, explicitly printed mandatory CLM base cost, or express normative Climate designation. Mere currency choice, a CLM ContextTile, or an exemption reference is insufficient.
- EXP-03-02-D-03 preserves each component's source rule/effect identity and cost kind: base, additional surcharge, or fixed replacement. Substitution does not remove an existing Climate classification; a Climate surcharge does not reclassify the action or unrelated components. Pact transfer retains source/kind.
- EXP-03-02-D-04 limits the three protection cards, within their applicable scope, to additional Resource surcharges of Climate origin. Card prices, other base costs, fixed replacement fees, prohibitions, and non-Climate surcharges remain applicable.
- EXP-03-02-D-05 gives a Supplemental Budget replacement its own fixed EXP-01 source; it does not inherit the omitted surcharge's Climate origin.
- EXP-03-02-D-06 makes exemptions nonrecursive component filters. They do not delete effect instances, trigger another cost pass, or activate reserved/excluded content.

Existing rule IDs and printed card prices are retained. This decision determines source and cost categories only; it does not choose which players/actions each protection covers or when its scope is evaluated relative to cost transfer.

## Examples for later implementation verification

1. Carbon Levy remains a Climate surcharge when its 1 CLM/DOM alternative is paid with DOM. Energy Crisis remains a Climate source for its DOM surcharge.
2. Administration or State of Exception paid with CLM remains a non-Climate surcharge and is not removed by a Climate-cost waiver.
3. A Climate card's printed CLM price remains a base cost even if an allowed substitution pays it differently; Climate-cost waivers do not remove it.
4. Greenwashing's recipient-paid replacement remains a fixed fee, despite Climate origin. Supplemental Budget's replacement is a fixed EXP-01 payment. Neither is an additional Climate surcharge eligible for these exemptions.
5. Pact transfer preserves the original surcharge source; the receiving player's currency choice does not change it. The separately approved protection-scope/transfer-order decision is documented in ERRATA-0027 under R24b.
6. An exemption filters eligible cost components without ending itself or another active Measure, and cannot introduce reserved M14/M15 or Countdown state.

## Scope and implementation status

This erratum approves R24a only. R24b was subsequently approved in ERRATA-0027-climate-protection-scope.md, defining explicit protection scopes and the sequence relative to cost replacement/transfer. Timing vocabulary remains R25 and anchor cleanup R26.

Only rule documents are changed. Game code has not yet been adapted or verified against this classification.
