# DD-0021 — DrawResolution, Topologie und Match-Optionen

- Datum: 2026-11-08
- Status: Implementiert und über boardgame.io geprüft
- Bezug: S17/S18, Zieh- und Abschlussablauf aus S09 sowie R07 aus DD-0018 und DD-0017

Stand der Entscheidung vom 8. November 2026. Seit [ERRATA-0031](../rules/ERRATA-0031-hexagonal-topology.md) ist nur Hex als Match-Topologie verfügbar.

Die Match-Konfiguration speichert die ausgewählte Topologie als ID. `hex` ist der Standard. `orthogonal` bindet einen Adapter mit vier Nachbarn. Beide Adapter liefern das Adjazenzprädikat und die zugehörigen Kandidatenkoordinaten. Platzierung, Hotspot-Einschließung und Nachbarschaft für Lobbyisten in der Mehrheits- und Produktionsberechnung verwenden diese Bindung gemäß CORE-01-00-07 bis -11 und CORE-01-00-T01 bis -T05. [Topologieadapter](../../packages/rules/src/topology/index.ts)

Ein Beispiel für die Setup-Daten eines Matches mit fünf oder sechs Spielern:

```json
{
  "topology": "orthogonal",
  "addOn56": true,
  "variants": {
    "tileRecycling": true,
    "firstPlayerHandicap": true
  }
}
```

Die Spielerzahl kommt vom Engine-Kontext. Das Add-on ist für fünf und sechs Spieler erforderlich und für zwei bis vier Spieler deaktiviert. Die Varianten sind einzeln wählbar und standardmäßig aus. Das CORE-Add-on ergänzt 18 physische Tiles gemäß ADD56-01-01-02 bis -16 und weist zwei Startmarker pro Spieler gemäß ADD56-01-02-01/-02 zu. FirstPlayerHandicap zieht nach VAR-01-02-02/-03 dem tatsächlichen Startspieler in der Standard-Zugreihenfolge einen Startmarker ab. Die Einflussobergrenze aus ADD56-01-03-00-01 gehört zur Prüfung der noch ausstehenden Influence-Erzeugung. Material aktiver Erweiterungen wird in den jeweiligen Erweiterungsschritten ergänzt. [Setup-Schema](../../packages/rules/src/schemas.ts), [Setup](../../packages/rules/src/setup.ts), [Task 0030](../tasks/0030_rules_conformity_implementation.md)

`tiles.drawResolution` startet gemäß CORE-01-03-09 mit `null`. Jeder Ziehversuch entfernt genau ein Tile aus DrawPile und trägt es dort ein. Die verfügbaren Koordinaten sind Metadaten dieses Eintrags. Die Vorschau und die tatsächliche Platzierung verwenden denselben Legalitäts- und Zahlungsplan. Eine erfolgreiche Platzierung überträgt Tile und Zahlung atomar und leert DrawResolution. CORE-01-04-05A/-05B und CORE-01-04-06/-07 regeln die Platzierungsprüfung und den nächsten Versuch. Der Resolver nutzt die vorhandenen Kosten-Hooks für konkrete Zahlungsanforderungen. Die späteren Erweiterungsschritte liefern Karten- und Kostenwahlregeln. [Resolver](../../packages/rules/src/effects.ts)

TileRecycling legt nur Tiles ohne geometrische Platzierung zurück. Der Shuffle nutzt Match-Seed, Zugnummer und Versuchsnummer. Der laufende Ziehvorgang verfolgt die bereits versuchten Tile-IDs bis zur Platzierungsentscheidung und überspringt diese beim nächsten Versuch. Verbotene oder unbezahlbare Platzierungen mit vorhandener Geometrie führen zur offenen Ablage. Das folgt VAR-01-01-04 bis -08. [Resolver](../../packages/rules/src/effects.ts)

Ohne weiteres ziehbares Tile und bei leerer DrawResolution beendet die Engine die begonnene Ziehphase mit einem finalen Settlement. Liegt das letzte gezogene Tile noch in DrawResolution, bleiben Platzierung, Hotspots und die vollständige politische Sequenz Teil des Zugs. Das Abschlussverfahren nutzt dann dasselbe finale Settlement und wertet die tatsächlichen Board-Marker. Es startet keinen weiteren Zug. Das folgt CORE-01-09-01A bis -04. [Engine-Zug](../../packages/game/src/core.turns.ts)

Die Tests verwenden `InitializeGame`, `createMatch` und den lokalen Engine-Client. Sie prüfen Add-on-Material und Handicap, unbekannte Optionen, beide Nachbarschaftsformen, den Zonenwechsel, atomare Platzierungskosten, Ablage und erneutes Ziehen bei unzureichender Zahlung und das einmalige finale Settlement. Ein Testadapter mit isolierten Positionen prüft die geometrisch unplatzierbaren Fälle mit und ohne Recycling. Der Golden-Replay verwendet zehn feste Engine-Züge. [Setup-Tests](../../packages/game/src/factory.test.ts), [Zieh-Tests](../../packages/game/src/draw.engine.test.ts), [Golden-Replay](../../packages/game/src/golden.test.ts)

Der vollständige CORE-Replay verarbeitet alle 71 Tiles und erreicht einen geteilten Sieg in einer verkürzten Schlussrunde. Zwei Replays mit kürzerem, festem DrawPile prüfen die letzte Platzierung samt Hotspot, Measure und Zusatzaktion sowie das Spielende beim Abwerfen aller verbleibenden unbezahlbaren Tiles. Die unbezahlbaren Tiles verwenden im Test einen synthetischen Kosten-Hook. Jeder Replay prüft den konkreten Ertrag eines finalen Settlements und vergleicht den Endzustand samt Gewinnern und festem SHA-256 bei Wiederholung. Der Hash wird zusätzlich aus dem serialisierten abgeschlossenen Zustand, der Zugnummer und der Spieler-ID neu berechnet. [Engine-Endspielreplays](../../packages/game/src/endgame.replay.test.ts)
