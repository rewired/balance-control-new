# Task 0030 — Implementierung an konsolidierte Regeln angleichen

- Status: In Arbeit. Engine-Grundlagen, Add-on-Setup, kanonische Mehrheit, politische CORE-Aktionen und einmalige Hotspot-Auflösung implementiert.
- Regelbasis: `3d6f289`, CORE/EXP-01/EXP-02/EXP-03 einschließlich ERRATA-0001 bis -0030
- Nachweis: [DD-0018 Softwareabgleich](../design-decisions/DD-0018-software-rule-conformity-audit.md)

## Ziel und Arbeitsweise

Die 20 Softwarebefunde aus DD-0018 beheben und die Entscheidungen R01–R26 aus DD-0017 im tatsächlichen Spielablauf nachweisen. Die Regeln werden dabei nicht geändert. Die folgenden Stufen sind ein Arbeitsplan, keine abgeschlossene Implementierung oder neue Architekturfreigabe. Jede Regelimplementierung erhält ihren genauen Normanker; echte neue Unklarheiten folgen AGENTS 0.6.

## 1. Engine-Integration und gemeinsame Grundlagen

- [x] S01/S02: Tatsächliche boardgame.io-Setup-Signatur, Spielerzahl, Match-Konfiguration und reproduzierbaren Seed anbinden. Ziehen, Platzierung und politische Sequenz gehören zu einem Engine-Turn. Das reguläre Settlement läuft einmal pro Runde. [DD-0019](../design-decisions/DD-0019-boardgame-turn-stages.md)
- [x] S04, Engine-Eingabegrenze: Resolverergebnis weitergeben, Payload und Slot vor Ausführung prüfen und ungültige Eingaben ohne Stage-Wechsel ablehnen. T08/T09 sind mit dem Engine-Client abgedeckt.
- [ ] S04, fachliche Auflösung: Vollständige Legalität und ausdrücklich vorgeschriebene Fehlschlagsfolgen zusammen mit den normativen Aktionen und Wirkungen nachweisen.
- [x] S05/S16: Gemeinsame aktive Ressourcenregistry, atomare Bank-/PersonalSupply-/Noise-Transfers, bedarfsgerechte Bankerzeugung, stabiles JSON-Hashing und Hash-Aufzeichnung an der regulären Zuggrenze. [DD-0020](../design-decisions/DD-0020-resource-transfers-and-turn-hashes.md)
- [x] S17/S18: Explizite DrawResolution, Hex/Orthogonal-Bindung und validierte Konfiguration für Varianten und 5–6-Spieler-Add-on. Setup und Ziehvorgang sind über die Engine geprüft. [DD-0021](../design-decisions/DD-0021-draw-resolution-and-match-options.md)
- [x] T15/T16/T17 als dauerhafte Engine-Regressionen umgesetzt. Die Tests decken Setup mit zwei bis vier Spielern, explizite Konfiguration und Seed sowie zwei vollständige Runden mit identischen Hashes pro Zug bei Wiederholung ab.
- [x] T05/T06/T19 bestehen als Regressionen für Zahlungsrückfluss, aktive ECO-Transfers und identische Hashes nach dem JSON-Roundtrip. Der Engine-Replay vergleicht die gespeicherten Hashes nach jedem Zug.

Nachweis vom 2026-11-08. `pnpm test` besteht mit 91 Tests, davon 44 in `@bc/game`. `pnpm lint`, `pnpm check:mutation`, `tsc -b packages/game` und der Webclient-Build bestehen. Die Tests liefen unter Node 24.18.0. Die Prüfung auf der deklarierten Node-Version folgt im Gesamtnachweis.

Norm: CORE-01-00, CORE-01-03, CORE-01-04, CORE-01-06-00-03 und CORE-01-06-00-07 bis -12; AGENTS 0.2, 3.5 und 5.3.

## 2. Vollständiges CORE und Spielende

