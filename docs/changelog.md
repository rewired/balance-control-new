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
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0017: SAFE encoding normalization
- Guardrails: added .editorconfig and scripts/check-encoding.mjs (fails on BOM and U+FFFD).
- One-time fixes: removed 41 UTF-8 BOMs; replaced U+FFFD in:
  - docs/changelog.md
  - docs/design-decisions/DD-0016-move-catalog.md
  - docs/tasks/0014_canonical_effect_resolver_pipeline.md
  - docs/tasks/0015_production_hooks_integration.md
  - docs/tasks/0017_safe_encoding_normalization.md
  - packages/rules/src/effects.ts (AGENTS REPLACEMENT CHARACTER (U+FFFD) refs + em dash)
  - packages/rules/src/moves.ts (AGENTS REPLACEMENT CHARACTER (U+FFFD) refs)
  - packages/rules/src/moves.catalog.test.ts (title em dash)
  - packages/rules/src/production.hooks.test.ts (title em dash)
- Verification: scripts/check-encoding.mjs reports OK (no BOM, no U+FFFD).
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0018: Game factory + module bootstrap
- @bc/game: added createBCGame() that builds core state from match config, loads enabled expansion modules (stubs), and runs setupExpansionState for each.
- @bc/game: CoreGame now exported via the factory with CORE-only defaults.
- Tests: CORE-only has no modules/exp slice and only core moves; enabling exp01 registers the module and executes its setup (sentinel asserted).
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0019: Expansion setup ownership
- @bc/rules: removed pre-creation of expansion slices from buildInitialCoreState; modules now own creation (AGENTS 3.8, 5.5).
- @bc/rules: added ensureExpansionSlice(G, expId, initial) helper for modules.
- @bc/game: stub expansion modules now create their slice in setupExpansionState using ensureExpansionSlice and set a sentinel.
- Tests: updated rules tests to reflect module-owned slices; game factory tests assert setup hook only when enabled.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0020: Resolver enforcement (phase 1)
- @bc/game: added resolver.migration test using a stub expansion move routed through doPoliticalAction; effects go via resolveEffect (AGENTS 3.5).
- Tests demonstrate cost increases apply on normal tiles and are ignored on Start Committee (AGENTS 3.7).
- No behavior change to core production/placement yet; migration focuses on political move path.

## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0020: Resolver enforcement (phase 2)
- @bc/rules: expanded EffectDescriptor union: offerTile, placeTile, resolveHotspotAt, applyProductionAt, addNoise, moveInfluenceToTile; kept addResources.
- @bc/game: Draw/Place routed via resolver (onBegin -> offerTile, placeTile move -> placeTile, hotspot resolutions -> resolveHotspotAt).
- @bc/game: Round settlement now iterates board and calls applyProductionAt via resolver; no direct writes.
- @bc/rules: production now planned via planProductionForTile; applyProductionAt issues addResources/addNoise effects (no direct bank/noise writes in caller).
- @bc/rules: hotspot award path issues moveInfluenceToTile via resolver; test migrated to use resolveHotspotAt.
- Determinism & Start Committee immunity preserved in resolver pipeline.
- Dev: added scripts/check-no-direct-mutation.mjs and root script "check:mutation" to gate direct G-writes in @bc/game.- Phase 2 follow-up: hotspot.ts is now pure (no state mutation); hotspot resolution goes exclusively through resolver (resolveHotspotAt). Golden test updated accordingly. Mutation gate tightened (rules allowlist no longer includes hotspot.ts).- Phase 2 follow-up: production planner extracted (production.plan.ts); resolveProductionForTile/resolveRoundSettlement now route through resolver (applyProductionAt). Mutation gate updated to remove production.ts from allowlist.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0021: Canonical match config plumbing
- CoreState now includes `cfg` with validated `MatchConfig` (expansion flags).
- Added `isExpansionEnabled(cfg, id)` and `assertExpansionStateMatchesConfig(G)` in @bc/rules.
- Game factory stores cfg at setup and runs guard; phases/moves build expansion registries strictly from `G.cfg.expansions` (no state-derived flags).
- Tests: disabled-config ignores ghost slice; enabled-config requires slice (throws when missing). Golden hash updated due to state shape change.## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0022: EXP-01 package scaffold (stub only)
- Created @bc/exp-01-economy workspace package with stub ExpansionModule `exp01`.
- Module registers resource ECO and creates its own `G.exp.exp01` slice via `ensureExpansionSlice` when enabled (AGENTS 1.6, 3.4, 3.8, 5.5).
- Added stub political move `exp01_noop` with strict zod payload schema (AGENTS 4.2).
- @bc/game bootstraps modules in `expansions.bootstrap.ts` and imports EXP-01 via alias.
- Vitest and Vite configs updated to alias `@bc/exp-01-economy`.
- Tests: CORE-only has no ECO/slice/move; CORE+EXP-01 shows ECO + slice and the move toggles sentinel; added strict payload validation test.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0027: Measures engine (EXP-01 baseline)
- @bc/rules: extended EffectDescriptor with initMeasures/takeMeasure/playMeasure/resetMeasuresRound and implemented resolver-only pathways (AGENTS REPLACEMENT CHARACTER (U+FFFD)3.5, REPLACEMENT CHARACTER (U+FFFD)3.7).
- @bc/rules: EXP-01 measures state adds zones DrawPile/Open/Recycle/FinalDiscard, per-player `hands`, `usedThisRound`, and `playCounts`; deterministic recycle?draw reshuffle with `cycle` seed suffix.
- @bc/exp-01-economy: added `exp01_takeMeasure` and `exp01_playMeasure` moves with strict zod payloads + enumerate() functions for bot contract (AGENTS REPLACEMENT CHARACTER (U+FFFD)4.1).
- @bc/game: political action path executes expansion moves; per-round play limit enforced and extra-action grant after play preserved.
- Tests: new exp01.measures.test.ts covering open=3, take?refill, play?recycle?finalDiscard on second play, reshuffle from recycle to draw, and enumerator legality.
## 2026-02-11 REPLACEMENT CHARACTER (U+FFFD) Task 0028: Local LLM bot (scaffold)
- @bc/bot-llm: added adapter with enumerateLegalIntents, chooseOptionWithLLM (injectable backend), validateChoice; deterministic fallback when backend invalid/unavailable (AGENTS REPLACEMENT CHARACTER (U+FFFD)4.1).
- @bc/shared: added strict JSON schema (LLMChoiceSchema) for `{ "optionId": string }` via zod.
- Tests: unit tests for enumeration validity, invalid-output fallback, and schema; integration test runs a short deterministic match with stubbed backend.
- Note: no model files; backend wiring for node-llama-cpp/ollama to be added in follow-up.
## 2026-02-12 — Task 0029: Repo hygiene + LLM bot runbook + UTF-8 enforcement
- Docs: added docs/llm/local-bot-ollama.md with install, model pull, env vars, and headless runner usage.
- Server: added @bc/server script `bot:run` (env BOT=llm|random, OLLAMA_HOST, OLLAMA_MODEL, N) executing a legal-option picker via @bc/bot-llm.
- Encoding: added root script `check:encoding`; cleaned files (no BOM/U+FFFD); added helper scripts under /scripts for remediation.
- README: aligned pnpm version with packageManager and linked the runbook.
- Tasks: completed 0028 checklist and updated 0029 with evidence.

## 2026-11-07 — Regelkonsistenzprüfung

- CORE, Varianten, 5–6-Spieler-Add-On, alle drei Erweiterungen und informative Notation auf Widersprüche, fehlende Definitionen und unerreichbare Effekte geprüft.
- 26 priorisierte Befunde mit Regelankern, Beispielen, Hierarchiebewertung und nicht freigegebenen Lösungsvorschlägen in `docs/design-decisions/DD-0017-rule-consistency-audit.md` dokumentiert.
- Keine normativen Regeltexte oder Implementierungen geändert; offene Entscheidungen bleiben vor Umsetzung freizugeben.
- CORE-Befunde R01–R07 um konkrete Diskussionsentwürfe, Begründungen, Designfolgen und Beispielabläufe ergänzt; weiterhin keine Freigabe oder normative Regeländerung.

