# ERRATA-0015 — Round Settlement sequence

Date: 2026-11-07
Status: Accepted for R15b only
Applies to: CORE-01 v1.0.14 and EXP-02 v1.0
Decision: DD-0017, R15b; approved by the user during the rules review. R15c was subsequently approved separately.

## Defect

Registered one-time Settlement operations had no position relative to production, and ResortTiles had no deterministic processing order. EXP-02-04-C-02 placed Regulation modification after majority, conflicting with canonical production's output-modifier stage.

## Approved correction

The authoritative correction is incorporated in `000-core.md` and `002-expansion02.md`:

- CORE-01-07-03 through -06 determine effect applicability, resolve registered one-time Settlement operations before production, produce ResortTiles sequentially, finish explicitly subsequent Settlement effects, and only then end Settlement.
- One-time operations use game-event registration order, with stable effect-instance IDs as the ordinal lexicographic tie-breaker. System time is not used.
- ResortTiles use ascending ordinal lexicographic Tile-ID order. Each complete production retains CORE-01-06-16: printed value, doubling, output modifiers, floor, majority, distribution/Noise.
- Production modifiers such as Economic Stimulus participate at their Tile's production stage; they are not separately executed before production.
- EXP-02-04-C-02 expressly places SecurityLevel in production's output-modifier stage before majority/distribution, retaining the separate Hotspot procedure.
- EXP-02-08-M08-04 and M12-04 bind De-escalation and Loss of Control to the pre-production operation stage, without creating a new PlayMeasure window.
- Beginning-of-round resets occur only after Settlement and only when a next round begins. Final Settlement ends in scoring without a new round, preserving R05.

Existing rule IDs and the R15a cost model are preserved. This procedure did not itself change durations. R25a subsequently defined This round to include Settlement and established the common clock in ERRATA-0028-shared-game-clock.md; use that later clarification for current duration boundaries.

## Examples for later implementation verification

1. Previously registered De-escalation and Loss of Control resolve before the first ResortTile produces, in their registration order.
2. Economic Stimulus is collected and applied when its ResortTile produces, before output reductions, rather than as an early mutation of the printed Tile value.
3. A W3 doubled by Economic Stimulus and reduced by one SecurityLevel has output 5 before majority distribution, absent other modifiers or prohibition.
4. Sequential ResortTile production follows fixed Tile IDs rather than UI iteration or object insertion order.
5. An explicitly applicable subsequent Settlement effect finishes before new-round usage flags reset or final victory is determined.
6. No new cards may be played from hand during these registered operations. An already expired effect does not become active merely because Settlement starts.

## Scope and implementation status

R15c was subsequently approved in ERRATA-0016-no-legal-action.md, defining mandatory completion for a Political Action slot with no legal option. Generic active-effect identity and ordering beyond this Settlement procedure remain R17; detailed timing vocabulary remains R25.

Only rule documents are changed. Game code has not yet been adapted or verified against this Settlement sequence. Other open DD-0017 proposals remain separate.
