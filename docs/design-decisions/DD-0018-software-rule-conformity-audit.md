# DD-0018 — Softwareabgleich mit den konsolidierten Regeln

- Prüfdatum: 2026-11-08
- Status: Audit abgeschlossen. Umsetzung in Task 0030 begonnen.
- Basis: `3d6f289` (`docs(rules): consolidate approved core and expansion rulings`)
- Arbeitsbranch: `codex/rules-software-audit`

Umsetzungsstand vom 2026-11-08. S01/S02 und die Engine-Eingabegrenze aus S04 sind umgesetzt. Die Nachweise für T08/T09/T15/T16/T17 laufen als dauerhafte Engine-Tests. Die folgenden Befunde und Prüfergebnisse beziehen sich auf die Audit-Basis `3d6f289`. [DD-0019](DD-0019-boardgame-turn-stages.md), [Task 0030](../tasks/0030_rules_conformity_implementation.md)

S05 und das stabile JSON-Hashing aus S16 sind umgesetzt. T05/T06/T19 laufen als dauerhafte Tests. Der reguläre Engine-Zug speichert seinen Hash nach dem Settlement, falls dieses am Zugende fällig ist. [DD-0020](DD-0020-resource-transfers-and-turn-hashes.md)

Die explizite DrawResolution, Topologiebindung und Match-Optionen sind umgesetzt. Engine-Tests prüfen Add-on-Setup, Handicap, bezahlbare Platzierungen, begrenztes Recycling und beide Zieh-Ausgänge zum finalen Settlement. Das Add-on-Cap bei der Influence-Erzeugung und die Erweiterungsmaterialien bleiben eigene Schritte. [DD-0021](DD-0021-draw-resolution-and-match-options.md)

S06 und die Mehrheitsverteilung aus S07 sind umgesetzt. T01/T02/T03 prüfen kontrollierte Lobbyisten, das ausgeschlossene Start Committee und Produktion ohne Auszahlung bei Nullmehrheit. [DD-0022](DD-0022-canonical-majority.md)

Die Produktionsrechnung aus S07/S13 bindet Verbote an das produzierende ResortTile und verwendet typisierte Verdopplungen und additive Deltas mit einem gemeinsamen Floor. T07 belegt die automatische Auszahlung ohne Kostenpass über boardgame.io. [DD-0025](DD-0025-canonical-production-pipeline.md)

Investment Freeze und Supply Chain Disruption greifen bei registrierten Produktionswirkungen in getrennten Stufen. Engine-Tests prüfen die Kontrolle zum Produktionszeitpunkt, die Quellentrennung und die endgültigen Transfers samt Bankbestand und Noise. [DD-0026](DD-0026-production-source-and-receipt.md)

Der CORE-Teil von S03 und das Add-on-Cap aus S18 sind umgesetzt. Engine-Tests prüfen Markeridentität, Committee-Formalisierung, Grassroots-Konvertierung und den automatischen Abschluss leerer politischer Slots. [DD-0023](DD-0023-core-political-actions.md)

Der CORE-Teil von S08 ist umgesetzt. T04 prüft den persistenten Abschluss nach Erfolg oder unterbliebener Auszahlung sowie gleichzeitige Einschließungen über boardgame.io. [DD-0024](DD-0024-hotspot-enclosure-events.md)

S09 ist durch drei wiederholte Engine-Endspielreplays belegt. Sie prüfen das einmalige finale Settlement am regulären Rundenende und in einer verkürzten Schlussrunde, Sieg und geteilten Sieg, beide Zieh-Ausgänge sowie den Endhash nach JSON-Roundtrip. [Engine-Replays](../../packages/game/src/endgame.replay.test.ts)

## Ergebnis und Umfang

Die Software implementiert die konsolidierten Regeln noch nicht vollständig. Sie ist ein Scaffold mit einzelnen CORE-Helfern und einem partiellen EXP-01-Kartenlebenszyklus. Politische CORE-Aktionen, vollständiger Spielabschluss, Maßnahmenwirkungen und die Mechaniken von EXP-02/EXP-03 fehlen. Zusätzlich bestehen Fehler in bereits implementierten Abläufen.

Verglichen wurden `000-core.md`, `001-expansion01.md`, `002-expansion02.md` und `003-expansion03.md` einschließlich ERRATA-0001 bis -0030 mit `packages/rules`, `packages/game`, `packages/exp-01-economy`, gemeinsamen Zufalls-/Hashfunktionen und der Anbindung von Bot, Runner und Web-Client. Die 26 angenommenen Entscheidungen aus [DD-0017](DD-0017-rule-consistency-audit.md) sind unten vollständig zugeordnet. Es wurden weder Regeln neu ausgelegt noch produktive Implementierungen geändert.

Die Prüfung umfasst Quellcode, vorhandene Tests, gezielte Laufzeitdiagnosen und den tatsächlichen boardgame.io-Lebenszyklus. Sie ist kein Einzeltest aller 801 Regel-/Abschnittsanker und kein vollständiger Sicherheits-, Persistenz- oder UI-Audit. Die informative Notation ersetzt keine normative Regel.

## Prüfnachweise