## 2026-11-07 — R01: Lobbyistenbonus freigegeben

- Nutzerentscheidung zu R01 in DD-0017 als angenommen festgehalten; R02–R26 bleiben offen.
- CORE-01-05-04 präzisiert und CORE-01-05-06A sowie -07 bis -09 ergänzt: Bonus für den Controller, keine Boni zwischen Lobbyisten oder auf Start Committee, additive Stapelung, keine Anrechnung auf Influence-Cap oder Wertung.
- ERRATA-0001-lobbyist-bonus.md dokumentiert die genehmigte Regeländerung. Game-Code unverändert; Anpassung an die neue Regelfassung steht separat aus.

## 2026-11-07 — R02: Einheitlicher Grassroots-Tausch freigegeben

- R02 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; CORE-Grassroots und beide 5–6-Spieler-Zusatztiles erhalten einheitlich den Tausch 3 gleiche Ressourcen gegen 1 Ressource eines anderen aktiven Ressorts.
- CORE-01-02-14A, CORE-01-04-22A bis -22E und ADD56-01-01-13A ergänzt; ERRATA-0002-grassroots-conversion.md dokumentiert die genehmigte Regeländerung.
- Aktive Erweiterungsressourcen sind eingeschlossen. Damit ist der fehlende SEC-Erwerbspfad aus R12 normativ geklärt, ohne SEC-Produktion oder Startressourcen einzuführen.
- Bankmodell R04, Aktivierungsrechte R08 und Investment-Program-Einbettung R21 bleiben offen. Game-Code unverändert.

## 2026-11-07 — R03: ContextTile bei Bewegungen freigegeben

- R03 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten und in CORE sowie EXP-02 normativ übernommen; Änderungshistorie in ERRATA-0003-movement-context.md.
- Influence-Platzierung/-Bewegung und direkte Regulation-Platzierung/-Bewegung per Maßnahme verwenden das Ziel-Tile; direkte Entfernung verwendet das bisherige Träger-Tile.
- Authority-Apparatus-Aktivierungen einschließlich eingebetteter Bewegung/Entfernung werden einmal am Apparatus reguliert. Explizite Objektverbote wie Surveillance und zulässige Regulation-Ziele bleiben zusätzlich zu prüfen.
- Blockade an der Quelle allein verhindert das Verlassen nicht, wenn ContextTile anderswo liegt. Aktivierungsrechte, Apparatus-Zeitpunkt und Output-Semantik bleiben gesonderte offene Punkte. Game-Code unverändert.

## 2026-11-07 — R04: Ressourcenstart und Bankmodell freigegeben

- R04 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0004-resource-bank.md.
- CORE-01-03-07/-08 legen null Startressourcen pro Spieler, leeres Noise und bedarfsgerechte Bereitstellung statt vorab erzeugter Bankobjekte fest.
- CORE-01-00-04A bis -04D definieren unbegrenzte Bankverfügbarkeit aktiver Ressorts, atomare Bereitstellung fehlender Objekte und Ausschluss inaktiver Ressorts. Persönliche Kosten bleiben aus der jeweils vorgeschriebenen Quelle zu bezahlen.
- Bankmangel kann keine Auszahlung kürzen oder verhindern; bestehende Effektverbote und Output-Modifikatoren gelten weiter. Game-Code unverändert.

## 2026-11-07 — R05: Letzter Zug und finales Settlement freigegeben

- R05 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0005-final-turn.md.
- CORE-01-07-01A erlaubt eine teilweise gespielte Schlussrunde. CORE-01-09-01 bis -02 einschließlich -01A/-01B/-01C legen den Abschluss fest.
- Erfolgreiche letzte Platzierung schließt Hotspots und vollständige Political-Action-Sequenz ein; erfolgloses Leerziehen ohne Platzierung überspringt die Political Action. Danach genau ein finales Settlement, Wertung und Spielende ohne weitere Züge oder neue Runde.
- Regelmäßiges und finales Settlement am selben Rundenende sind ein Ereignis. Interne Settlement-Reihenfolge und Effektlaufzeiten bleiben R15/R25. Game-Code unverändert.

## 2026-11-07 — R06: Einmalige Hotspot-Auflösung freigegeben

- R06 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0006-hotspot-resolution.md.
- CORE-01-02-09 und CORE-01-06-02A bis -05 präzisieren erstmalige Einschließung, Vorab-Effekte vor Mehrheit, Verbote/Kosten/Output vor atomarer Ausführung sowie Einmaligkeitsvermerk unabhängig von einer Auszahlung.
- Gleichzeitige Einschließungen werden nach aufsteigender stabiler Tile-ID vollständig nacheinander am jeweils aktuellen Zustand aufgelöst.
- EXP-01-08-M01-06 und EXP-02-04-C-04 stellen klar: Budget Compromise und Blockade verbrauchen das Ereignis ohne späteres Nachholen. Reguläre Hotspots verwenden vorhandene Influence aus PersonalSupply; Sonderausgänge bleiben bestehen.
- Kein zusätzliches Maßnahmen-Ausspielfenster eingeführt; R13, R15 und R16 bleiben offen. Game-Code unverändert.

## 2026-11-07 — R07: DrawResolution und endliches Recycling freigegeben

- R07 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0007-draw-and-recycling.md.
- CORE benennt DrawResolution als exklusive Zone des gezogenen Tiles und unterscheidet geometrische Möglichkeit von vollständiger Legalität und Bezahlbarkeit. Erfolgreiche Platzierung und Kosten werden atomar aufgelöst.
- TileRecycling mischt geometrisch unplatzierbare Tiles zurück, prüft jedes physische Tile pro Draw-Phase höchstens einmal und beendet vollständig geometrisch blockierte Stapel über das finale Settlement ohne Political Action.
- Unbezahlbare Tiles werden auch mit Recycling offen verworfen. EXP-03-08-M12-06 verankert diese Regel für Extreme Weather. Eine vorhandene bezahlbare legale Platzierung muss gewählt werden.
- R08 um drei offene Empfehlungen zu Marker-Eigentum, kontrollabhängigen Aktivierungen und Nullgleichständen ergänzt. Game-Code unverändert.

## 2026-11-07 — R08: Eigentum, Aktivierungsrechte und positive Mehrheiten freigegeben

- Alle drei R08-Festlegungen nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0008-ownership-control-production.md.
- CORE-01-04-12 beschränkt gewöhnliche Influence-Bewegung auf eigene Marker. -14A und -21A verlangen Kontrolle des verwendeten Standard Committee beziehungsweise Grassroots.
- CORE-01-05-03B lässt virtuelle Kontrolle ohne reale eigene Marker genügen; CORE-01-08-07A erhält die Start-Committee-Ausnahme samt bisherigen Sonderregeln.
- CORE-01-06-13/-14 und -16 präzisieren: Keine Produktion oder Noise bei höchstem Gesamtwert null; bei positivem Gleichstand teilen nur die Führenden mit Rest nach Noise. Produktionsreihenfolge bleibt erhalten.
- R09 um konkrete offene Vorschläge zu TakeMeasure, Nachfüllen, Recycling, Erschöpfung und Markt-Nachfüllung nach Ausspielen ergänzt. Game-Code unverändert.

## 2026-11-07 — R09: Maßnahmenerwerb und Marktlebenszyklus freigegeben