- [x] S06: Kanonische Mehrheit mit Score-/Leader-Auskunft, Lobbyistenkontrolle, Empfängerausschlüssen und Kontrollrechten. Produktion und Hotspots verwenden denselben Dienst. [DD-0022](../design-decisions/DD-0022-canonical-majority.md)
- [x] S03, CORE: PlaceOrMoveInfluence einschließlich eigener Board-Bewegung, Committee-Formalisierung und Grassroots-Konvertierung mit allen aktiven Ressorts. Zonenwechsel erhalten Marker-ID und Eigentümer. [DD-0023](../design-decisions/DD-0023-core-political-actions.md)
- [x] Startmarker-Timing, Cap, Start-Committee-Immunität, Platzierungsverbot und einmalige Formalisierung sind durch Engine-Tests abgedeckt. Pflichtslots prüfen die implementierten Optionen nach Tile-Platzierung und Measure-Play und schließen automatisch ab, wenn keine legal ist. Erweiterungsspezifische Zahlungsalternativen und die Budget-Deficit-Ausnahme folgen in Stufe 3 und 4.
- [x] S07, Mehrheitsverteilung: Produktion bei positiver Mehrheit/Gleichstand und Nullmehrheit ohne Noise umgesetzt.
- [x] S08, CORE-Einschließung: Hotspot-Ereignisse persistent vermerken und vor der politischen Aktion in ordinaler Tile-ID-Reihenfolge auflösen. [DD-0024](../design-decisions/DD-0024-hotspot-enclosure-events.md)
- [x] S08, Erweiterungswirkungen: Emergency Decree vor der Mehrheit auslösen. Inner Order und Greenwashing an das unterbrechbare Einschließungsereignis anbinden. [DD-0029](../design-decisions/DD-0029-registered-decisions.md)
- [x] S09: Abschluss nach der letzten erfolgreichen Platzierung und politischen Sequenz sowie nach erfolglosem Ziehen mit genau einem finalen Settlement und Wertung. Die Engine-Replays prüfen eine verkürzte Schlussrunde und das Zusammenfallen von regulärem und finalem Settlement.
- [x] S18: Begrenztes TileRecycling, Abwurf bei fehlender bezahlbarer Platzierung, FirstPlayerHandicap sowie CORE-Material und Startmengen für fünf und sechs Spieler implementiert.
- [x] S18: Cap 8 für das 5–6-Spieler-Add-on bei der Influence-Erzeugung umgesetzt und im Fünf-Spieler-Match nachgewiesen.
- [x] T01/T02/T03 als dauerhafte Regressionen umgesetzt. Weitere Tests prüfen virtuelle Kontrolle ohne eigene Marker, additive Lobbyistenboni und den Produktionsrest bei positivem Gleichstand.
- [x] Start-Committee-Formalisierung über boardgame.io dauerhaft getestet.
- [x] T04: Wiederholungsversuche nach erfolgreicher oder ausgebliebener Auszahlung und nach JSON-Roundtrip über boardgame.io geprüft. Bei zwei gleichzeitigen Einschließungen entscheidet die Tile-ID über den letzten verfügbaren Marker.
- [x] Engine-Endspielreplays decken einen vollständigen CORE-Durchlauf über 71 Tiles, ein Finale nach Hotspot, Measure und Zusatzaktion sowie ein Ende nach unbezahlbaren Ziehversuchen ab. Jeder Replay prüft den Produktionszuwachs, die Gewinner und einen festen Endhash nach JSON-Roundtrip. [Engine-Tests](../../packages/game/src/endgame.replay.test.ts)

Nachweis für die Mehrheit vom 2026-11-08. 93 Workspace-Tests, Lint, Mutation-Check und Game-TypeScript-Build bestehen unter Node 24.18.0. Der Golden-Replay prüft den neuen Hash und den leeren Noise-Bestand bei fehlender positiver Mehrheit.

Norm: CORE-01-04 bis -09; VAR-01; ADD56-01.

## 3. Gemeinsame Auflösung, Spieluhr und Maßnahmen

