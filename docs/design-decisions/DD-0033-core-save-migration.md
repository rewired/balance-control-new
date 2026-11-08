# DD-0033 — CORE-Zustand und Spielstandmigration

Stand 2026-11-08.

`G.exp.core` enthält Board, Tile-Zonen, Spielervorräte, Ressourcen, Influence und die vom Grundspiel verwalteten laufenden Effekte und Entscheidungen. Konfiguration, Match-Seed und letzter Zughash sind Metadaten der gesamten Partie und stehen in `G`. Die optionalen Erweiterungen behalten ihre separaten Slices.

Der Server migriert alte Spielstände beim Lesen aus dem bereits unterstützten `FLATFILE_DIR`. Das gilt für den aktuellen Zustand, den Startzustand und alle Undo- und Redo-Snapshots. Die Migration verändert weder Revision, Engine-Kontext, Zufallszustand noch Aktionslog. Der nächste reguläre Schreibvorgang speichert den aktuellen Zustand im neuen Format. Andere Aufrufer können vollständige boardgame.io-Snapshots mit `migrateCoreMatchState` laden.

Zug- und Vorschauhashes verwenden weiterhin dieselbe serialisierte Feldstruktur wie vor der Kapselung. Dadurch können alte Replays ihre erwarteten Hashes weiterverwenden. [Erweiterungsmatrix](../../packages/game/src/expansion.stack.engine.test.ts)