- R09 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0009-measure-market.md.
- TakeMeasure nimmt genau eine offene Karte in die passende eigene Handzone, beachtet das geltende Handlimit und besitzt keinen Basis-Ressourcenpreis. Erst nach Transfer und Markt-Nachfüllung endet der Zug.
- Drei geordnete Marktplätze werden nach erfolgreichem Nehmen und nach dem Ablagetransfer einer gespielten Karte aufgefüllt. Leeres Deck wird bei benötigtem Nachziehen durch vollständigen Transfer und gesetztes Mischen des Recyclingstapels erneuert; Spielzähler bleiben erhalten, endgültige Ablage bleibt ausgeschlossen.
- Erschöpfte Märkte dürfen weniger als drei Karten enthalten; aus einem leeren Markt kann keine Karte genommen werden. EXP-02/03 referenzieren dasselbe Verfahren in ihren jeweils eigenen Zonen.
- R10 um offene Empfehlungen zu eigenständiger Maßnahmenaktivierung und gemeinsamen Hand-/Rundenlimits ergänzt. Game-Code unverändert.

## 2026-11-07 — R10: Gemeinsames Maßnahmensystem und globale Limits freigegeben

- R10 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0010-shared-measures.md.
- Das gemeinsame System ist bei mindestens einer aktiven Maßnahmenerweiterung verfügbar, auch bei ausschließlich EXP-02 oder EXP-03. Gemeinsame Definitionen aktivieren keine Inhalte eines deaktivierten EXP-01.
- Insgesamt höchstens zwei Handkarten und ein PlayMeasure je Spieler/Runde über alle Decks. Ein gemeinsamer Rundenverbrauch wird erst am folgenden Rundenbeginn nach Settlement zurückgesetzt; Karten-Effektflags bleiben getrennt.
- Genau eine zusätzliche zulässige Nicht-PlayMeasure-Aktion bleibt erhalten. Ohne aktive Maßnahmenerweiterung fehlen gemeinsame Aktionen, Handzonen und Nutzungsflags vollständig.
- R11 um eine offene Setup-Empfehlung zum Ausschluss der vier ECO-abhängigen Klimakarten bei deaktiviertem EXP-01 ergänzt; mögliche ausdrückliche Kostenersetzungen bei der ursprünglichen Problembewertung berücksichtigt. Game-Code unverändert.

## 2026-11-07 — R11: ECO-abhängige Klimakarten beim Setup filtern

- R11 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0011-climate-deck-eligibility.md.
- EXP-03-03-02 bis -02C nehmen Energy Crisis, Technology Initiative, Supply Chain Disruption und Future Committee nur mit aktivem EXP-01 in das Matchmaterial auf.
- Der bestehende Klimakartensatz umfasst damit 15 Karten mit EXP-01 beziehungsweise 11 ohne EXP-01, jeweils mit drei offenen Startkarten. Ausgeschlossene Karten befinden sich in keiner Matchzone.
- Gedruckte Kosten bleiben unverändert; spätere Substitution ändert den Setup-Filter nicht. R13 um offene Vorschläge zu künftigen Auslösern und nächstem Settlement ergänzt. Game-Code unverändert.

## 2026-11-07 — R13: Künftige Maßnahmenauslöser freigegeben

- R13 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0012-measure-trigger-windows.md. R12 folgt bereits aus ERRATA-0002 und benötigt keine eigene Errata.
- Emergency Decree wartet auf die erste Einschließung des beim Ausspielen gewählten Hotspots. Der Karteninhaber bezahlt Regulation-Platzierung erst beim Auslösen; auch ein gescheiterter Versuch verbraucht die registrierte Wirkung.
- Deployment Order wartet auf die nächste erfolgreiche eigene Regulation-Platzierung und bietet einmal die optionale Bewegung genau dieser Regulation. Verzicht oder unmögliche Bewegung verbrauchen die Wirkung, ohne die erfolgreiche Platzierung rückgängig zu machen.
- Investment Freeze betrifft beim nächsten Settlement die dann vom Zielgegner kontrollierten ResortTiles: Maßnahmenmodifikatoren von Druckwert, Verdopplung und Tile-Ausstoß werden ignoriert, Regulation-Modifikatoren bleiben wirksam. Bei Gleichstand keine Wirkung.
- Alle Karten werden weiter regulär ausgespielt; die spätere Wirkung verbraucht kein weiteres PlayMeasure und gewährt keine Zusatzaktion. R14 um eine offene Empfehlung zur Apparatus-Aktivierung und Competence Conflict ergänzt. Game-Code unverändert.

## 2026-11-07 — R14: Authority Apparatus und Competence Conflict freigegeben

- R14 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0013-authority-apparatus.md.
- EXP-02 definiert ActivateAuthorityApparatus als kontrollabhängige Political Action mit Basispreis 0 zum Bewegen oder Entfernen genau einer vorhandenen Regulation auf Board; virtuelle Kontrolle genügt, keine zusätzliche Nachbarschaftsbedingung.
- Die Aktion darf die eine Zusatzaktion nach PlayMeasure sein. R03-ContextTile und ausdrückliche Regulationsrestriktionen gelten weiter; neue Regulationsplatzierung ist kein Teil der Grundaktivierung.
- Competence Conflict bietet nach erfolgreicher eigener Aktivierung einmal eine separat bezahlte Control-Platzierung statt Administration auf dem Apparatus an. Keine rückwirkende Verteuerung oder Rückabwicklung der schon abgeschlossenen Aktivierung.
- R15 um getrennte offene Entwürfe für Kostenmodell (R15a) und Settlement-Reihenfolge (R15b) ergänzt. Game-Code unverändert.

## 2026-11-07 — R15a: Kostenmodell freigegeben, Settlement weiterhin offen

- R15a nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0014-effect-costs.md.
- CORE-01-06-00-07 bis -09 definieren Zahler, Zuschlagsfreiheit automatischer Produktion/normaler Hotspot-Auszahlung und einen Kostenmodifikator-Durchlauf pro Auflösung. Unmittelbare Karten-/Regulationskosten werden kombiniert; spätere Operationen separat geprüft.
- EXP-02 begrenzt State of Exception auf spielerbezahlte Auflösungen, benennt den Mehrheitsgewinner als Zahler der freiwilligen Inner-Order-Operation und bindet deren ContextTile ausdrücklich an Inner Order. Zusatzaktion nach PlayMeasure bleibt eine eigene bezahlte Auflösung.
- R15b Settlement-Reihenfolge ist nicht freigegeben. Neu erkannter Grenzfall ohne legale Political Action bei State of Exception und null Ressourcen als R15c zur separaten Entscheidung dokumentiert; keine Passregel umgesetzt.
- Game-Code unverändert; R16/R17 bleiben offen.

## 2026-11-07 — R15b: Settlement-Reihenfolge freigegeben

- R15b nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0015-settlement-sequence.md.
- CORE-01-07-03 bis -06 ordnen registrierte Einmaloperationen vor Produktion, vollständige Resort-Produktion nach stabilen Tile-IDs und ausdrücklich nachgelagerte Effekte vor Settlement-Ende. Reihenfolge registrierter Operationen folgt Spielereignissen, nicht Systemzeit.
- EXP-02-04-C-02 bindet SecurityLevel an den Output-Modifikator-Schritt vor Mehrheit/Verteilung. De-escalation und Loss of Control sind ausdrücklich dem Vorproduktionsschritt zugeordnet.
- Neue-Runde-Flags werden erst beim tatsächlichen Rundenbeginn nach Settlement zurückgesetzt; final folgt stattdessen Wertung. Keine neuen Ausspielfenster oder Änderungen von Effektdauern.
- R15c bleibt offen. Empfehlung zur erzwungenen Auslassung unbesetzbarer Pflicht-Aktionsslots konkretisiert, einschließlich gesonderter Budget-Deficit-Verbrauchsausnahme gegen dauerhafte Aktionssperren. Keine Passregel umgesetzt; Game-Code unverändert.