| Prüfung | Ergebnis |
| --- | --- |
| `pnpm test`, unveränderter Produktivcode | 65 Tests in 30 Dateien bestanden, einschließlich bestehendem Golden-Test |
| `pnpm lint` | Drei vorhandene `no-explicit-any`-Fehler in `packages/server/src/bot.runner.ts:22` |
| `pnpm check:encoding` | Vorhandene Encoding-Befunde in fünf Dateien, siehe unten |
| `pnpm check:mutation` | Bestanden; Abdeckungsgrenzen siehe S19 |
| Temporäre Vitest-Diagnose | 27 Fälle: T01–T19 fehlgeschlagen; sieben Erweiterungs-Setups fehlgeschlagen; CORE-Setup bestanden |
| Produktivcode / normative Regeln | Unverändert; temporäre Diagnosedatei nach Ausführung entfernt |

Die Encoding-Befunde betreffen `docs/changelog.md`, `docs/llm/local-bot-ollama.md`, `scripts/fix-fffd-rewrite.mjs`, `scripts/replace-fffd.mjs` und `scripts/utf8-clean.mjs`. Der Check meldet U+FFFD beim UTF-8-Lesen; dieselben Befunde wurden jeweils im vorherigen HEAD nachgewiesen. Keine pauschale Encoding-Reparatur vorgenommen.

Nach `EPERM` beim Unterprozessstart wurden die Befehle außerhalb der Sandbox ausgeführt. Dort lief Node 24.18.0; deklariert sind `>=20.11.0 <23` und `.nvmrc` mit 20.11.1. Der Nachweis auf der vorgesehenen Node-Version bleibt erforderlich. Kein Build, Browserdurchlauf, Live-LLM-Aufruf oder Netzwerk-Match wurde ausgeführt.

Die temporäre Datei `packages/game/src/rule-conformity.audit.test.ts` wurde mit `pnpm exec vitest run packages/game/src/rule-conformity.audit.test.ts --reporter=dot` ausgeführt und anschließend gelöscht. Die unten festgehaltenen Rezepte müssen bei Behebung als dauerhafte Regressionstests umgesetzt werden. Die 19 Sollverletzungen und sieben fehlgeschlagenen Setup-Konfigurationen sind weder eine Konformitätsquote noch 26 unabhängige Fehlerursachen.

## Prioritäten

P1 blockiert einen regelkonformen vollständigen Spielablauf oder eine betroffene aktive Mechanik. P2 bezeichnet zusätzliche Vertrags-, Erweiterbarkeits- oder Bedienlücken. Fehlende Mechaniken sind keine durch die Errata neu verursachten Regressionen.

| ID | Priorität | Thema | Nachweis |
| --- | --- | --- | --- |
| S01 | P1 | Tatsächliches Setup ignoriert Spielerzahl und Match-Konfiguration | T15, T16 |
| S02 | P1 | Engine-Phasen bilden keinen vollständigen Spielerzug ab | T17 |
| S03 | P1 | Politische CORE-Aktionen fehlen; unbegründete Noops sind verfügbar | Move-Katalog |
| S04 | P1 | Verweigerte Auflösungen verbrauchen Phase oder Aktionsslot | T08, T09 |
| S05 | P1 | Resolverregistry und Banktransfers sind unvollständig | T05, T06 |
| S06 | P1 | Lobbyistenbonus ist präsenzbasiert; Mehrheit wird dupliziert | T01, T02 |
| S07 | P1 | Nullmehrheit erzeugt Noise; Produktionspipeline ist unvollständig | T03, T07 |
| S08 | P1 | Hotspots ohne persistenten Einmaligkeitsvermerk und stabile Reihenfolge | T04, Quellcode |
| S09 | P1 | Finales Settlement, Wertung und Spielende fehlen | Game-Konfiguration |
| S10 | P1 | Erweiterungsmaterial und Kartenwirkungen fehlen | T13, T14, Setup-Matrix |
| S11 | P1 | Markt verschiebt Slots; Refill nach PlayMeasure fehlt | T10, T12 |
| S12 | P1 | Gemeinsames Maßnahmenframework ist an EXP-01 gebunden | Zustandsmodell/Resolver |
| S13 | P1 | Effektinstanzen, gemeinsame Spieluhr und Zahlungsplan fehlen | T11, T18, Quellcode |
| S14 | P1 | Regulation-, SecurityLevel- und Klimainteraktionen fehlen | Erweiterungsstubs |
| S15 | P1 | Bot-Auswahl ist nicht vollständig legalitätsgeprüft | Adapter/Runner |
| S16 | P1 | Zug-Hashes fehlen; Hash ändert sich beim JSON-Roundtrip | T19, Aufrufstellen |
| S17 | P2 | Topologie bleibt außerhalb des Adjazenzprädikats auf Hex festgelegt | Placement/Mehrheit/Hotspot |
| S18 | P2 | Varianten und 5–6-Spieler-Add-On fehlen | Config/Setup/Draw |
| S19 | P2 | Regelanker und Resolver-Enforcement sind lückenhaft | Quellcode/Mutation-Check |
| S20 | P2 | Web-Client erwartet eine nicht vorhandene politische Move-API | Board/Game |

## Befunde mit Normankern und Codebelegen

### S01 — Setup über die tatsächliche Engine-Schnittstelle

**Norm:** CORE-01-03-04 bis -06; EXP-01-01-06, EXP-02-01-06, EXP-03-01-06; AGENTS 0.2 und 3.8.