- [x] S07/S13, Berechnung pro ResortTile: Verbot am produzierenden Tile prüfen, zulässige Verdopplungen auf den Druckwert anwenden, additive Modifikatoren aktiver Quellen summieren und den Minimum-0-Floor einmal anwenden. Danach folgen kanonische Mehrheit, reguläre Anteile und ursprünglicher Noise-Rest. [DD-0025](../design-decisions/DD-0025-canonical-production-pipeline.md)
- [x] S07/S13, Erweiterungswirkungen: Investment Freeze filtert Measure-Modifikatoren bei aktueller Kontrolle durch das Ziel. Supply Chain Disruption begrenzt den regulären Anteil je Tile und Empfänger und lässt den ursprünglichen Noise-Rest bestehen. Engine-Tests prüfen Ablauf, registrierte Wirkung sowie reguläres Ausspielen und Bezahlen beider Karten. [DD-0026](../design-decisions/DD-0026-production-source-and-receipt.md)
- [x] ResortTiles in ordinaler Tile-ID-Reihenfolge auflösen. T18 prüft die Reihenfolge unabhängig von der Board-Einfügung. Refill und Zusatzaktion gehören zum selben vollständigen Zug.
- [x] Registrierte Settlement-Operationen De-escalation und Loss of Control vor der Produktion in Registrierungsreihenfolge ausführen.
- [x] Aktive Effektinstanzen unabhängig von Karten mit stabiler ID, Quelle, Eigentümer, Zielen, Registrierungsreihenfolge, Dauer und Nutzungsmarken modellieren.
- [x] Zeitfenster beim tatsächlichen Zug- und Rundenbeginn, Zugende und nach dem Settlement verarbeiten. Nach dem Spielende beginnt keine Folgerunde. [DD-0028](../design-decisions/DD-0028-payment-and-measure-windows.md)
- [x] S11/S12, gemeinsamer Kartenlebenszyklus: getrennte Deckzonen, drei stabile Marktslots und Refill nach Take und Play. T10/T12 sind über die Engine abgedeckt. [DD-0027](../design-decisions/DD-0027-shared-measure-lifecycle.md)
- [x] Globale Limits von zwei Handkarten und einem PlayMeasure je Spieler/Runde für beliebige aktive Deckkombinationen umsetzen. Die gemeinsamen Flags sind auch ohne EXP-01 verfügbar, wenn ein anderes Deck aktiv ist.
- [ ] Vollständigen atomaren Zahlungsplan einschließlich Ersetzungen, Herkunft, Payern, Gebrauch und ausdrücklich geregelten Fehlschlagsausnahmen implementieren.
- [x] T07: Über boardgame.io prüfen, dass ein kontrolliertes DOM-W3 bei leerem PersonalSupply trotz aktivem Kosten-Hook 3 DOM liefert. Engine-Tests decken auch Verbot, Verdopplung, aktiven Modifikatorstapel, Floor und Noise-Rest ab. [Engine-Tests](../../packages/game/src/production.engine.test.ts)
- [x] T11/T12 und Kartenrezirkulation bei fortbestehender Wirkung mit Collective Bargaining über boardgame.io prüfen. [Engine-Tests](../../packages/game/src/measure-play.engine.test.ts)
- [ ] Mehrere unabhängige Instanzen, gleichzeitige Trigger und ausdrücklich geregelte Folgen fehlgeschlagener Zahlungen dauerhaft testen.

Norm: CORE-01-06-00-07 bis -12; CORE-01-06-16/-16A/-17; CORE-01-07-04 bis -18; EXP-01-06 und EXP-01-07.

## 4. Vollständige Erweiterungen