## 2026-11-08 — R15c: Pflicht-Aktionsslot ohne legale Option freigegeben

- R15c nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0016-no-legal-action.md. R15a/R15b/R15c sind damit vollständig angenommen.
- CORE-01-04-09 bis -09C prüfen alle im jeweiligen Slot zulässigen Optionen einschließlich Kostenersetzungen, Transfers und Start-Committee-Immunität. Ohne legale Option zwingender Abschluss ohne Aktion oder Zahlung; bei legaler Option kein freiwilliges Passen.
- Die Ausnahme gilt auch für die Nicht-PlayMeasure-Zusatzaktion nach einer Maßnahme. Vorherige Ergebnisse, Zahlungen und PlayMeasure-Nutzung bleiben bestehen.
- Budget Deficit wird dabei ausdrücklich wie nach einem gescheiterten Versuch verbraucht; der abgeschlossene Slot wird nicht wieder geöffnet. Andere Effekte benötigen ihren tatsächlichen Auslöser; Intergenerational Pact ohne Kostentransfer bleibt ungenutzt.
- R16 um einen noch offenen Vorschlag für reduzierbare Ressourcen-/Influence-Ausgaben, ausgenommene Vorgänge und bezahlte Nulloutput-Aktionen ergänzt. Game-Code unverändert.

## 2026-11-08 — R16: SecurityLevel-Ausgaben und bezahlter Nulloutput freigegeben

- R16 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0017-securitylevel-output.md.
- EXP-02-02-B-02/-02A/-02B begrenzen SecurityLevel auf Ressourcenproduktion, Konvertierungsausgaben, direkte Ressourcengewinne, neue Influence durch Formalisierung und normale Hotspot-Influence-Auszahlungen einschließlich Labor Market.
- Gewöhnliches PlaceOrMoveInfluence, Regulationsoperationen, Karten-/Tile-Abläufe, Mehrheit/virtuelle Influence, Zahlungen und nichtnumerische Modifikatoren sind ausgenommen. ContextTile, additive Reduktion, Floor 0 und Start-Committee-Immunität bleiben maßgeblich.
- EXP-02-04-B-05 bis -07 definieren sonst legale, bezahlbare Nulloutput-Aktionen als erfolgreich und voll zu bezahlen. Sie verhindern automatisches Auslassen nach R15c. Hotspots bleiben auch bei Output 0 einmalig verarbeitet.
- R17 in offene Teilentscheidungen zu Kartenobjekten/Effektinstanzen (R17a) sowie Reihenfolge und atomarem Zahlungs-/Verbrauchsverhalten (R17b) geteilt; R17a als nächster Vorschlag konkretisiert. Game-Code unverändert.

## 2026-11-08 — R17a: Kartenobjekt und aktive Effektinstanz getrennt

- R17a nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0018-active-effect-instances.md.
- EXP-01-06-05D und EXP-01-07-08 bis -13 definieren pro erfolgreicher Ausspielung mit fortdauernder/zukünftiger Wirkung eine unabhängige, deterministisch identifizierte Instanz mit ursprünglichem Inhaber, gebundenen Zielen, Dauer/Auslöser und eigenen Nutzungsflags.
- Nach unmittelbarer Auflösung und Registrierung folgen Kartenumlauf, Marktauffüllung und Zusatzaktion. Recycling, neuer Karteninhaber, erneute Ausspielung oder FinalDiscard verändern bestehende Wirkungen nicht; deren Ablauf bewegt die Karte nicht.
- EXP-02/EXP-03 importieren das gemeinsame Verfahren unabhängig von EXP-01. Nutzungsflags sind auf aktive Effektinstanzen bezogen; bestehende Mehrfachinstanz-, Stapel-, Verbrauchs- und Timingregeln bleiben erhalten.
- Nur ausdrücklich erlaubte spätere Entscheidungen werden am vorgesehenen Auslöser getroffen und für Replay erfasst. Keine neue Handkarten-Spielgelegenheit oder zusätzliche Political Action.
- R17b bleibt offen und ist als Vorschlag zu Reihenfolge, vollständigem Zahlungsplan, atomarer Zahlung/Nutzung und ausdrücklichen Fehlschlagsausnahmen konkretisiert. Game-Code unverändert.

## 2026-11-08 — R17b: Reihenfolge und atomare Zahlung/Nutzung freigegeben

- R17b nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0019-effect-order-and-payment.md. R17a/R17b sind damit angenommen.
- CORE-01-06-00-10 bis -12 definieren vollständigen Zahlungsplan, keine doppelte Ressourcennutzung, höchstens eine Übertragung je zusätzlichem Kostenbestandteil und gemeinsamen erfolgreichen Abschluss von Zahlung, Hauptwirkung, Effektregistrierung und zugehörigem Verbrauch/Nutzungsflag.
- Fehlschläge erzeugen weder Teilzahlungen noch lediglich geplante Nutzungen von Economic Council oder Intergenerational Pact. Ausdrückliche Verbrauchsausnahmen, erfolgreiche Vorgänger, R15c und bezahlter Nulloutput bleiben erhalten; anfänglich illegale Eingaben sind keine Aktionsversuche.
- EXP-01-07-14/-15 ordnen ausgelöste Operationen innerhalb ihrer bestehenden Fenster nach Registrierung/Instanz-ID und definieren erfolgreiche/gescheiterte PlayMeasure-Buchung. EXP-02/EXP-03 importieren das Verfahren; Council und Pact erhalten genaue Zahlungs-/Verbrauchsanker.
- R18 als noch offener Vorschlag zur Reservierung der inaktiven Countdown-Mechanik, Ausschluss von M14/M15 und daraus folgenden EXP-03-Deckgrößen 13 mit EXP-01 bzw. 10 ohne EXP-01 konkretisiert. Game-Code unverändert.

## 2026-11-08 — R18: Countdown reserviert, M14/M15 ausgeschlossen

- R18 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0020-countdown-reserved.md.
- EXP-03-00-08, EXP-03-02-C-00/-01 und EXP-03-03-07 reservieren Countdown als inaktiv. Keine Marker, Vorräte, Zähler, Countdown-Anhänge oder leeren Platzhalter werden angelegt; bestehende Beschreibungen autorisieren keine Aktion oder Wirkung.
- Transformation Blockade (M14) und Future Committee (M15) sind unabhängig von EXP-01 vom Matchmaterial ausgeschlossen. Zusammen mit dem R11-ECO-Filter verbleiben 13 Klimamaßnahmen mit EXP-01 bzw. 10 ohne EXP-01; drei offene Marktplätze unverändert. ERRATA-0011 kennzeichnet seine älteren Zahlen 15/11 als fortgeschrieben.
- Transformationsdruck bleibt genau ein gewöhnlicher CORE-Hotspot mit normaler Influence-Auszahlung, ohne Ressourcenproduktion oder Countdown-Wirkung. Reservierte Definitionen bleiben erhalten; Aktivierung erfordert eine eigene Regelrevision.
- R19 als offener Vorschlag konkretisiert: Empfangslimit nach regulärer Anteilsberechnung, Kürzungen verbleiben in Bank, Noise erhält nur den ursprünglichen Teilungsrest. Game-Code unverändert.

## 2026-11-08 — R19: Empfangslimit nach Anteilsberechnung freigegeben

