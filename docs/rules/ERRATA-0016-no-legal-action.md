# ERRATA-0016 — Mandatory action slot without a legal option

Date: 2026-11-08
Status: Accepted for R15c
Applies to: CORE-01 v1.0.14 and the shared Measure framework in EXP-01 v1.3
Decision: DD-0017, R15c; approved by the user during the rules review.

## Defect

Mandatory Political Action slots had no completion rule when every permitted option was illegal or unaffordable. For example, a Resource-less player under State of Exception could be unable to perform any action after a successful Tile placement. Budget Deficit could perpetuate the same situation if no attempt could occur to consume it.

## Approved correction

The authoritative correction is incorporated in `000-core.md` and `001-expansion01.md`:

- CORE-01-04-09 through -09C require checking all permitted legal options after the slot's prerequisite resolutions, including payment alternatives, substitutions, transfers, and Start Committee immunity.
- If any option exists, an action must be chosen. If none exists, the slot automatically completes without an action or payment. The additional non-PlayMeasure slot follows the same rule, checking only its permitted actions.
- Previous Tile placement, Hotspot resolutions, a successful Measure, paid costs, and shared PlayMeasure usage remain effective. Completion adds no card transfer or PlayMeasure usage.
- EXP-01-06-05(b)/-05C expressly apply the exception after immediate Measure resolution and mandatory market refill.
- EXP-01-08-M06-07A treats completion as a failed attempt solely to consume the applicable Budget Deficit effect. The slot remains completed after consumption; other action-attempt effects do not trigger.
- Other pending effects require their actual trigger. Intergenerational Pact is not consumed without a cost transfer. Normal turn, round, and final-Settlement procedures follow.

Existing rule IDs remain available. This is a mandatory progression rule and introduces no voluntary pass action.

## Examples for later implementation verification

1. After Tile placement, a player with no Resources and no legal option under State of Exception completes the Political Action slot with no payment; the placement and resolved Hotspots remain.
2. A legal option using an allowed cost substitution, transfer, or Start Committee immunity prevents automatic completion.
3. If PlayMeasure succeeds but its additional slot has no legal non-PlayMeasure option, complete only that slot. Retain the card's resolved outcome, paid cost, lifecycle transfers, refill, and used PlayMeasure flag.
4. If Budget Deficit applies to an unavailable mandatory slot, consume it without payment and finish the slot; do not immediately reopen it after the surcharge disappears.
5. Intergenerational Pact waiting for a cost transfer remains unconsumed when no transfer occurs. Completion does not simulate another action or card play.
6. A completed last-turn slot proceeds to the single final Settlement under CORE-01-09; it does not create another turn.

## Scope and implementation status

R15a, R15b, and R15c are approved. R16 was subsequently approved in ERRATA-0017-securitylevel-output.md; a legal zero-output action prevents mandatory completion without an action. R17a active-effect identity was subsequently approved in ERRATA-0018-active-effect-instances.md and R17b ordering/payment behavior in ERRATA-0019-effect-order-and-payment.md. Detailed timing vocabulary remains R25.

Only rule documents are changed. Game code has not yet been adapted or verified against this completion rule. Other open DD-0017 proposals remain separate.
