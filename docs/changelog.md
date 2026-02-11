# Changelog\n
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0001: Workspace skeleton & tooling
- Scaffolded pnpm workspace with packages: @bc/rules, @bc/game, @bc/server, @bc/client-web, @bc/bot-llm, @bc/shared.
- Added TypeScript strict base config with project references.
- Set up ESLint + Prettier across repo.
- Added Vitest with placeholder tests in each package.
- Created Vite React client that renders a placeholder and imports @bc/shared.
- Added .nvmrc (Node 20.11.1) and engines in root package.json.
- Added root scripts: build/lint/test/dev.

- Pinned packageManager to pnpm@10.18.0 to match local toolchain; removed UTF-8 BOMs from package.json files to fix vitest/Vite PostCSS config parsing during tests.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0002: boardgame.io hello-game\n- Added minimal CounterGame with deterministic increment move (non-normative).\n- Wired @bc/server with boardgame.io Server and lobby (dev via tsx).\n- Updated client to support Hotseat and Network (Lobby) modes.\n- Replaced tsconfig-paths plugin with explicit Vite aliases for stability.\n- Fixed BOM issues in package.json files; normalized deps for boardgame.io.\n
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0003: Core state model\n- Added core types (zones, tiles, resources, influence) in @bc/rules.\n- Added zod GameConfig schema and seeded shuffle utility in @bc/shared.\n- Implemented deterministic setup builder (Start Committee on Board; others in DrawPile) and CoreGame wrapper.\n- Unit tests for starting Influence counts and tile totals with CORE references.\n
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0004: Turn structure + hex placement\n- Implemented hex topology adjacency in @bc/rules (CORE-01-00-T01..T05).\n- Added placement legality and deterministic draw/discard loop (CORE-01-04-05/06/07/08).\n- Wired CoreGame phases: DrawAndPlaceTile and ExactlyOnePoliticalAction; added placeTile/chooseNoop moves.\n- Client: basic Core board UI to place the drawn tile.\n- Tests: adjacency, legal/illegal placement, discard-and-redraw path; updated vitest aliases.\n
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0005: Majority & Control service\n- Added canonical computeMajority/getControl in @bc/rules with Lobbyist adjacency bonus (CORE-01-05-01..06).\n- Extended CoreState to track influencesOnBoard for tests and future moves.\n- Unit tests: simple majority, tie?null, lobbyist adjacency, multi-lobbyist stacking.\n
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0006: Hotspots, Settlement, Production order
- @bc/rules: added isFullySurrounded (CORE-01-06-01..02), resolveHotspot (CORE-01-06-02..03), resolveProductionForTile (CORE-01-06-16), resolveRoundSettlement (CORE-01-07), and Noise remainder handling (CORE-01-06-15).
- @bc/game: placeTile now resolves any Hotspot that becomes enclosed before Political Action; end-of-round settlement runs after the last player each round.
- @bc/shared: introduced stableHash with deterministic JSON serialization (CORE-01-05, 5.3 Deterministic Hashing).
- Tests: unit tests for hotspot triggering/award, production majority/tie-to-noise; golden replay test with fixed seed and action list asserting final state hash.
- Lint: tightened types (no any), fixed previous encoding artifacts in tests.