- R19 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0021-production-receipt-limit.md.
- CORE-01-06-16(c)/-16A trennen reguläre Anteilsberechnung von endgültiger Auszahlung. Ausdrückliche Empfängerlimits werden erst nach Output, Mehrheit und ursprünglichem Teilungsrest angewendet, ohne vorläufige Auszahlung und Rücknahme.
- EXP-03-08-M11-05 bis -09 begrenzen den Zielspieler je ResortTile-Produktion auf min(regulärer Anteil, 1), einschließlich finalem Settlement. Andere Spieleranteile und ursprünglicher Noise-Rest bleiben erhalten; die Kürzung wird nicht aus Bank ausgegeben und nicht allein dafür materialisiert.
- Nullanteile bleiben 0; mehrere gleiche Limits behalten Obergrenze 1. Investment Freeze ignoriert dieses Empfängerlimit nicht. Gedruckte Kosten, Ziel und Dauer bleiben erhalten; R11-ECO-Filter bleibt maßgeblich.
- R20 als offener Vorschlag zu genau einem Labor Market und Investment Program im DrawPile sowie zusätzlichen CLM-W1/W2 je einmal für 5–6 Spieler konkretisiert. Game-Code unverändert.

## 2026-11-08 — R20: Komponenten und CLM-Zusatzwerte freigegeben

- R20 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0022-component-setup.md.
- EXP-01-02-C-08, EXP-01-02-D-01 und EXP-01-03-01/-07 bestimmen Labor Market und Investment Program jeweils einmal im Tile-DrawPile für beide Spielerzahlbereiche. Komponentenbeschreibung und Setup benennen dieselben Exemplare.
- Vorhandene ECO-Mengen bleiben erhalten: EXP-01 ergänzt einschließlich Sondertiles sechs Tiles für 2–4 bzw. neun für 5–6 Spieler. Measures bleiben in separaten Zonen, deaktiviertes EXP-01 liefert keine Tiles.
- EXP-03-02-A-02/-02A legen für 5–6 zusätzlich CLM-W1 und CLM-W2 je einmal fest; insgesamt W1/W2 jeweils zweimal für 2–4 bzw. dreimal für 5–6. Transformationsdruck bleibt separat einmal, Countdown weiterhin reserviert.
- R21 als offener Vorschlag konkretisiert: kontrolliertes Investment Program erlaubt an einem kontrollierten Grassroots alternativ 2 ECO gegen 1 anderes aktives Ressort, ein Tausch pro Aktion und ContextTile ausschließlich Grassroots. Lokale Modifikatoren des Investment Program werden dafür nicht zusätzlich ausgewertet. Keine normative Aktionsänderung; Game-Code unverändert.

## 2026-11-08 — R21: Investment Program in Grassroots-Konvertierung eingebunden

- R21 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0023-investment-program-conversion.md.
- EXP-01-05-01 bis -08 verlangen Kontrolle von Investment Program und gewähltem Grassroots, erlauben virtuelle Kontrolle ohne Nachbarschaft und bieten alternativ zum normalen 3:1-Tausch genau 2 ECO gegen 1 Ressource eines anderen aktiven Ressorts.
- Pro Aktion bleibt es bei einem Tausch; keine zusätzliche Aktivierung, Aktion, Wiederholung oder Verkettung. Die zwei ECO ersetzen nur die Basiszahlung, anwendbare Aufschläge bleiben zusätzlich; Zahlung und Output laufen atomar über Bank.
- ContextTile ist ausschließlich Grassroots. Lokale Modifikatoren von Investment Program wirken nicht zusätzlich; dessen Blockade allein deaktiviert den passiven Zugang nicht. Blockade/Output-Modifikatoren am Grassroots gelten regulär einschließlich bezahltem Nulloutput nach R16.
- R22 als offener Vorschlag konkretisiert: vor Zahlung einen Ressourcen-Aufschlag durch feste Zahlung 1 beliebige aktive Ressource ersetzen, ohne Rückerstattung und ohne weitere Ersetzung/Übertragung dieser Ersatzzahlung. Supplemental-Budget-Kartentext noch unverändert; Game-Code unverändert.

## 2026-11-08 — R22: Supplemental Budget vor Zahlung freigegeben

- R22 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0024-supplemental-budget-payment.md.
- EXP-01-08-M10-04 bis -08 erlauben nach erfolgreichem Ausspielen für eine spätere eigene Political Action dieses Zuges die Vorabersetzung genau einer zusätzlichen Ressourcen-Einheit aus Measure oder kostensteigernder Regulation durch feste Zahlung 1 beliebige aktive Ressource.
- Endkosten sind Grundkosten plus übrige Aufschläge plus Ersatzzahlung. Kein rückwirkender Erlass, keine Erstattung, keine Aufhebung von Verboten/Mindestanforderungen oder Grundkosten. Kartenpreis 1 ECO bleibt beim Ausspielen bezahlt.
- Die Ersatzzahlung ist Teil desselben atomaren Plans, löst keine neue Besteuerung aus und wird weder erneut ersetzt/erlassen noch mit Intergenerational Pact übertragen; auch der gestrichene Bestandteil ist nicht übertragbar. R17b-Fehlschlagsausnahmen bleiben erhalten.
- Overlay an dieser Kartenstelle ausdrücklich durch Regulation ersetzt; EXP-03-Stelle und Timing bleiben R25. R23 als offener Vorschlag zu Influence-Gewinnen, gewöhnlicher Bewegung/Platzierung, Greenwashing-Ersatzpreis und fortbestehenden Verboten konkretisiert. Game-Code unverändert.

## 2026-11-08 — R23: Influence-Unterdrückung und Greenwashing-Ersatzgebühr freigegeben

- R23 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0025-influence-suppression.md.
- EXP-03-06-06 bis -08 und M05/M07 ordnen Greenwashing der Formalisierung und normalen Hotspot-Influence-Auszahlung zu; Protest Movement betrifft nur diese Hotspot-Auszahlung. Beide gelten global; gewöhnliches PlaceOrMoveInfluence, Mehrheit, virtuelle Influence, Ressourcen und Inner-Order-Regulationsausgänge bleiben unberührt.
- Greenwashing erlaubt dem Empfänger pro Gewinnauflösung genau einmal 1 CLM oder 1 INF als feste Ersatzgebühr, unabhängig von Markerzahl und mehreren gleichen Instanzen. Zahlung atomar mit erlaubtem Ausgang, keine weitere Ersetzung/Übertragung oder eigene Besteuerung.
- Andere Verbote/Voraussetzungen bleiben maßgeblich; keine Greenwashing-Gebühr bei fortbestehendem Protest Movement, Blockade oder anderen Hindernissen. Output-Modifikatoren gelten weiterhin, Start Committee bleibt immun. Unterdrückte Hotspots werden einmalig ohne spätere Auszahlung verarbeitet.
- R24 in offene Teilentscheidungen zur statischen Klima-/Kostenherkunft (R24a) sowie Schutzumfang und Reihenfolge bei Kostenübertragung (R24b) geteilt. Schutzkarten und Klassifikationsdefinition noch unverändert; Game-Code unverändert.

## 2026-11-08 — R24a: feste Klima-/Kostenherkunft freigegeben

- R24a nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0026-climate-cost-classification.md.
- EXP-03-02-D-01 bis -06 klassifizieren Klimaeffekte statisch nach EXP-03-Maßnahmenquelle, gedruckter verpflichtender CLM-Basiskost oder ausdrücklicher normativer Kennzeichnung. Zahlungswahl, Ersetzung oder CLM-ContextTile machen fremde Kosten/Aktionen nicht zu Klimaeffekten.
- Jeder Kostenbestandteil behält Ursache und Art: Grundkosten, zusätzlicher Aufschlag oder feste Ersatzzahlung. Übertragung ändert diese Herkunft nicht; Supplemental Budget erzeugt anstelle des entfallenen Aufschlags eine neue feste EXP-01-Zahlung.
- Die drei Schutzkarten entfernen innerhalb ihres Schutzumfangs nur zusätzliche Ressourcen-Aufschläge mit Klimaquelle. Kartenpreise, Grundkosten, feste Gebühren, Verbote und nichtklimatische Kosten bleiben; Befreiungen löschen keine Effektinstanzen und erzeugen keine rekursive Kostenauflösung.
- R24b als offener Vorschlag zum globalen/persönlichen Schutzumfang, Technology-Initiative-Zusatzaktion und Befreiung vor Ersetzung/Übertragung konkretisiert. Schutzkarten noch unverändert; Game-Code unverändert.

