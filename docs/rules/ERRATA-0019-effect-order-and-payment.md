# ERRATA-0019 — Trigger order and atomic payment/consumption

Date: 2026-11-08
Status: Accepted for R17b
Applies to: CORE-01 v1.0.14 and all active expansion Measure frameworks
Decision: DD-0017, R17b; approved by the user during the rules review.

## Defect

The rules did not generally order simultaneously triggered operations or define a shared completion point for payment, immediate effects, cost substitutions, and cost-transfer consumption. Intergenerational Pact's consumption after transfer could conflict with complete failure of the original action, and failed PlayMeasure bookkeeping was not expressly specified.

## Approved correction

The authoritative correction is incorporated in CORE and the three expansion specifications:

- CORE-01-06-00-10 requires a complete payment plan before mutation, with every payer fully able to pay, no Resource used twice, and each additional component transferred at most once by Intergenerational Pact. Different permitted instances may transfer different components; forwarding and cycles are excluded.
- CORE-01-06-00-11 commits successful payments, immediate effect, effect registration, and associated usage/consumption atomically. Failure makes no partial payment or main effect and does not use a merely proposed Economic Council substitution or Pact transfer.
- Explicit consumption exceptions remain: Budget Deficit, Emergency Decree, and Deployment Order retain their defined behavior. Successful predecessors are not rolled back by a separately triggered failure, and a legal paid zero-output action remains successful under R16.
- CORE-01-06-00-12 rejects initially illegal inputs without treating them as action attempts. R15c's automatic no-legal-action completion and its Budget Deficit exception remain intact.
- EXP-01-07-14 orders triggered operations by registration order, then stable ordinal lexicographic instance ID, within the already prescribed window. Snapshot the already registered triggered instances for the event, each at most once; fully resolve each against the current state before the next. New instances do not trigger retroactively. Passive modifiers remain in their canonical stages.
- EXP-01-07-15 commits successful PlayMeasure counters and shared usage with its immediate resolution, followed by lifecycle/refill/additional action. A failed play retains its card and prior counters, usage, and pending effects without registering a new effect, and grants neither attempt-based refill nor additional action.
- EXP-01-08-M08-05 and EXP-03-08-M13-06/-08/-09 explicitly bind Economic Council and Intergenerational Pact to the atomic procedure. EXP-02-07-01C and EXP-03-07-01B import the shared ordering and play procedure.

Existing rule IDs remain available. Canonical resolver, production, Settlement, Hotspot, ContextTile, and Start Committee immunity rules take precedence at their defined stages. R22 was subsequently approved in ERRATA-0024-supplemental-budget-payment.md and R24a/R24b in ERRATA-0026/0027. Timing vocabulary R25 remains open.

## Examples for later implementation verification

1. Two triggered operations in one window resolve in registration order; the second checks the state left by the first. Stable IDs break a same-order tie.
2. A newly registered effect cannot react to the earlier event that has already started; passive production modifiers still participate in the canonical modifier stage.
3. A plans an Economic Council substitution and a Pact transfer to B. If any required payment cannot complete, neither payer pays partially, Council remains unused, and Pact remains unconsumed.
4. If every payment and the resolution succeed, payments, main effect, Council usage, and Pact consumption are applied together.
5. Two permitted Pact instances may transfer two distinct additional components, but cannot repeatedly transfer the same component.
6. A failed PlayMeasure leaves the card in hand and does not increment its play counter or shared round usage, register its future effect, refill due to the failed attempt, or grant an additional action.
7. A later Emergency Decree failure retains its explicit consumption exception and does not refund or undo the earlier successful card play.
8. An initially illegal request cannot be used to consume Budget Deficit for free. Mandatory no-legal-option completion still consumes it under its explicit R15c exception.

## Scope and implementation status

R17a and R17b are approved. The other unresolved DD-0017 findings remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against these ordering and payment rules.