[factory.ts:12](../../packages/game/src/factory.ts#L12) behandelt das erste Setup-Argument wie `{ matchID, numPlayers, setupData }`. Die installierte boardgame.io-Version 0.50.2 ruft dagegen `game.setup({ ...pluginAPIs, ctx: state.ctx }, setupData)` auf; lokal nachgewiesen in `dist/cjs/initialize-648ccd94.js:34`. Spielerzahl liegt im verschachtelten `ctx`, Match-Konfiguration im zweiten Argument.

Bei drei tatsächlichen Engine-Spielern entstehen nur Spieler `0` und `1` mit jeweils vier Startmarkern. Per `setupData` aktiviertes EXP-01 bleibt bei CORE-Default deaktiviert. Die Seed-Anbindung fällt auf `match` zurück. Bestehende Factory-Tests verdecken das durch manuelle Aufrufe mit einer erfundenen Signatur und Type-Casts. Abnahme muss über `InitializeGame` oder einen echten Client erfolgen.

### S02 — Spielphasen und Engine-Turns stimmen nicht überein

**Norm:** CORE-01-04-01 bis -03; CORE-01-07-02 und CORE-01-07-08.

[core.turns.ts:75](../../packages/game/src/core.turns.ts#L75) ruft nach Platzierung `endPhase` auf; boardgame.io beendet dabei bereits einen Turn und initialisiert beim nächsten Phasenstart die Zugreihenfolge neu. Nach der politischen Aktion wird nur `endTurn` aufgerufen ([Zeile 101](../../packages/game/src/core.turns.ts#L101)); `next: DrawAndPlaceTile` beendet diese Phase nicht selbst.

T17 bleibt nach Platzierung und politischem Noop in `ExactlyOnePoliticalAction`, Turn 3, ohne neues Pending-Tile. Spielerzuständigkeit, vollständige Zuggrenze und Settlement-Trigger müssen über mindestens zwei vollständige Engine-Runden geprüft werden. Platzierung und gesamte politische Sequenz gehören demselben Spieler; erst danach folgt der nächste Spieler mit Ziehen.

### S03 — Politische Grundaktionen und Voraussetzungen fehlen

**Norm:** CORE-01-04-09 bis -22E; CORE-01-08-01 bis -10; EXP-01-05-01 bis -08.

Der Move-Katalog enthält nur `chooseNoop`. PlaceOrMoveInfluence, Formalisierung und Grassroots-Konvertierung fehlen als politische Aktionen. Der generische Influence-Transfer unterstützt ausschließlich PersonalSupply → Board. Er entfernt Marker-IDs aus PersonalSupply und speichert auf dem Board nur die Anzahl je Eigentümer. Damit fehlt die durchgehende Objektidentität für Zonenwechsel und für die spätere Prüfung, ob sämtliche Startmarker bereits platziert wurden. Die zugehörigen Kontrollrechte, das Cap und die Regeln für Formalisierung und Investment Program fehlen ebenfalls. [Move-Katalog](../../packages/rules/src/moves.ts#L54), [Influence-Transfer](../../packages/rules/src/effects.ts#L256)

`exp01_noop` verändert lediglich einen Sentinel ([index.ts:31](../../packages/exp-01-economy/src/index.ts#L31)). Frei wählbare Noops ersetzen weder eine legale Pflichtaktion noch die automatische Slot-Vervollständigung nach CORE-01-04-09B. Diese benötigt vollständige legale Optionen einschließlich Bezahlalternativen und Start-Committee-Immunität.

### S04 — Fehlerergebnisse gehen vor dem Phasen-/Zugwechsel verloren

**Norm:** CORE-01-04-05B; CORE-01-06-00-03 und CORE-01-06-00-12; EXP-01-06-05(c).

[core.turns.ts](../../packages/game/src/core.turns.ts) ignoriert das Ergebnis der Platzierungsauflösung. Der Move ruft trotz Verbot `endPhase` auf (T08). `execute` im [Move-Vertrag](../../packages/rules/src/moves.ts) liefert `void`, Erweiterungsmoves verwerfen `ResolveResult`; TakeMeasure bei voller Hand beendet deshalb trotzdem den Zug (T09).

`bannedMoveType` wird erst nach `def.execute` geprüft. Slot-, Phasen- und sonstige Eingabelegalität müssen vor Mutation geprüft werden. Schemafehler werden mit `parse` geworfen, ohne einheitlichen Engine-Ablehnungspfad. Erfolgreicher bezahlter Nulloutput ist dagegen ausdrücklich ein Erfolg und muss seinen Slot verbrauchen.

### S05 — Ressourcenregistry und Banktransfer sind nicht kanonisch

**Norm:** CORE-01-00-04A bis -04D; CORE-01-04-16 und CORE-01-04-22C; EXP-01-01-03.

Setup registriert ECO; [effects.ts:148](../../packages/rules/src/effects.ts#L148) erzeugt ausschließlich die CORE-Registry. Eine ECO-Gutschrift wirft `Unknown resource: ECO` (T06); ECO-Zahlungen sind ebenfalls nicht unterstützt. Kosten werden aus PersonalSupply abgezogen, ohne zur Bank zu gelangen (T05). Auszahlungen buchen vorhandene Bankbestände nicht ab.

Bei ungültigem Output-Ressort kann nach dem Kosten-Commit noch eine Exception auftreten. Nötig sind eine identische aktive Registry für Setup/Legalität/Resolver, atomare Transfers aller Beteiligten und bedarfsgerechte Erzeugung nur fehlender aktiver Bankressourcen. T05 prüft den vorhandenen Zahlungshelper, keine bereits implementierte Konvertierungsaktion.

### S06 — Lobbyistenkontrolle und ein kanonischer Mehrheitspfad

**Norm:** CORE-01-05-03A bis -09; CORE-01-08-05; AGENTS 3.3.

[majority.ts:16](../../packages/rules/src/majority.ts#L16) vergibt den Bonus an jeden Spieler mit irgendeinem Marker auf dem Lobbyisten. Bei 2:1 erhalten beide +1 statt ausschließlich des Controllers. Empfänger-Lobbyisten und Start Committee werden nicht ausgeschlossen. T01 ergibt fälschlich Gleichstand; T02 weist Start Committee einen Controller zu.

[production.plan.ts:21](../../packages/rules/src/production.plan.ts#L21) berechnet Basis-/Lobbyistenscores für Gleichstandsempfänger erneut. Eine Reparatur allein an `computeMajority` genügt daher nicht. Produktion benötigt die Leader-/Score-Auskunft desselben kanonischen Diensts; virtuelle Influence bleibt außerhalb von Cap und Wertung.

### S07 — Produktion: Nullmehrheit und Auflösungsgrenzen

**Norm:** CORE-01-06-13 bis -17; CORE-01-06-00-07(a); EXP-01-04-B-03; EXP-03-10-04.

Bei höchstem Influence-Wert 0 plant [production.plan.ts:75](../../packages/rules/src/production.plan.ts#L75) den gesamten Output für Noise statt überhaupt nichts zu produzieren (T03). [effects.ts:231](../../packages/rules/src/effects.ts#L231) vergibt Anteile über erneutes `addResources`; diese internen Schritte durchlaufen nochmals generische Kosten-/Output-Hooks ohne Herkunfts-/Payer-Kennzeichnung.

T07 isoliert mit synthetischem Kosten-Hook, dass automatische Produktion dadurch an Ressourcenmangel scheitert. Eine echte Regulation ist noch nicht implementiert. Sequentielle Gutschriften haben außerdem keine gemeinsame Transaktion bei späterem Fehlschlag. Verdopplungen, typisierte additive Modifikatoren mit Quellenfilter und nachgelagerte Empfängerlimits fehlen. Beliebige nacheinander angewendete Funktionen gewährleisten diese kanonischen Stufen nicht. Der bestehende positive Gleichstandstest W5/2 mit Noise-Rest 1 bleibt ein brauchbarer Teilnachweis.

### S08 — Persistentes und geordnetes Hotspot-Ereignis fehlt

**Norm:** CORE-01-06-02A bis -04A; EXP-01-08-M01-06; EXP-02-04-C-04.

[effects.ts:219](../../packages/rules/src/effects.ts#L219) speichert keinen Vermerk über ein verarbeitetes Einschließungsereignis. Ein erneuter Resolveraufruf zahlt erneut (T04). Die geometrische Änderungserkennung im normalen Placement-Pfad reduziert solche Aufrufe, ersetzt aber den vorgeschriebenen persistenten Vermerk einschließlich unterdrückter Ausgänge nicht.

[core.turns.ts](../../packages/game/src/core.turns.ts) verarbeitet Kandidaten in Hex-Nachbarreihenfolge und einen neu platzierten Hotspot separat davor, statt nach stabiler Tile-ID. Vor-Mehrheits-Trigger, reduzierte Influence-Auszahlung und Ereignisverbrauch bei Verboten/Fehlschlägen sind unvollständig. Ein frühes generisches Prohibition-Return markiert kein verarbeitetes Ereignis.

### S09 — Finales Settlement und Wertung fehlen

**Norm:** CORE-01-07-01A; CORE-01-09-01 bis -04; VAR-01-01-08.

[factory.ts](../../packages/game/src/factory.ts) hat weder regelbezogenes Endkriterium noch finale Wertung oder einmaligen finalen Settlement-Pfad. Leeres Ziehen erzeugt nur fehlendes `pending`; politische Auslassung und Abschluss fehlen. Auch die letzte erfolgreiche Platzierung führt nicht nach ihrer vollständigen politischen Sequenz zum Spielende.

Settlement hängt nur an `playOrderPos`. Verkürzte Schlussrunde, Zusammenfallen von regulärem und finalem Settlement, geteilte Siege und das Verbot weiterer Züge/Runden sind nicht implementiert.

### S10 — Erweiterungsmaterial und Kartenwirkungen fehlen

**Norm:** EXP-01-03-07 und EXP-01-08; EXP-02-01-01, EXP-02-03 und EXP-02-08; EXP-03-02-A-02A, EXP-03-03-02A bis -07 und EXP-03-08.

[EXP-01](../../packages/exp-01-economy/src/index.ts#L9) registriert ECO und acht Karten-IDs, fügt aber keine ECO-Tiles, keinen Labor Market und kein Investment Program hinzu. M09/M10 fehlen im Deck (T13). Auch M01–M08 haben keine implementierten Kosten, Ziele oder Wirkungen: PlayMeasure führt nur Karten-/Flag-Buchhaltung aus. T11 akzeptiert Collective Bargaining bei 0 ECO statt den Preis 2 ECO zu verlangen.

[EXP-02/EXP-03](../../packages/game/src/expansions.bootstrap.ts#L5) sind Stubs mit `__boot`. SEC/CLM, besondere Tiles, Decks und Wirkungen fehlen (T14/Matrix). Die Abwesenheit von Countdown-State entspricht dem negativen Teil von R18, beweist jedoch weder funktionierendes EXP-03-Setup noch korrekten Deckfilter.

### S11 — Marktslots und Refill sind falsch

**Norm:** EXP-01-02-E-01B; EXP-01-03-06; EXP-01-07-05A bis -05D.

[effects.ts:300](../../packages/rules/src/effects.ts#L300) entfernt Karten per `splice` und hängt Nachziehkarten an. Dadurch rückt Slot 3 nach Slot 2, statt belegte Slots zu erhalten (T10). Nach [PlayMeasure](../../packages/rules/src/effects.ts#L326) findet kein Refill statt; ein leerer Markt bleibt trotz gerade verfügbarer Recycle-Karte leer (T12).

`playCounts` startet leer und behandelt fehlende Einträge als 0. Die späteren Tests müssen den Anfangswert und seine Erhaltung bei jedem Zonenwechsel nachweisen. Recycling, zweite Verwendung und FinalDiscard sind als Grundgerüst vorhanden. Die vollständige Erfolgs- und Fehlschlagsprüfung fehlt.

### S12 — Gemeinsames Maßnahmenframework fehlt

**Norm:** EXP-01-06-00 bis -00B, EXP-01-06-02A und EXP-01-06-03; EXP-02-07-01; EXP-03-07-01.

[Zustand](../../packages/rules/src/types.ts#L87) und [Resolver](../../packages/rules/src/effects.ts#L280) behandeln Maßnahmen nur für EXP-01. Andere Expansion-IDs liefern teilweise still `ok: true` ohne Wirkung. Handlimit und Rundennutzung sind nur lokal zu EXP-01 statt spielerweit über alle Decks; eigenständige andere Decks fehlen.

[factory.ts:34](../../packages/game/src/factory.ts#L34) resettet direkt nach der Produktionsschleife ohne vollständiges Settlement, Effektablauf oder tatsächlichen nächsten Rundebeginn. Normaler CORE-Setup erzeugt keine Erweiterungsslices. `assertExpansionStateMatchesConfig` prüft allerdings nur fehlende aktive Slices, nicht deaktivierte Ghost-Slices. Vollständige Isolation muss Ressourcen, Zonen, Karten, Hooks und gemeinsame Nutzung umfassen.

### S13 — Effektinstanzen, Spieluhr und Zahlungsplan fehlen

**Norm:** CORE-01-06-00-07 bis -12; CORE-01-07-04 bis -18; EXP-01-06-05D; EXP-01-07-08 bis -15.

[types.ts](../../packages/rules/src/types.ts), [effects.ts](../../packages/rules/src/effects.ts) und [factory.ts](../../packages/game/src/factory.ts) kennen keine unabhängigen aktiven Effektinstanzen mit stabiler ID, Quelle, Eigentümer, Zielen, Registrierung, Dauer und Verbrauch. Spätere Trigger, mehrere Instanzen und Kartenrezirkulation bei fortbestehender Wirkung sind nicht abgebildet. Die gemeinsame ereignisbasierte Uhr und geordnete Grenzverarbeitung fehlen.

Settlement iteriert die Board-Einfügereihenfolge statt stabiler Tile-ID-Reihenfolge (T18), ohne registrierte Vorproduktionsoperationen oder nachgelagerte Schritte. Ein vollständiger Zahlungsplan mit Grundkosten, Aufschlägen, festen Gebühren, Ersetzungen, mehreren Zahlern und atomaren Nutzungsflags fehlt. T11 belegt fehlende Kartenkosten; Pact-/Council-Interaktionen sind noch gar nicht implementiert.

### S14 — Regulation- und Klimainteraktionen fehlen

**Norm:** EXP-02-02-B-02A bis -07; EXP-02-04; EXP-02-05; EXP-02-08; EXP-03-02-D-01 bis -08; EXP-03-06; EXP-03-08-M05, EXP-03-08-M07 und EXP-03-08-M11.

Die [Stubs](../../packages/game/src/expansions.bootstrap.ts#L19) liefern weder RegulationSupply/BoardAttached, Typen, Zielberechtigung noch Authority Apparatus. Blockade-Präzedenz, einmalige lokale Kostenbehandlung, Surveillance, SecurityLevel-Outputklassen und bezahlter Nulloutput fehlen. Generische Mock-Hooks sind kein Nachweis dieser Mechaniken.

Ebenso fehlen statische Climate-Herkunft, Kostenklassifikation, Schutzumfang, Greenwashing/Protest, Supplemental-Budget-Ersetzung, Intergenerational-Pact-Übertragung und Supply-Chain-Empfängerlimit. R18 verlangt ausdrücklich keine Countdown-Implementierung; M14/M15 bleiben auch bei späterer Vervollständigung ausgeschlossen.

### S15 — Bot-Auswahl ist schemaförmig, aber nicht vollständig legal

**Vertrag/Norm:** AGENTS 4.1 bis 4.3; CORE-01-04-09A; CORE-01-06-00-12.

[adapter.ts:5](../../packages/bot-llm/src/adapter.ts#L5) liefert nur `id`, `type`, `payload`, ohne Kostenaufschlüsselung, ContextTile oder Vorschauhash. Enumeration prüft nicht kanonisch Bezahlbarkeit, Prohibitions, Phase und Zusatzaktionsslot. Handkarten werden trotz fehlender Ziele/Kosten angeboten, Noops bleiben auswählbar. Der vorhandene Test prüft Schema-Gültigkeit, nicht vollständige Legalität.

Die LLM-Ausgabe verwendet `optionId` statt des vereinbarten Index. Zod-Validierung und deterministischer Fallback existieren, arbeiten jedoch auf der unvollständigen Liste. Der [Runner](../../packages/server/src/bot.runner.ts#L80) sendet nur Anzahl/Kurztext, nicht die auswählbaren Optionen. Er führt Definitionen direkt aus, dupliziert Ziehen/Hotspots/Settlement und erfüllt keine verpflichtende Zusatzaktion; damit umgeht er die Game-Sequenz.

### S16 — Hashing und Replay-Nachweis sind unvollständig

**Vertrag:** AGENTS 0.2 und 5.2 bis 5.4.

Seeded Shuffle und SHA-256 mit sortierten Objektschlüsseln sind vorhanden. In den geprüften Paketquellen wurde kein `Math.random` oder Systemzeit-Zugriff für Regelauflösungen gefunden. `stableHash` wird jedoch nur in Tests aufgerufen, nicht nach jedem vollständigen Zug.

[hash.ts:3](../../packages/shared/src/hash.ts#L3) serialisiert `undefined`-Objektfelder anders als JSON. Nach `placeTile` enthält `turn.pending` den Wert `undefined`; JSON-Speichern/Laden entfernt den Schlüssel und verändert den Hash (T19). Der [Golden-Test](../../packages/game/src/golden.test.ts) führt zehn Platzierungen mit nachgebautem Ablauf und politischen Noops aus, ohne echte Engine-Sequenz, Spielabschluss oder Erweiterungsstapel. Der Bot-Test prüft nur das Hexformat eines einzelnen Hashes.

### S17 — Topologie nicht vollständig austauschbar

**Norm:** CORE-01-00-07 bis -11; CORE-01-00-T01 bis -T05.

[placement.ts:16](../../packages/rules/src/placement.ts#L16) nimmt ein Adjazenzprädikat an, erzeugt Kandidaten aber ausschließlich mit `hexNeighbors`. [Mehrheit](../../packages/rules/src/majority.ts#L16), [Hotspots](../../packages/rules/src/hotspot.ts) und Game-Nachbarsuche enthalten eigene Hex-Annahmen. Ein anderer Adjazenzbegriff ändert diese Aufrufer nicht. MatchConfig enthält keine aktive Topologiebindung.

### S18 — Varianten, Add-On und DrawResolution fehlen

**Norm:** CORE-01-00-05/-05A, CORE-01-04-05A/-05B, VAR-01-01-01 bis -08, VAR-01-02-01 bis -08, ADD56-01-01-01 bis -16, ADD56-01-02-01/-02 und ADD56-01-03-00-01.

[MatchConfig](../../packages/rules/src/schemas.ts#L27) kennt nur Erweiterungsflags. TileRecycling, FirstPlayerHandicap, 5–6-Spieler-Material, zwei Startmarker und Cap 8 fehlen. GameConfig erlaubt höchstens vier Spieler; der ungeprüfte [Setup-Helfer](../../packages/rules/src/setup.ts) fällt für fünf/sechs Spieler auf null Startmarker zurück.

[drawUntilPlaceable](../../packages/rules/src/draw.ts) prüft nur Geometrie, keine Tile-abhängigen Kosten oder bezahlbare Legalität. Recycling-Versuchsmenge und terminale Ausgänge fehlen. `turn.pending` hält ein gezogenes Tile außerhalb des Stapels, bildet aber die geforderte explizite DrawResolution-Zone und Transfers nicht vollständig ab.

### S19 — Regelanker, Duplikate und Resolver-Enforcement

**Vertrag:** AGENTS 0.4, 0.5 und 3.5.

Teilweise stehen nur AGENTS-Verweise, grobe Abschnittsbereiche oder historische Noop-Kommentare an Implementierungen. Hinter dem ersten TakeMeasure-Block in [effects.ts:314](../../packages/rules/src/effects.ts#L314) folgt ein zweiter unerreichbarer Block. Sentinels und `__boot` bleiben Scaffold-State. Game-Turnflags und EXP-01-Sentinel werden außerhalb des Resolvers über Aliase mutiert.

Der bestandene [Mutation-Check](../../scripts/check-no-direct-mutation.mjs) erfasst diese Alias-Schreibformen nicht; der Server-Runner liegt außerhalb seines Game-Paketfilters. R26 hat normative Dokumentanker bereinigt, nicht sämtliche Code-Anker geprüft. Bei Implementierung sind genaue Normanker einzutragen und überholte Interpretationen, Duplikate und produktive Platzhalter zu entfernen.

### S20 — Politische Move-API im Web-Client passt nicht

**Norm/Vertrag:** CORE-01-04-09; AGENTS 1.2.

[BoardCore.tsx:3](../../packages/client-web/src/BoardCore.tsx#L3) erwartet `moves.chooseNoop` als Top-Level-Move und zeigt nur dafür eine Schaltfläche. Das Game bietet in der Phase ausschließlich `doPoliticalAction`. Damit fehlt bereits für den Scaffold ein passender UI-Pfad zur politischen Aktion; normative Optionen/Erweiterungsparameter sind ebenfalls nicht angebunden. Quellcodebefund, kein Browsernachweis.

## Reproduktionsrezepte T01–T19

Resolverfälle verwenden einen deterministischen Zwei-Spieler-Zustand und das bisherige direkte Factory-Testsetup, damit S01 andere Mechaniken nicht verdeckt. Synthetische Hooks isolieren Resolvergrenzen; sie stellen keine implementierten Regulations dar. T15/T16 verwenden die installierte Engine-Funktion `InitializeGame`, T17 den echten `Client` aus `boardgame.io/client`.

| Fall | Auslöser und Soll | Beobachtetes Ist |
| --- | --- | --- |
| T01 | DOM-W3 je 1 Marker, benachbarter Lobbyist 2:1 für Spieler 0; Mehrheit muss `0` sein | `null` |
| T02 | Kontrollierter Lobbyist neben Start Committee; dieses muss unkontrolliert bleiben | Controller `0` |
| T03 | DOM-W3 ohne reale/virtuelle Influence produzieren; Noise muss 0 bleiben | Noise DOM = 3 |
| T04 | Umschlossenen kontrollierten Hotspot zweimal auflösen; PersonalSupply 4 darf einmal 1 Marker verlieren | PersonalSupply 2 statt 3 |
| T05 | `addResources` mit Kosten 1 DOM und Output 1 FOR; Bank muss bezahlte DOM erhalten | Bank DOM = 0 |
| T06 | Bei aktivem EXP-01 über dessen Resolver 1 ECO gutschreiben | Exception `Unknown resource: ECO` |
| T07 | Kontrolliertes DOM-W3, PersonalSupply 0; synthetischer Kosten-Hook +1 DOM; automatische Produktion muss 3 liefern | Gutschrift 0 |
| T08 | Pending-Tile; synthetischer Hook verbietet Platzierung; `endPhase` darf nicht aufgerufen werden | Ein Aufruf |
| T09 | Hand mit zwei Karten; weitere offene Karte nehmen; `endTurn` darf nicht aufgerufen werden | Ein Aufruf |
| T10 | Markt-Slot 2 nehmen; belegte Slots 1/3 erhalten, Nachziehkarte in Slot 2 | Slot 3 rückt nach, neue Karte am Ende |
| T11 | M03 Collective Bargaining bei 0 ECO spielen; muss fehlschlagen und Karte behalten | `ok: true`, Karte rezirkuliert, Nutzung markiert |
| T12 | M03 bei 2 ECO, Markt/Draw/Recycle leer, andere Karten im FinalDiscard; erste Verwendung muss Recycle-Karte in Markt bringen | Markt bleibt leer |
| T13 | EXP-01-Setup: Draw + Open muss 10 Karten enthalten | 8 |
| T14 | EXP-02-Setup: aktive Ressorts müssen SEC enthalten | Nur DOM/FOR/INF |
| T15 | `InitializeGame({ game: createBCGame(), numPlayers: 3 })` muss drei Spieler erzeugen | Zwei Spieler in G |
| T16 | `InitializeGame` mit `setupData.expansions.exp01 = true` muss EXP-01 aktivieren | Flag false |
| T17 | Echter Client: Pending platzieren und bisherigen politischen Noop ausführen; nächster Zug beginnt mit Ziehen | ExactlyOnePoliticalAction, Turn 3, kein Pending |
| T18 | Board-Einfügung `z-resort`, `a-resort`; Settlement muss in ID-Reihenfolge `a-resort`, `z-resort` produzieren | Einfügereihenfolge |
| T19 | Nach `placeTile` Zustand über JSON speichern/laden; Hash muss gleich bleiben | Unterschiedliche SHA-256-Werte wegen `pending: undefined` |

## Alle acht Erweiterungskombinationen

Die Setup-Diagnose verwendet das direkte Factory-Setup; S01 gilt zusätzlich für die wirkliche Engine. Tile-Zahlen zählen `allTiles` einschließlich Start Committee, also einen mehr als den initialen DrawPile. Soll aus CORE-01-02-10 bis -16; EXP-01-03-07; EXP-02-03-03/-04; EXP-03-02-A-02A und EXP-03-03-04. Deckzahlen aus EXP-01-08, EXP-02-08 und EXP-03-03-02C/-02D.

| Konfiguration | Tiles Soll / Ist | Zusatzressorts Soll / Ist | Deckkarten Soll / Ist (01,02,03) | Setup-Teilprüfung |
| --- | --- | --- | --- | --- |
| CORE | 72 / 72 | keine / keine | 0,0,0 / 0,0,0 | bestanden |
| CORE + 01 | 78 / 72 | ECO / ECO | 10,0,0 / 8,0,0 | fehlgeschlagen |
| CORE + 02 | 74 / 72 | SEC / keine | 0,15,0 / 0,0,0 | fehlgeschlagen |
| CORE + 03 | 77 / 72 | CLM / keine | 0,0,10 / 0,0,0 | fehlgeschlagen |
| CORE + 01 + 02 | 80 / 72 | ECO, SEC / ECO | 10,15,0 / 8,0,0 | fehlgeschlagen |
| CORE + 01 + 03 | 83 / 72 | ECO, CLM / ECO | 10,0,13 / 8,0,0 | fehlgeschlagen |
| CORE + 02 + 03 | 79 / 72 | SEC, CLM / keine | 0,15,10 / 0,0,0 | fehlgeschlagen |
| CORE + 01 + 02 + 03 | 85 / 72 | ECO, SEC, CLM / ECO | 10,15,13 / 8,0,0 | fehlgeschlagen |

Deaktivierte Erweiterungen erzeugen in den eingesehenen Setup-Zuständen keine betreffenden Slices. Aktives EXP-02/EXP-03 erzeugt nur `__boot`. Bestandene CORE-Setup-Teilprüfung bedeutet keine CORE-Regelkonformität. Diese Diagnosen ersetzen nicht die acht Interaktionssuiten für Kosten-, Produktions-, Blockade- und Klima/Regulation-Stapelung nach AGENTS 5.4.

## Zuordnung sämtlicher DD-0017-Entscheidungen

| Regelbefund | Implementierungsstand | Softwarebefunde |
| --- | --- | --- |
| R01 Lobbyist | Präsenz statt Kontrolle, Ausschlüsse fehlen, zweiter Mehrheitspfad | S06 |
| R02 Grassroots | Konvertierungsaktion und aktiver Ressorttausch fehlen | S03, S05 |
| R03 Bewegungskontext | Board-Bewegung/Regulationsoperationen fehlen; ContextCoord nicht allgemein kanonisch hergeleitet | S03, S13, S14 |
| R04 Bank | Nullstart vorhanden; aktive Resolverregistry und Banktransfers fehlen | S05 |
| R05 Letzter Zug | Finaler Ablauf/Wertung fehlen | S02, S09 |
| R06 Hotspot | Geometrische Erkennung vorhanden; persistenter Verbrauch/ID-Ordnung fehlen | S08 |
| R07 Draw/Recycling | Pending vorhanden; bezahlbare Legalität, Zone, Recycling/Terminalausgänge fehlen | S04, S09, S18 |
| R08 Rechte/Nullmehrheit | Aktionen/Kontrollrechte fehlen; Nullmehrheit erzeugt Noise | S03, S06, S07 |
| R09 Markt | Teil-Lifecycle vorhanden; Slots, Play-Refill und Fehlerweitergabe fehlen | S04, S11 |
| R10 Gemeinsame Maßnahmen | Nur EXP-01, keine globalen Limits/Flags und unabhängigen anderen Decks | S10, S12 |
| R11 Klimakarten-Eligibility | Kein Climate-Deck/Setup-Filter | S10 |
| R12 SEC-Zugang | Durch R02 normativ geklärt, aber SEC-Registry und Konvertierung fehlen | S03, S10 |
| R13 Spätere Trigger | Registrierung und spätere Fenster fehlen | S13 |
| R14 Apparatus | Tile/Aktion/Competence-Conflict-Folgeoperation fehlen | S10, S14 |
| R15a Kosten/Payer | Nur AddResources-Kostenteil, keine korrekte Auflösungsherkunft | S05, S07, S13 |
| R15b Settlement | Board-Schleife ohne registrierte Operationen/ID-Ordnung | S02, S13 |
| R15c Kein legaler Slot | Unvollständige Enumeration, freiwilliger Noop statt Pflichtabschluss | S03, S04, S15 |
| R16 SecurityLevel | Outputklassen und bezahlter Nulloutput fehlen | S07, S14 |
| R17a Instanzen | Kartenbuchhaltung vorhanden; unabhängige Effektinstanzen fehlen | S13 |
| R17b Ordnung/Atomarität | Triggerordnung, Registrierung und Gesamtzahlungsplan fehlen | S04, S05, S13 |
| R18 Countdown reserviert | Kein Countdown-State; positives EXP-03-Setup und Deckfilter fehlen | S10, S14 |
| R19 Empfängerlimit | Supply-Chain-Limit nach regulären Anteilen fehlt | S07, S14 |
| R20 Komponenten | Erweiterungstiles und 5–6-Ergänzungen fehlen | S10, S18 |
| R21 Investment Program | Tile/Kontrolle/alternative Grassroots-Zahlung fehlen | S03, S10 |
| R22 Supplemental Budget | M10 fehlt im Deck; Zahlungsersetzung fehlt | S10, S13, S14 |
| R23 Influence-Unterdrückung | Greenwashing/Protest und feste Ersatzgebühr fehlen | S14 |
| R24a Herkunft | Statische Climate-/Kostenquellen und Komponentenarten fehlen | S13, S14 |
| R24b Schutzumfang | Waiver → Budget → Pact, Originalzahler und Schutzgrenzen fehlen | S13, S14 |
| R25a Uhr | Vollständige Zug-/Rundengrenzen und Dauerverarbeitung fehlen | S02, S12, S13 |
| R25b Produktion | Nur Basisausgabe/Hookfolge; Stufen und Limits unvollständig | S06, S07, S14 |
| R26 Anker | Normative Texte bereinigt; produktive Anker/Platzhalter separat nacharbeiten | S19 |

## Umsetzung und Abschlusskriterium

Die gestufte Behebung mit dauerhaften Tests steht in [Task 0030](../tasks/0030_rules_conformity_implementation.md): zuerst echte Engine-Integration und gemeinsame Grundlagen, danach vollständiges CORE, Maßnahmen-/Zeitmodell, Erweiterungen und abschließend alle Kombinationen samt echten Replays.

Der Softwareabgleich ist dokumentiert; Implementierung und Konformitätsnachweis bleiben offen. Es wurde keine allgemeine Codefreigabe erteilt. Echte neue Regelambiguitäten wären weiterhin nach AGENTS 0.6 separat vorzulegen; dieses Audit erzeugt keine neue Regelentscheidung.