## 2026-02-11 Chore/Renumbering
- Task Renumber Notice: Legacy numbering 0007+ shifted to 0027+ to introduce expansion plumbing layer.## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0010: Expansion flags & match config contract
- @bc/rules: added ExpansionId type, ExpansionFlagsSchema (strict), and MatchConfigSchema; defaults to CORE-only when missing; rejects unknown keys.
- @bc/rules: extended CoreState with optional `exp` slice that appears only when an expansion is enabled (no ghost state).
- @bc/game: CoreGame.setup now parses `setupData` via MatchConfigSchema and passes expansion flags into state builder.
- Tests: schema validation, CORE-only vs exp01-enabled state, and game-setup wiring.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0011: Resource registry generalization
- @bc/rules: introduced registry-driven resources (ResourceId) and helpers (makeEmptyResourceBank, addResources, subResources, canPay, assertNonNegative);
- @bc/rules: CoreState now stores resource amounts as maps keyed by ResourceId (no arrays); bank/noise initialized from registry; no hardcoded DOM/FOR/INF branching in logic.
- @bc/game: golden hash updated due to deterministic state-shape change.
- Tests: registry behavior, CORE-only keyset, paying/insufficient checks; updated production tests for map counts.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0012: Expansion state namespacing
- @bc/rules: added ExpansionId and typed expansion slices (Exp01State, Exp02State, Exp03State) under `G.exp`.
- @bc/game/@bc/rules setup already ensures `G.exp` is omitted unless at least one expansion is enabled; present keys only for enabled expansions.
- Tests: existing expansion-config tests assert absence/presence; types updated without changing behavior.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0013: Expansion registry interface
- @bc/rules: added expansion module/types and registry REPLACEMENT CHARACTER (U+FFFD) ExpansionModule, ExpansionHooks, registerExpansion, createExpansionRegistry(flags) with deterministic ordering.
- @bc/rules: setup applies registerResources of enabled modules on the core resource registry; modules remain stubs (no mechanics yet).
- Tests: verify module filtering and deterministic order (core-only, single, and mixed combinations).
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0014: Canonical effect resolver pipeline
- @bc/rules: added EffectDescriptor and createResolver(resolveEffect) implementing AGENTS REPLACEMENT CHARACTER (U+FFFD)3.5 order (ContextTile ? prohibitions ? cost increases ? output modifiers ? floors ? atomic execute) with Start Committee immunity (AGENTS REPLACEMENT CHARACTER (U+FFFD)3.7).
- @bc/rules: typed ExpansionHooks (prohibitions/costIncreases/outputModifiers) to remove unknown/any and ensure deterministic signatures.
- Tests: resolver sequencing, Start Committee immunity, and atomic failure when increased cost is unpayable. All packages pass pnpm test.
- Lint: resolved ESLint errors; no any remaining in resolver/tests.

## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0015: Production modifier hooks integration
- @bc/rules: added collectProductionModifiers() and integrated hook application at production step 3 (AGENTS REPLACEMENT CHARACTER (U+FFFD)3.6) without changing core ordering.
- @bc/rules: typed production modifier hook in ExpansionHooks and wired into resolveProductionForTile/resolveRoundSettlement with optional modules.
- @bc/game: Round settlement now derives enabled expansions from state and passes modules to rules.
- Tests: new production.hooks tests verifying +1 and negative clamp before floors/majority/distribution; core golden and unit tests remain green.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0016: Move extension injection (boardgame.io)
- @bc/rules: introduced typed move catalog (buildMoveCatalog) and corePoliticalMoves with strict zod payload schemas (AGENTS REPLACEMENT CHARACTER (U+FFFD)4.2). Deterministic type ordering for legal listing (AGENTS REPLACEMENT CHARACTER (U+FFFD)4.1).
- @bc/rules: expansion registry now supports extendMoves via a typed MoveExtensionBuilder (AGENTS REPLACEMENT CHARACTER (U+FFFD)3.8). No expansion state contamination when disabled.
- @bc/game: ExactlyOnePoliticalAction phase now routes a single `doPoliticalAction` move that validates payloads against the catalog and ends the turn after execution (CORE-01-04-09).
- Tests: core-only vs exp01-enabled catalog presence; strict schema failure for illegal payloads.
## 2026-02-11 — Task 0017: SAFE encoding normalization
- Guardrails: added .editorconfig and scripts/check-encoding.mjs (fails on BOM and U+FFFD).
- One-time fixes: removed 41 UTF-8 BOMs; replaced U+FFFD in:
  - docs/changelog.md
  - docs/design-decisions/DD-0016-move-catalog.md
  - docs/tasks/0014_canonical_effect_resolver_pipeline.md
  - docs/tasks/0015_production_hooks_integration.md
  - docs/tasks/0017_safe_encoding_normalization.md
  - packages/rules/src/effects.ts (AGENTS § refs + em dash)
  - packages/rules/src/moves.ts (AGENTS § refs)
  - packages/rules/src/moves.catalog.test.ts (title em dash)
  - packages/rules/src/production.hooks.test.ts (title em dash)
