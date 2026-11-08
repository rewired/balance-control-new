# DD-0023 — Politische CORE-Aktionen und Markeridentität

Stand 2026-11-08. Task 0030, CORE-01-04-09 bis -22E, CORE-01-06-00-05 bis -12, CORE-01-08-01 bis -10 und ADD56-01-03-00-01.

## Marker und Zonen

Das Board hält pro realem Influence-Marker einen Eintrag mit ID, Eigentümer und Tile-ID. Die Platzierung verschiebt den ausgewählten Marker aus PersonalSupply auf das Board. Eine Bewegung ändert seine Tile-ID. Der automatische Hotspot-Transfer übernimmt ebenfalls das vorhandene Markerobjekt. Mehrheitsberechnung und Endwertung zählen die realen Board-Einträge. CORE-01-04-11/-12, CORE-01-05-03A, CORE-01-06-06 und CORE-01-09-03.

Beim Setup kennzeichnet `starting` die tatsächlich zugewiesenen Startmarker. Die Formalisierung prüft die PersonalSupply aller Spieler auf solche Marker. Formalisierte Marker erhalten eine deterministische ID im Format `INF-<Spieler>-F<Nummer>`. Das Cap zählt Board und PersonalSupply zusammen. Die erfolgreiche Start-Committee-Formalisierung vermerkt die Nutzung beim jeweiligen Spieler. CORE-01-03-04 bis -06 und CORE-01-08-01 bis -10.

Das frühere aggregierte Board-Format speicherte keine Marker-IDs. Die neue Darstellung gilt für neu gestartete Matches. Alte aggregierte Zustände können ihre ursprünglichen Markeridentitäten nicht rekonstruieren.

## Eingabe und Auflösung

Die Engine routet `doPoliticalAction` über den aktiven Move-Katalog.

| Aktion | Payload |
| --- | --- |
| `placeOrMoveInfluence` | `markerId`, `targetTileId` und bei Board-Bewegungen `sourceTileId` |
| `formalizeInfluence` | `tileId` und `resources` mit den gewählten Zahlungsressorts |
| `convertResources` | `tileId`, `input` und `output` für einen Tausch |

Legalitätsvorschau und Ausführung verwenden denselben Resolverplan. Die Ausführung bucht die vollständige Zahlung, den Effekt und gegebenenfalls die Nutzungsmarke gemeinsam. Die Bewegung bindet lokale Modifikatoren an das Ziel-Tile. Standard-Committee und Grassroots verwenden die kanonischen Kontrollrechte einschließlich virtueller Mehrheiten. Die Immunität des Start Committee greift nach der ContextTile-Bindung. CORE-01-04-14A/-21A, CORE-01-06-00-05A/-05B/-11 und CORE-01-08-06A/-06B.

Nach Tile-Platzierung und Hotspot-Auflösung sowie nach erfolgreichem Measure-Play prüft die Engine den anstehenden Pflichtslot. Gibt es keine legale Option, schließt sie ihn automatisch ab. Der Hotseat-Client zeigt die Optionen aus demselben Katalog. Erweiterungsspezifische Zahlungsalternativen, Investment Program und Budget-Deficit-Buchhaltung folgen in Task 0030. CORE-01-04-09A bis -09C.

## Nachweis

Der boardgame.io-Client prüft Platzierung und Bewegung, fremde Marker und ungültige Ziele, den Zielkontext, atomare Kosten, virtuelle Kontrolle, Startmarker-Timing, Immunität, einmalige Nutzung, die Caps 7 und 8, den Tausch mit aktivem ECO sowie Pflichtslots mit und ohne Aktion. Der Golden Replay verwendet zehn echte Engine-Züge mit festem Seed und prüft den Zustandshash.