- [x] S10, Material: EXP-01-Tiles und zehn Karten im Deck. Investment Program ist als kontrollabhängige Grassroots-Alternative über boardgame.io geprüft.
- [x] Alle zehn EXP-01-Karten über den regulären, kostenpflichtigen Spielweg anbinden.
- [x] S14: EXP-02 mit SEC, Material, eigenen Maßnahmen, Regulationszonen/-typen, Authority Apparatus und Inner Order umsetzen.
- [x] ContextTile, Blockade, SecurityLevel und bezahlten Nulloutput über die Engine prüfen. Authority Apparatus behält seinen Kontext bei einem Transfer von einem blockierten Quell-Tile.
- [ ] Explizite Objektsperre durch Surveillance zusätzlich mit einem Engine-Regressionsfall absichern.
- [x] EXP-03 mit CLM-Material, Transformationsdruck und Setup-Eligibility: zehn Karten ohne EXP-01, dreizehn mit EXP-01. M14/M15 und Countdown-State bleiben ausgeschlossen.
- [x] Greenwashing/Protest, statische Climate-Herkunft, Schutzumfang und Waiver vor Supplemental Budget vor Intergenerational Pact umsetzen.
- [x] T13/T14 und alle acht Setup-Konfigurationen aus DD-0018 dauerhaft prüfen. 5–6-Spieler-Ergänzungen sind separat abgedeckt. [Materialtests](../../packages/game/src/expansion.material.engine.test.ts)

Norm: EXP-01 bis EXP-03 in konsolidierter Fassung; vollständige R-Zuordnung in DD-0018. Kein Countdown-Effekt wird aus reserviertem Kartentext abgeleitet.

## 5. Bots, UI und Durchsetzung

- [ ] S15: Engine liefert deterministisch alle legalen Optionen mit Parametern, Kostenaufschlüsselung, ContextTile und Vorschauhash; LLM wählt ausschließlich validierten Index.
- [ ] Ziel-, Kosten-, Prohibition-, Timing- und Zusatzaktionslegalität prüfen. Ungültiger Index/JSON/Backend-Ausfall fällt deterministisch auf eine wirklich legale Option zurück; leere Auswahl folgt dem Pflichtslotverfahren.
- [ ] Runner verwendet denselben kanonischen Engine-Ablauf einschließlich Zusatzaktion/Settlement; duplizierte Regelabläufe entfernen und dem LLM reale Optionen übermitteln.
- [ ] S20: Web-Client an tatsächliche politische API anbinden; Phasen- und Aktionsauswahl testen.
- [ ] S19: Normanker, direkte Mutationen außerhalb des Resolvers, unerreichbaren TakeMeasure-Block und produktive Sentinels/Noops bereinigen; Enforcement anhand tatsächlicher Schreibpfade prüfen.

## 6. Verbindlicher Gesamtnachweis

- [ ] Auf vorgesehener Node-Version `pnpm lint` und `pnpm test` bestehen; vorbestehende Lint-/Encoding-Probleme gesondert beheben und prüfen.
- [ ] Alle acht Konfigurationen aus AGENTS 5.4 auf Kostenstapelung, Produktion, Blockade und Klima-/Regulation-Reihenfolge testen. Nicht anwendbare Mechaniken aus den jeweils aktiven Regeln ableiten.
- [ ] Abwesenheit deaktivierter Ressourcen, Zonen, Karten, Hooks und Modifier-State prüfen; Countdown-State auch bei aktivem EXP-03 ausschließen.
- [x] Stabile SHA-256-Checkpoints in jedem der 71 CORE-Züge prüfen. Alle drei Endspielreplays mit festem Seed und festem Aktionsablauf wiederholen und Endzustand und Endhash vergleichen.
- [ ] Golden-Test für positiven Gleichstand mit ursprünglichem Noise-Rest sowie Nullmehrheit ohne Noise; Erweiterungsstapel und Empfängerlimits ergänzen.
- [ ] `git diff --check`, keine temporären Artefakte, genaue Normanker und aktuelle Dokumentation sicherstellen.
- [ ] Changelog und DD-0018 um tatsächlich behobene S-Befunde und konkrete Testnachweise aktualisieren.

Diese Task ist erst mit Umsetzung und Gesamtnachweis abgeschlossen. Der bestehende grüne 65-Test-Scaffold und die abgeschlossene Regelkonsolidierung erfüllen dieses Kriterium nicht.