- Verification: scripts/check-encoding.mjs reports OK (no BOM, no U+FFFD).
## 2026-02-11 — Task 0018: Game factory + module bootstrap
- @bc/game: added createBCGame() that builds core state from match config, loads enabled expansion modules (stubs), and runs setupExpansionState for each.
- @bc/game: CoreGame now exported via the factory with CORE-only defaults.
- Tests: CORE-only has no modules/exp slice and only core moves; enabling exp01 registers the module and executes its setup (sentinel asserted).
## 2026-02-11 — Task 0019: Expansion setup ownership
- @bc/rules: removed pre-creation of expansion slices from buildInitialCoreState; modules now own creation (AGENTS 3.8, 5.5).
- @bc/rules: added ensureExpansionSlice(G, expId, initial) helper for modules.
- @bc/game: stub expansion modules now create their slice in setupExpansionState using ensureExpansionSlice and set a sentinel.
- Tests: updated rules tests to reflect module-owned slices; game factory tests assert setup hook only when enabled.
## 2026-02-11 — Task 0020: Resolver enforcement (phase 1)
- @bc/game: added resolver.migration test using a stub expansion move routed through doPoliticalAction; effects go via resolveEffect (AGENTS 3.5).
- Tests demonstrate cost increases apply on normal tiles and are ignored on Start Committee (AGENTS 3.7).
- No behavior change to core production/placement yet; migration focuses on political move path.

## 2026-02-11 — Task 0020: Resolver enforcement (phase 2)
- @bc/rules: expanded EffectDescriptor union: offerTile, placeTile, resolveHotspotAt, applyProductionAt, addNoise, moveInfluenceToTile; kept addResources.
- @bc/game: Draw/Place routed via resolver (onBegin -> offerTile, placeTile move -> placeTile, hotspot resolutions -> resolveHotspotAt).
- @bc/game: Round settlement now iterates board and calls applyProductionAt via resolver; no direct writes.
- @bc/rules: production now planned via planProductionForTile; applyProductionAt issues addResources/addNoise effects (no direct bank/noise writes in caller).
- @bc/rules: hotspot award path issues moveInfluenceToTile via resolver; test migrated to use resolveHotspotAt.
- Determinism & Start Committee immunity preserved in resolver pipeline.
- Dev: added scripts/check-no-direct-mutation.mjs and root script "check:mutation" to gate direct G-writes in @bc/game.- Phase 2 follow-up: hotspot.ts is now pure (no state mutation); hotspot resolution goes exclusively through resolver (resolveHotspotAt). Golden test updated accordingly. Mutation gate tightened (rules allowlist no longer includes hotspot.ts).- Phase 2 follow-up: production planner extracted (production.plan.ts); resolveProductionForTile/resolveRoundSettlement now route through resolver (applyProductionAt). Mutation gate updated to remove production.ts from allowlist.
## 2026-02-11 — Task 0021: Canonical match config plumbing
- CoreState now includes `cfg` with validated `MatchConfig` (expansion flags).
- Added `isExpansionEnabled(cfg, id)` and `assertExpansionStateMatchesConfig(G)` in @bc/rules.
- Game factory stores cfg at setup and runs guard; phases/moves build expansion registries strictly from `G.cfg.expansions` (no state-derived flags).
- Tests: disabled-config ignores ghost slice; enabled-config requires slice (throws when missing). Golden hash updated due to state shape change.## 2026-02-11 — Task 0022: EXP-01 package scaffold (stub only)
- Created @bc/exp-01-economy workspace package with stub ExpansionModule `exp01`.
- Module registers resource ECO and creates its own `G.exp.exp01` slice via `ensureExpansionSlice` when enabled (AGENTS 1.6, 3.4, 3.8, 5.5).
- Added stub political move `exp01_noop` with strict zod payload schema (AGENTS 4.2).
- @bc/game bootstraps modules in `expansions.bootstrap.ts` and imports EXP-01 via alias.
- Vitest and Vite configs updated to alias `@bc/exp-01-economy`.
- Tests: CORE-only has no ECO/slice/move; CORE+EXP-01 shows ECO + slice and the move toggles sentinel; added strict payload validation test.
## 2026-02-11 — Task 0027: Measures engine (EXP-01 baseline)
- @bc/rules: extended EffectDescriptor with initMeasures/takeMeasure/playMeasure/resetMeasuresRound and implemented resolver-only pathways (AGENTS §3.5, §3.7).
- @bc/rules: EXP-01 measures state adds zones DrawPile/Open/Recycle/FinalDiscard, per-player `hands`, `usedThisRound`, and `playCounts`; deterministic recycle?draw reshuffle with `cycle` seed suffix.
- @bc/exp-01-economy: added `exp01_takeMeasure` and `exp01_playMeasure` moves with strict zod payloads + enumerate() functions for bot contract (AGENTS §4.1).
- @bc/game: political action path executes expansion moves; per-round play limit enforced and extra-action grant after play preserved.
- Tests: new exp01.measures.test.ts covering open=3, take?refill, play?recycle?finalDiscard on second play, reshuffle from recycle to draw, and enumerator legality.