## 2026-11-08 — R24b: Klima-Schutzumfang und Reihenfolge freigegeben

- R24b nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0027-climate-protection-scope.md. R24a/R24b sind damit angenommen.
- Adaptation Strategy schützt alle Spieler einschließlich kostenpflichtiger Tile-Platzierungen und separater späterer Operationen. Technology Initiative schützt genau die anschließende eigene zulässige Nicht-PlayMeasure-Zusatzaktion; bei Auslassung keine Nachholung und kein neues Handkartenfenster.
- Future Pact schützt Kostenbestandteile mit dem Inhaber als ursprünglichem regelbestimmtem Zahler, auch bei eigenen späteren Operationen während fremder Züge. Persönlichen Schutz vor Übertragung prüfen; beim neuen Zahler keine erneute Befreiungsprüfung.
- EXP-03-02-D-07/-08 ordnen Klima-Befreiung vor Supplemental Budget vor Intergenerational Pact, anschließend vollständige legale Zahlung atomar. Nur verbleibende positive Aufschläge sind übertragbar; ohne tatsächliche Übertragung kein Pact-Verbrauch. Feste Gebühren bleiben ausgeschlossen.
- Gedruckte Preise und Dauern bleiben erhalten. R25a als offener Vorschlag zur gemeinsamen Spieluhr einschließlich Settlement für This round konkretisiert; R25b Produktionswortlaut/Overlay folgt separat. Keine normative Zeitänderung; Game-Code unverändert.

## 2026-11-08 — R25a: gemeinsame Spieluhr und Settlement einschließende Runde freigegeben

- R25a nach ausdrücklicher Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0028-shared-game-clock.md.
- CORE-01-07-01/-06 und -07 bis -18 definieren gemeinsame ereignisbasierte Zeitgrenzen. This turn umfasst die vollständige Aktions-/Folgeauflösungssequenz vor Settlement; This round umfasst ausdrücklich das aktuelle vollständige Settlement und endet danach.
- Immediate, Settlement-Dauern, Next round, Until end of next round, nächster eigener/Zielspielerzug und Until consumed sind eindeutig gebunden. Keine rückwirkende Registrierung, keine simulierten Folgerunden nach Spielende, keine neuen Ausspielrechte.
- An Zuggrenzen erst fällige Wirkungen beenden, dann zugehörige Wirkungen aktivieren. Nach Settlement erst Wirkungen beenden, nur bei tatsächlich neuer Runde Flags zurücksetzen/Next-round-Fenster aktivieren. Abgeschlossene Objektplatzierungen werden durch Ablauf nicht zurückgenommen.
- Alle Erweiterungen verweisen auf dieselbe Spieluhr; unvollständige lokale Listen ersetzt. Bestehende doppelte/falsche Anker bleiben zur separaten R26-Bereinigung erhalten. Countdown bleibt reserviert.
- R25b als offener Vorschlag zur vollständigen kanonischen Produktion konkretisiert: Verdopplungen, gemeinsame additive Output-Modifikatoren, einmaliger Floor 0, danach Mehrheit/Anteile/Empfängerlimits; verbleibendes Overlay soll Regulation heißen. Produktionswortlaut noch unverändert; Game-Code unverändert.

## 2026-11-08 — R25b: vollständige kanonische Produktion freigegeben

- R25b nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0029-canonical-production-wording.md. R25a/R25b sind damit angenommen.
- CORE-01-06-16-00 und (a)(2) bis (4) sammeln zulässige Modifikatoren, wenden erlaubte Verdopplungen an und verrechnen sämtliche additiven Output-Modifikatoren gemeinsam vor einem einzigen Floor 0. Keine neue Stapelberechtigung oder Zwischen-Untergrenze je Quelle.
- EXP-01-Reduktionen und SecurityLevel sind ausdrücklich eingeschlossen. Blockade vor Produktion prüfen; Kosten-Regulations sind keine Output-Abzüge und automatische Produktion bleibt gemäß R15a gebührenfrei. Unmittelbare Ressourcengewinne sind keine Resort-Produktion.
- Mehrheit, reguläre Anteile, ursprünglicher Noise-Rest und anschließende Empfängerlimits/finale Transfers bleiben kanonisch. Investment Freeze behält seinen Quellenfilter; Supply Chain Disruption bleibt Empfängerlimit.
- EXP-01-04-B-03, EXP-03-05-03/-04 und EXP-03-10-04 auf denselben Ablauf abgestimmt; Overlay aus dem normativen Produktionswortlaut entfernt und durch Regulation präzisiert.
- R26 als offener redaktioneller Vorschlag konkretisiert: zweites EXP-01-07-07 zu -07A, falsches EXP-01-07-03 im Klimadokument zu EXP-03-07-03, Bearbeitungsrest entfernen und Dokumentverweise prüfen. Gültiger bestehender Code-Verweis bleibt erhalten; Game-Code unverändert.

## 2026-11-08 — R26: Regelanker bereinigt, Regelprüfung abgeschlossen

- R26 nach Nutzerbestätigung in DD-0017 als angenommen festgehalten; Änderungshistorie in ERRATA-0030-rule-anchor-cleanup.md.
- EXP-01-07-07 bleibt Nutzungsflag-Regel; nur der zweite Absatz erhält EXP-01-07-07A. Der Klimaflag-Absatz heißt jetzt EXP-03-07-03; die echte EXP-01-07-03-FinalDiscard-Regel bleibt erhalten.
- Fünfzeiligen Bearbeitungsrest vor EXP-03-08 samt überflüssigem Trenner entfernt. Task 0027 auf Flag-Reset nur beim tatsächlichen neuen Rundenbeginn abgestimmt; seine älteren Testergebnisse als historisch markiert. Gültiger Code-Verweis bleibt unverändert.
- Abschlussprüfung der vier normativen Spezifikationen: 801 eindeutige Regel-/Abschnittsanker, keine doppelten Definitionen, alle ausgeschriebenen vollständigen Abschnittsverweise auflösbar. Kein normativer Overlay-Begriff oder Bearbeitungsrest mehr vorhanden.
- Alle 26 Befunde sind entschieden: R01–R11 und R13–R26 über ERRATA-0001 bis -0030 normativ übernommen, R12 durch R02 geklärt. DD-0017 auf Accepted gesetzt; keine offene Regelentscheidung aus diesem Audit.
- Game-Code unverändert. Softwareabgleich, Implementierung und Validierung gegen die konsolidierten Regeln stehen aus; frühere Tests/Lint-Ergebnisse bleiben historische Bestandsprüfung.

## 2026-11-08 — Softwareabgleich mit konsolidierten Regeln

- Regelkonsolidierung als Commit `3d6f289` nach `origin/main` gesichert; Softwareabgleich auf `codex/rules-software-audit` in DD-0018 abgeschlossen dokumentiert.
- 20 priorisierte Softwarebefunde mit Normankern, Codebelegen, Reproduktionsrezepten und Zuordnung aller R01–R26 erfasst. Schwerpunkte: echte Engine-Integration, fehlende CORE-Aktionen/Spielabschluss, Mehrheit/Produktion, Ressourcenbank, Maßnahmenmodell, Erweiterungsstubs und Bot-Legalität.
- 19 gezielte Laufzeit-Sollprüfungen bestätigen Abweichungen. Separate Material-/Ressourcenprüfung aller acht Konfigurationen: CORE besteht diese Setup-Teilprüfung, sieben Erweiterungskombinationen scheitern. Das ersetzt keinen vollständigen Interaktions- oder Konformitätsnachweis.
- Vorhandener Code: 65 Tests in 30 Dateien bestanden. Lint scheitert an drei bestehenden `any`-Fehlern im Server-Bot-Runner; Encoding-Check meldet fünf bereits zuvor betroffene Dateien. Mutation-Check besteht mit den in DD-0018 beschriebenen Abdeckungsgrenzen. Prüfungen unter Node 24.18.0 außerhalb des deklarierten Bereichs; vorgesehene Node-Version bleibt nachzuweisen.
- Task 0030 enthält die gestufte Umsetzung mit dauerhaften Regressionstests, echten Engine-Replays und allen acht erforderlichen Erweiterungs-Interaktionssuiten. DD-0017 verweist auf den abgeschlossenen Abgleich; Implementierung und Konformitätsnachweis bleiben offen.
- Produktivcode und normative Regeln unverändert; temporäre Diagnosetests nach Ausführung entfernt.

