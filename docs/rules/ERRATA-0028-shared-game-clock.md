# ERRATA-0028 — Shared game clock and Settlement-inclusive rounds

Date: 2026-11-08
Status: Accepted for R25a only
Applies to: CORE-01 v1.0.14 and all expansion duration definitions
Decision: DD-0017, R25a; approved by the user during the rules review. R25b was subsequently approved separately.

## Defect

Local duration lists omitted terms actually used by cards. Round definitions included Settlement, while This round expressly expired before it. Turn-end, future-turn, future-round, final-Settlement, and reset boundaries were not fully coordinated.

## Approved correction

The authoritative correction is incorporated in CORE and the three expansion specifications:

- CORE-01-07-01/-06 and -07 through -18 establish one event-based clock, without retroactive registration or system time. All expansions reference it.
- A complete turn includes drawing/placement, Hotspots, the entire Political Action sequence, refill, and prescribed follow-ups. This turn ends after these, before Settlement. A begun terminal failed-draw turn still counts as begun.
- This round now includes the full current Settlement, including a final one, and expires afterward. This deliberately supersedes the earlier pre-Settlement expiry.
- Immediate completes within its permitted resolution. The three Settlement-duration wordings identify the next upcoming Settlement during ordinary card play and end afterward.
- Next round is active only in the actual next round through its Settlement. Until the end of the next round is active from registration through that later Settlement.
- Until the beginning of your next turn ends before Phase 1 of the original owner's next actual turn. During the target player's next turn covers only that next turn from Phase 1 through complete turn end. Until consumed ends at its expressly defined consumption event.
- At turn start, expire due effects before activating effects assigned to that turn. After Settlement, expire due effects; only on actual new-round start reset prescribed usage flags and activate Next round windows. Final Settlement creates no new-round reset or artificial future window.
- Expiry does not undo completed placements or other outcomes. No new hand-card play window, Political Action, or Countdown operation is introduced.

EXP-01-04-A/-07, EXP-02-07, EXP-03-00-09/-04-A/-07 reference the common clock. Existing card-specific triggers and hierarchy remain applicable. R26 subsequently corrected the additional-play-window anchor to EXP-01-07-07A and the Climate flag paragraph to EXP-03-07-03 in ERRATA-0030-rule-anchor-cleanup.md.

## Examples for later implementation verification

1. This round Order Partnership, Surveillance, and State of Exception remain applicable during eligible Settlement operations, then expire. State of Exception still does not tax automatic Resort Production under R15a.
2. A PlayMeasure This turn effect remains available during its additional action and prescribed follow-ups, then expires before Settlement.
3. An Until-next-own-turn effect expires before that owner's Phase 1. A target-next-turn effect activates afterward for the correct target turn; neither opens a new card-play window.
4. A Next round effect is inactive in the current Settlement. An Until-end-of-next-round effect is already active during the remainder of the current round.
5. The final Settlement is a real Settlement for duration resolution, but no new round or never-played future turn is simulated afterward.
6. Expiry of a This turn card that placed a persistent Regulation does not remove that Regulation without an explicit removal rule.
7. Per-round flags reset only when another round actually begins; no such reset follows final Settlement.

## Scope and implementation status

This erratum approves R25a only. R25b was subsequently approved in ERRATA-0029-canonical-production-wording.md, completing the production wording and resolving Overlay as Regulation. R26 anchor cleanup was subsequently approved and completed in ERRATA-0030-rule-anchor-cleanup.md.

Only rule documents are changed. Game code has not yet been adapted or verified against these clock boundaries.
