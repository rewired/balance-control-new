# ERRATA-0018 — Physical cards and active effect instances

Date: 2026-11-08
Status: Accepted for R17a only
Applies to: Shared Measure framework and all active expansion Measure decks
Decision: DD-0017, R17a; approved by the user during the rules review. R17b was subsequently approved separately.

## Defect

A played card could circulate or reach FinalDiscard while its effect was still pending. The specifications did not expressly separate the physical card from independent effects of its successive plays or define which instance owned usage flags and later choices.

## Approved correction

The authoritative correction is incorporated in `001-expansion01.md`, `002-expansion02.md`, and `003-expansion03.md`:

- EXP-01-06-05D completes immediate instructions and registers a continuing/future effect without waiting for its later trigger or expiry. Card lifecycle, refill, and the ordinary additional action then proceed, including the no-legal-option exception from R15c.
- EXP-01-07-08 assigns each such successful play its own deterministic immutable effect ID, source-card/play identity, original owner, selected targets/parameters, duration/trigger, and usage/consumption flags. This is a record, not a duplicate card in another zone.
- EXP-01-07-09 separates card circulation from effect lifetime. Recycle, new holder, replay, and FinalDiscard do not alter an earlier effect. A subsequent play creates an independent instance.
- EXP-01-07-10/-11 end each effect only according to its own rules and preserve existing instance restrictions, stacking rules, shared usage limits, and flag-reset rules. No additional stacking permission is created.
- EXP-01-07-12 binds initial targets and records only expressly permitted later choices at their defined triggers. Such choices create neither a new PlayMeasure nor an additional Political Action.
- EXP-01-07-13 and EXP-02-07-01C / EXP-03-07-01B apply the procedure across active decks without activating disabled expansion content. The existing per-round flag paragraphs refer to active effect instances.

Existing rule IDs remain available. The duplicate/faulty IDs identified in R26 are not renumbered here. Timing keywords remain R25; this clarification does not change durations or specific consumption exceptions.

## Examples for later implementation verification

1. A plays Budget Deficit against B. The card reaches Recycle while its pending effect retains A as owner and B as target.
2. C later legally plays that same card against D. The second instance has C/D and independent flags; it does not replace the A/B instance.
3. The card entering FinalDiscard after its second play ends neither pending instance. Each ends through its own consumption rule.
4. Recycling or drawing an Economic Council card does not reset a previously registered instance's usage flag.
5. An expressly deferred choice is recorded at its actual trigger. A previously selected target is not silently changed because the source card has a different holder.
6. An illegal simultaneous Carbon Levy target remains illegal despite the separate-instance model.
7. EXP-02 or EXP-03 alone can use this procedure without ECO, EXP-01 cards, or EXP-01 zones. CORE alone receives no Measure effects.

## Scope and implementation status

This erratum approves R17a only. R17b was subsequently approved in ERRATA-0019-effect-order-and-payment.md, defining general simultaneous-effect ordering and atomic payment/consumption rules, particularly for Intergenerational Pact and Economic Council. Already approved card-specific rules remain in force.

Only rule documents are changed. Game code has not yet been adapted or verified against this instance model.