## 2026-11-08 — Task 0030: Engine-Setup und Zugablauf

- boardgame.io erhält zwei bis vier Spieler aus seinem Setup-Kontext. Die Factory liest die validierten Match-Optionen und `matchSeed` aus dem zweiten Setup-Argument. Der Headless-Runner verwendet denselben Zustandsinitialisierer.
- Ziehen, Platzierung, politische Aktion und ein gewährter Zusatzslot laufen als Stages desselben Engine-Turns. Abgelehnte Platzierungen und politische Eingaben behalten ihren Slot. Settlement läuft einmal nach dem letzten vollständigen Zug der Runde. Die EXP-01-Nutzung wird bei Beginn der Folgerunde zurückgesetzt.
- `InitializeGame`, `createMatch` und der echte `Client` prüfen Setup, Seed, Phasen und Zusatzaktion. Zwei Wiederholungen von zwei vollständigen Runden liefern dieselben Zustandshashes nach jedem Zug.
- `pnpm test` besteht mit 70 Tests, davon 28 im Game-Paket. Workspace-Lint und Mutation-Check bestehen. TypeScript-Prüfung der Engine und ihrer Projektabhängigkeiten besteht mit explizit eingebundenen vorhandenen Node-Typen. Standard-Build meldet die bestehende Typauflösung für `node:crypto` in `shared`. Laufzeitprüfungen unter Node 24.18.0.
- Architektur und Prüfgrenzen in DD-0019, Fortschritt in Task 0030 und DD-0018 dokumentiert.

## 2026-11-08 — Task 0030: Banktransfers und Zug-Hashes

- Setup und Resolver verwenden dieselbe Registry für aktive Ressorts. Bank, Noise und PersonalSupply werden je Auflösung gemeinsam gebucht. Zahlungen gehen in Bank. Auszahlungen verbrauchen Bestand und erzeugen fehlende aktive Einheiten bedarfsgerecht.
- Die Produktion eines ResortTiles überträgt alle geplanten Anteile und den Noise-Rest in einer Transaktion. Die internen Transfers erhalten keinen erneuten Kostenpass.
- SHA-256 nutzt kanonisch sortiertes JSON nach den Speicherregeln. Der Game-Layer speichert `lastTurnHash` nach jedem regulären Zug. Die Hashfunktion ist auch im Webclient verfügbar.
- T05/T06/T19 sind dauerhaft abgedeckt. Die 79 Workspace-Tests, Workspace-Lint, Mutation-Check, Game-TypeScript-Build und Webclient-Build bestehen unter Node 24.18.0. Die beiden Hash-Abhängigkeiten sind offline aus dem vorhandenen Lockfile verknüpft.
- Architektur und Nachweise in DD-0020, Fortschritt in Task 0030 und DD-0018 dokumentiert.

## 2026-11-08 — Task 0030: DrawResolution, Topologie und Match-Optionen

- DrawResolution hält höchstens ein Tile. Der Resolver prüft Geometrie, Prohibitions und Zahlung mit demselben Plan für Angebot und Platzierung. Tile und Zahlung werden zusammen übertragen. TileRecycling überspringt bereits versuchte IDs und verwirft unbezahlbare Tiles mit vorhandener Geometrie.
- Hex und orthogonale Adjazenz sind über die Match-Konfiguration gebunden. Die gewählte Topologie steuert Platzierungskoordinaten, Hotspot-Einschließung und die Nachbarschaft der Mehrheits- und Produktionsberechnung.
- FirstPlayerHandicap und TileRecycling sind separat schaltbar. `addOn56` validiert die Spielerzahl und ergänzt das CORE-Material und die Startmarker für fünf und sechs Spieler. Bei erschöpfter Ziehphase und nach dem vollständigen letzten Zug läuft genau ein finales Settlement.
- Setup und Ziehen über die echte Engine geprüft. Der Golden-Replay verwendet zehn feste Engine-Züge. 91 Tests, Workspace-Lint, Mutation-Check, Game-TypeScript-Build und Webclient-Build bestehen unter Node 24.18.0.
- Konfigurationsbeispiel, Architektur und Prüfgrenzen stehen in DD-0021. Task 0030 führt Cap 8 bei Influence-Erzeugung und Erweiterungsmaterial als weitere Arbeit.

## 2026-11-08 — Task 0030: Kanonische Mehrheit und Kontrollrechte

- Kontrolle, Hotspots und Produktion verwenden dieselbe Mehrheitsberechnung. Sie liefert den Controller, positive Führende und die Einflusswerte pro Spieler.
- Ein kontrollierter Lobbyist gibt den Bonus ausschließlich seinem Controller. Boni addieren sich und können Kontrolle auf leeren Committees und Grassroots begründen. Lobbyisten und Start Committee erhalten keine Boni. Ein Gleichstand auf dem Lobbyisten erzeugt keinen Bonus.
- Produktion verteilt nur an positive Führende. Bei Nullmehrheit bleiben PersonalSupply, Bank und Noise unverändert. Der Golden-Replay prüft den korrigierten Noise-Bestand und den neuen Hash.
- T01/T02/T03 sind dauerhaft abgedeckt. 93 Workspace-Tests, Lint, Mutation-Check und Game-TypeScript-Build bestehen unter Node 24.18.0. Die Umsetzung steht in DD-0022 und Task 0030.


## 2026-11-08 — Task 0030 — Politische CORE-Aktionen

- PlaceOrMoveInfluence platziert oder bewegt genau einen eigenen Marker. ID und Eigentümer bleiben beim Zonenwechsel erhalten. Der automatische Hotspot-Transfer erhält ebenfalls die Marker-ID.
- Committee-Formalisierung prüft Kontrolle, Startmarker-Timing, Ressortkosten und das Cap von 7 beziehungsweise 8 Markern. Das Start Committee wendet seine Immunität und sein Nutzungslimit pro Spieler an.
- Grassroots tauscht atomar drei Einheiten eines aktiven Ressorts gegen eine Einheit eines anderen aktiven Ressorts. Die Engine schließt Pflichtslots ohne legale Option automatisch ab. Der Hotseat-Client zeigt die verfügbaren Aktionen aus demselben Katalog.
- 103 Workspace-Tests, darunter zehn neue boardgame.io-Tests, Lint, Mutation-Check, Game-TypeScript-Build und Webclient-Build bestehen unter Node 22.22.2. Task 0030 und DD-0023 dokumentieren den Umfang.

## 2026-11-08 — Task 0030 — Einmalige Hotspot-Einschließung

- Jeder vollständig eingeschlossene Hotspot erhält nach dem ersten Ereignis einen Vermerk am Board-Eintrag. Er bleibt auch bei Gleichstand, Verbot, leerem PersonalSupply oder null Output erhalten.
- Gleichzeitige Einschließungen werden vor der politischen Aktion nach ordinaler Tile-ID verarbeitet. Jeder Hotspot verwendet den Zustand nach dem vorangegangenen Ereignis.
- T04 prüft die Verarbeitung über boardgame.io einschließlich erneutem Aufruf nach einem JSON-Roundtrip und beider Tile-ID-Reihenfolgen für den letzten gemeinsamen Influence-Marker.
- 111 Workspace-Tests, darunter acht neue Engine-Fälle, Lint, Mutation-Check, Game-TypeScript-Build und Webclient-Build bestehen unter Node 22.22.2. Die Umsetzung steht in DD-0024 und Task 0030.

