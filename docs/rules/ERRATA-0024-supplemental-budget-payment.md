# ERRATA-0024 — Supplemental Budget before payment

Date: 2026-11-08
Status: Accepted for R22
Applies to: EXP-01 v1.3 and applicable Measure/Regulation cost increases
Decision: DD-0017, R22; approved by the user during the rules review.

## Defect

Supplemental Budget allowed ignoring an additional cost only after paying the Political Action. It did not specify whether that meant advance replacement, a refund, or a payment without benefit, and unaffordable original costs prevented reaching that timing. Its undefined “Overlay” term also obscured eligible cost sources.

## Approved correction

The authoritative correction is incorporated in `001-expansion01.md`:

- EXP-01-08-M10-04 selects one actual additional Resource-cost unit from a Measure or cost-increasing Regulation before payment, for a subsequent Political Action by the card's owner this turn. At most one unit is replaced per action.
- EXP-01-08-M10-05 replaces that unit with a fixed payment of 1 Resource of any active resort. Final costs are base costs, remaining additional costs, and the replacement payment. There is no original-unit payment or retrospective refund.
- EXP-01-08-M10-06 requires an eligible surcharge, preserves base costs/prohibitions/minimum requirements, and distinguishes one Resource unit from all surcharges of a source. The card's printed 1 ECO cost remains separately paid at play and is not retroactively modified.
- EXP-01-08-M10-07 treats the replacement payment as a fixed part of the same plan, without another taxed resolution. It cannot itself be waived, replaced, or transferred, including through Supplemental Budget or Intergenerational Pact. The omitted original unit cannot be transferred either.
- EXP-01-08-M10-08 checks prohibitions first and commits the final payment with the main action atomically. Failure pays no partial costs and grants no main effect; explicit consumption exceptions and prior successful payments remain intact. The card grants no further action and retains This turn duration.

Existing rule IDs and printed card cost are preserved. “Overlay” is replaced by the defined Regulation term at this card only; the separate EXP-03 production wording and timing vocabulary remain R25.

## Examples for later implementation verification

1. An Investment Program conversion costs 2 ECO plus an Energy Crisis surcharge of 1 DOM. With an active Supplemental Budget, pay 2 ECO + 1 FOR instead; the earlier 1 ECO card payment remains paid.
2. Two additional cost units from the same source do not both disappear: replace only one and pay the other normally.
3. Without an eligible additional cost, no replacement payment can be chosen. Base conversion/formalization costs cannot be selected.
4. The replacement Resource cannot be forwarded through Intergenerational Pact or replaced again by this card; no extra resolver tax arises from paying it.
5. If the final plan is unaffordable, no partial payment or main action effect occurs. Explicit Budget Deficit consumption rules retain their stated scope.
6. Blockade is not bypassed, and a failed later action never refunds the previously successful card play.

## Scope and implementation status

R22 is approved. R23 Influence suppression was subsequently approved in ERRATA-0025-influence-suppression.md, R24a classification in ERRATA-0026-climate-cost-classification.md, and R24b protection scope/transfer order in ERRATA-0027-climate-protection-scope.md. Timing vocabulary/remaining Overlay usage remains R25. Other unresolved DD-0017 findings remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against this payment replacement.
