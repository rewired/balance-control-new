# DD-0029 — Unterbrechbare registrierte Entscheidungen

Stand 2026-11-08. Task 0030, S08/S13/S14.

Ein Einschließungsereignis mit einer zulässigen freiwilligen Wahl wartet auf den berechtigten Mehrheitsinhaber. Der ursprüngliche Zugspieler bleibt derselbe. Inner Order verwendet seinen eigenen ContextTile für die gewählte Regulation. Bei Greenwashing wird die gewählte feste Gebühr erst mit dem erlaubten Ergebnis gebucht. Nach Wahl oder Verzicht markiert der Resolver das Ereignis und führt die übrigen Einschließungen in Tile-ID-Reihenfolge fort. CORE-01-06-03 bis -07, EXP-02-02-G-04 bis -07 und EXP-03-08-M05-05 bis -09.

Deployment Order und Competence Conflict hängen ihre freiwilligen Folgen an die tatsächlich erfolgreiche auslösende Regulation-Operation. Die Engine hält nur für zulässige Entscheidungen an und setzt danach die zuvor angefangene Zug- oder Settlement-Sequenz fort. Bereits versuchte einmalige Operationen werden bei der Fortsetzung nicht wiederholt. Finales Settlement und Wertung folgen erst nach Abschluss der registrierten Operationen. CORE-01-07-04, CORE-01-09-02, EXP-02-08-M03-03/-04 und EXP-02-08-M05-03 bis -05.

Die Engine-Tests prüfen fremde Entscheidungseingaben, den Greenwashing-Ersatz, ausbleibende Gebühr unter Protest Movement, beide Regulation-Folgen und die Fortsetzung eines unterbrochenen Settlements. [Regulationstests](../../packages/game/src/regulations.engine.test.ts), [Kostentests](../../packages/game/src/costs.engine.test.ts)