## 2026-11-08 — Task 0030 — Engine-Endspielreplays

- Ein vollständiger CORE-Replay verarbeitet alle 71 Tiles. Er prüft geteilten Sieg, einmalige Produktion samt Noise in der verkürzten Schlussrunde und deterministische Checkpoints für jeden Zug.
- Zwei kürzere Replays prüfen das reguläre Rundenende nach Hotspot, Measure und Zusatzaktion sowie das Ende nach unbezahlbaren Ziehversuchen. Der Endzustand bleibt bei weiteren Move-Eingaben stabil.
- Alle drei Replays laufen zweimal mit festen Seeds und Aktionen. Sie prüfen die Gewinner, den erwarteten Produktionszuwachs und feste Endhashes, die auch aus dem serialisierten Zustand reproduzierbar sind.
- 114 Workspace-Tests, Lint, Mutation-Check und Game-TypeScript-Build bestehen unter Node 22.22.2.

## 2026-11-08 — Task 0030 — Kanonische Produktionsrechnung

- Resort-Produktion prüft Verbote am produzierenden Tile. Typisierte Modifikatoren verdoppeln den Druckwert und liefern additive Deltas. Die Rechnung summiert alle aktiven Deltas und wendet den Minimum-0-Floor einmal vor Mehrheit, Anteilen und Noise an.
- T07 prüft über boardgame.io, dass ein kontrolliertes DOM-W3 trotz aktivem synthetischem Kostenzuschlag und leerer PersonalSupply 3 DOM produziert. Weitere Engine-Fälle prüfen Verbot, Verdopplung, Modifikatorstapel, deaktivierte Quellen und Noise-Rest.
- 118 Workspace-Tests, Lint, Mutation-Check, Game-TypeScript-Build und Webclient-Build bestehen unter Node 22.22.2. DD-0025 und Task 0030 dokumentieren die Umsetzung.

## 2026-11-08 — Task 0030 — Investment Freeze und Supply Chain Disruption

- Investment Freeze filtert die Measure-Modifikatoren eines ResortTiles, wenn das Ziel es zum Produktionszeitpunkt kontrolliert. Regulationen und sonstige Quellen bleiben wirksam.
- Supply Chain Disruption begrenzt die endgültige Auszahlung je ResortTile und betroffenen Empfänger auf höchstens eins. Andere Spieler und Noise erhalten ihre regulären Beträge. Die Kürzung bleibt ungebucht.
- Der Resolver speichert die registrierten Produktionswirkungen unabhängig von Kartenzonen und verarbeitet ihren Ablauf am Settlement- oder Zugbeginn. Die Engine-Tests verwenden einen Test-Move für die Registrierung. Reguläres Kartenspiel folgt mit den Erweiterungen.
- 122 Workspace-Tests, Lint, Mutation-Check, TypeScript- und Webclient-Build bestehen unter Node 22.22.2.

## 2026-11-08 — Task 0030 — Gemeinsamer Maßnahmenmarkt

- Jedes aktive Deck hat eigene Karten- und Handzonen, drei feste Marktslots und einen eigenen deterministischen Recycle-Zyklus. Take und Play füllen den betroffenen Markt vor dem nächsten Zug oder Zusatzslot auf.
- Handlimit und PlayMeasure-Nutzung gelten deckübergreifend. Die Vorschau prüft dieselben Zonen, Verbote und generischen Zahlungsschritte wie die Ausführung.
- T10 prüft über boardgame.io den mittleren Marktslot. T18 prüft die ordinale ResortTile-Reihenfolge. Weitere Engine-Tests decken deckübergreifende Limits und Play-Refill aus Recycle ab.
- 126 Workspace-Tests, Lint, Mutation-Check und Game-TypeScript-Build bestehen unter Node 22.22.2. Der EXP-01-Replay-Hash berücksichtigt die gemeinsame Nutzungsmarke und die expliziten Karten-Zähler.

## 2026-11-08 — Task 0030 — Erweiterungsmaterial und erste Kartenauflösung

- Alle acht Erweiterungskombinationen erhalten nur ihre aktiven Ressourcen, Tiles und Decks. Setup-Tests prüfen die zehn EXP-01-Karten, SEC, den CLM-Deckfilter und das größere Material für fünf und sechs Spieler.
- Investment Program bietet den 2-ECO-Tausch am kontrollierten Grassroots an. Collective Bargaining, Investment Freeze und Supply Chain Disruption nutzen ihre regulären Decks, Preise und Ziele. T11/T12 prüfen fehlgeschlagene und erfolgreiche Zahlungen sowie Refill.
- 140 Workspace-Tests, Lint, Mutation-Check und Game-TypeScript-Build bestehen unter Node 22.22.2.

## 2026-11-08 — Task 0030 — Zeitfenster, Kosten und Regulationen

- Aktive Maßnahmen überdauern den Kartenumlauf und folgen tatsächlichen Zug-, Runden- und Settlement-Grenzen. Die zehn EXP-01-Karten sind an den bezahlten Spielweg angebunden.
- Der Zahlungsplan bucht Grundkosten und Aufschläge gemeinsam und berücksichtigt Herkunft, Climate-Schutz, Ersetzung, Transfer und Council-Nutzung. Pflichtslots ohne legale Aktion verbrauchen Budget Deficit.
- Regulationen behalten beim Transfer ihre Identität. Authority Apparatus bindet seinen eigenen Kontext. Emergency Decree löst seinen separaten Versuch vor der Hotspot-Mehrheit aus, und registrierte Settlement-Operationen laufen vor der Produktion.
- 153 Workspace-Tests, Lint, Mutation-Check und Game-TypeScript-Build bestehen unter Node 22.22.2.

## 2026-11-08 — Task 0030 — Entscheidungen bei Hotspots und Folgeeffekten

- Die Engine bietet Inner Order und Greenwashing dem Mehrheitsinhaber an und setzt die Einschließungssequenz nach dessen Wahl fort.
- Deployment Order und Competence Conflict warten auf die Wahl des ursprünglichen Maßnahmeneigentümers. Auch ein begonnenes Settlement kann nach einer Folgeentscheidung ohne erneute Zahlung fortgesetzt werden.
- Projektstandard ist Node.js 24 LTS mit 24.22.2 in .nvmrc. Die vollständige Testsuite, Lint und der Game-TypeScript-Build laufen auf dieser Version.

## 2026-11-08 — Task 0030 — Legale Engine-Optionen und Bot-Replay

- Die Optionsliste enthält alternative Zahlungen mit Payer, Ressource und Betrag. Derselbe Resolver prüft Optionen für Platzierung, Politik, Hotspot und Regulation.
- Der Bot erhält die realen Optionen mit ContextTile und Vorschauhash. Der Runner führt die per Index gewählte Option über boardgame.io aus und vergleicht den Vorschauhash mit dem Ergebnis.
- Encoding-Prüfung und Bereinigung erfassen ungültiges UTF-8, Mojibake und überflüssige ASCII-Escapes in JSON. Die geparsten JSON-Werte bleiben erhalten.

## 2026-11-08 — Task 0030 — CORE im Webclient

- Der Webclient bietet die Aktionen der aktuellen Engine-Phase an. Hotseat berücksichtigt auch Entscheidungen, die einem anderen Spieler als dem Zugspieler zustehen.
- Die Netzwerk-Lobby führt CORE als Spieltyp. Der lokale HTTP-Test erstellt ein CORE-Match auf Node.js 24.22.2.
