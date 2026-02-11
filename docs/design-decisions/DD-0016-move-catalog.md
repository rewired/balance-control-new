# DD-0016 REPLACEMENT CHARACTER (U+FFFD) Move Catalog and Router Move

Decision date: 2026-02-11

Context:
- Moves must be extensible by expansions without contaminating core (AGENTS REPLACEMENT CHARACTER (U+FFFD)3.4, REPLACEMENT CHARACTER (U+FFFD)3.8).
- Bot output requires strict JSON validation (AGENTS REPLACEMENT CHARACTER (U+FFFD)4.2) and deterministic legal listings (AGENTS REPLACEMENT CHARACTER (U+FFFD)4.1).
- boardgame.io `Game` structure is static; per-match dynamic move keys are cumbersome.

Decision:
- Define a rules-level move catalog that merges core + enabled expansion move definitions, each with a strict zod schema and optional legal enumerator.
- In the game layer, expose a single routing move `doPoliticalAction` for the political phase. It validates `{ type, payload }` against the catalog built from `G.exp` flags, executes the matched definition, and ends the turn (CORE-01-04-09).

Rationale:
- Keeps boardgame.io layer thin and deterministic while allowing modular extension.
- Avoids leaking disabled expansion moves into match state or UI enumeration.
- Aligns with the bot contract (index selection atop deterministic listing).

Implications:
- UI and bot consume the catalog for legal options; only `doPoliticalAction` is surfaced to the engine.
- Future expansions implement `extendMoves(builder)` to register moves; no ghost moves when disabled.

Alternatives considered:
- Static widening of move keys in the phase: rejected due to coupling and disabled-move leakage.
- Per-match dynamic `phases` construction: possible but more invasive and harder to test.
