# ERRATA-0030 — Unique rule anchors and editing-residue removal

Date: 2026-11-08
Status: Accepted for R26
Applies to: EXP-01 v1.3, EXP-03 v1.0, and affected documentation references
Decision: DD-0017, R26; approved by the user during the rules review.

## Defect

EXP-01-07-07 identified both usage-flag reset and the additional-play-window restriction. EXP-03's usage-flag paragraph incorrectly used EXP-01-07-03, colliding with the actual EXP-01 FinalDiscard rule. A five-line editing note remained before the Climate Measure definitions.

## Approved correction

- Keep EXP-01-07-07 for Per-Round Usage Flags. Rename only its second occurrence, the additional-play-window restriction, to EXP-01-07-07A.
- Rename the EXP-03 usage-flag paragraph to EXP-03-07-03. Preserve EXP-01-07-03 for FinalDiscard after a card's second play.
- Remove the non-rule German editing note and its redundant separator before EXP-03-08. Card rules remain unchanged by this cleanup.
- Align Task 0027's flag-reset wording with the already approved R25a: only at an actual new round after Settlement and due expiry, never after final Settlement. Its older checked implementation results are explicitly historical, not verification of the consolidated rules.
- Preserve valid references to EXP-01-07-07, including the existing game-code comment. No code-reference migration is required for that comment. Historical references in the audit remain as evidence of the original defects.

The current authoritative definitions are incorporated in `001-expansion01.md` and `003-expansion03.md`. This is editorial cleanup of approved rules and introduces no additional game behavior.

## Verification requirements

1. Definition anchors in the four normative specifications are unique across files, excluding chapter listings in the indexes.
2. EXP-01-07-07 and EXP-01-07-07A each identify exactly one distinct rule.
3. EXP-03-07-03 identifies the Climate usage-flag paragraph; EXP-01-07-03 identifies only the EXP-01 second-play FinalDiscard rule.
4. The German editing note is absent and the existing code comment still points to the preserved flag-reset anchor.
5. Current explicit normative cross-references resolve to defined anchors. Original anchors retained in historical audit/errata explanations are not reinterpreted as current definitions.

## Scope and implementation status

R26 is approved. All 26 DD-0017 findings are now decided: R01–R11 and R13–R26 were approved and incorporated through ERRATA-0001 to -0030; R12 was resolved by approved R02.

Earlier errata entries retain their decision history; their references to then-open findings describe that earlier stage. Use the consolidated normative specifications and DD-0017's closing status for the current rule set.

Only documentation is changed. Game code has not yet been adapted or verified against the consolidated rules. The prior test/lint results recorded in DD-0017 are historical implementation checks, not proof of compliance with these rule revisions.
