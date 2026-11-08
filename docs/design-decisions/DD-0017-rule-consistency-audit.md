# DD-0017 — Regelkonsistenzprüfung CORE und Erweiterungen

Prüfdatum: 2026-11-07
Diskussionsentwürfe R01–R15 ergänzt: 2026-11-07
R26 freigegeben; Regelprüfung abgeschlossen: 2026-11-08
Status: Accepted — alle 26 Befunde geklärt; R01–R11 und R13–R26 normativ übernommen, R12 durch R02 geklärt; Softwareabgleich ausstehend

## Umfang und Methode

Geprüft wurden ausschließlich die Spezifikationen dieses Repositorys:

- `docs/rules/000-core.md` — CORE v1.0.14, VAR-01 und ADD56-01.
- `docs/rules/001-expansion01.md` — EXP-01 v1.3.
- `docs/rules/002-expansion02.md` — EXP-02 v1.0.
- `docs/rules/003-expansion03.md` — EXP-03 v1.0.
- `docs/rules/notation.md` — informativ.

Bestehende DD-0003 und DD-0016 wurden als Kontext gelesen. Sie ersetzen keine fehlenden normativen Spielregeln. Quellcodekonformität ist nicht Gegenstand dieser Prüfung.

CORE-01-10 wurde zuerst angewendet: Spezifische Regeln können allgemeine Aussagen übersteuern; Notation ist nicht normativ. Deshalb unterscheidet der Bericht offene Entscheidungen, auslegbare Textspannungen und bereits bestimmte, aber auffällige Designfolgen. R01–R11, R13–R14 und R15a/R15b wurden am 2026-11-07 vom Nutzer bestätigt und über ERRATA-0001 bis -0015 in die betroffenen Regeln übernommen. R15c wurde am 2026-11-08 separat bestätigt und über ERRATA-0016 übernommen. R16 wurde am selben Tag bestätigt und über ERRATA-0017 übernommen. R17a wurde ebenfalls am 2026-11-08 bestätigt und über ERRATA-0018 übernommen; R17b wurde anschließend separat bestätigt und über ERRATA-0019 übernommen. R18 wurde am 2026-11-08 bestätigt und über ERRATA-0020 übernommen. R19 wurde am selben Tag bestätigt und über ERRATA-0021 übernommen. R20 wurde am 2026-11-08 bestätigt und über ERRATA-0022 übernommen. R21 wurde anschließend am selben Tag bestätigt und über ERRATA-0023 übernommen. R22 wurde am 2026-11-08 bestätigt und über ERRATA-0024 übernommen. R23 wurde am selben Tag bestätigt und über ERRATA-0025 übernommen. R24a wurde anschließend am 2026-11-08 bestätigt und über ERRATA-0026 übernommen. R24b wurde am selben Tag separat bestätigt und über ERRATA-0027 übernommen. R25a wurde am 2026-11-08 ausdrücklich bestätigt und über ERRATA-0028 übernommen. R25b wurde anschließend mit „passt“ bestätigt und über ERRATA-0029 übernommen. R26 wurde am 2026-11-08 mit „ja“ bestätigt und über ERRATA-0030 übernommen. R12 ist durch den freigegebenen Erwerb aktiver Erweiterungsressourcen bei Grassroots geklärt. Alle 26 erfassten Befunde sind damit entschieden. Frühere Vermerke über damals offene Teilpunkte in Befundhistorie/Errata dokumentieren ihren jeweiligen Beschlussstand; maßgeblich für den Abschluss sind diese Statusmatrix und die konsolidierten normativen Texte. Die ursprünglichen Befunde bleiben als Prüfverlauf erhalten.

Prioritäten:

- **P1:** Vor Umsetzung der betroffenen Mechanik entscheiden; Ablauf oder Ergebnis ist nicht vollständig bestimmt.
- **P2:** Erreichbarkeit, Zusammenspiel oder beabsichtigtes Verhalten klären.
- **P3:** Redaktion und Referenzierbarkeit bereinigen.

## Übersicht

| ID | Priorität | Thema | Art |
| --- | --- | --- | --- |
| R01 | P1 | Empfänger des Lobbyistenbonus | Angenommen; Regeltext korrigiert, Codeanpassung ausstehend |
| R02 | P1 | Grassroots-Kartentexte | Angenommen; Regeltext ergänzt, Codeanpassung ausstehend |
| R03 | P1 | ContextTile bei Bewegungen | Angenommen; CORE/EXP-02 ergänzt, Codeanpassung ausstehend |
| R04 | P1 | Ressourcen beim Setup | Angenommen; Anfangsbestand und Bank definiert, Codeanpassung ausstehend |
| R05 | P1 | Letzte Runde und Spielende | Angenommen; letzter Zug und finales Settlement definiert, Codeanpassung ausstehend |
| R06 | P1 | Hotspot-Reihenfolge und Wiederholung | Angenommen; Reihenfolge und Einmaligkeit definiert, Codeanpassung ausstehend |
| R07 | P1 | Fehlgeschlagene Platzierung und Recycling | Angenommen; DrawResolution und endliche Wiederholungen definiert, Codeanpassung ausstehend |
| R08 | P2 | Eigentum, Aktivierungsrechte und Nullgleichstand | Angenommen; Eigentum, Kontrolle und positive Gleichstandsproduktion definiert, Codeanpassung ausstehend |
| R09 | P1 | TakeMeasure und Nachfüllen | Angenommen; Erwerb, Nachfüllen und Recycling definiert, Codeanpassung ausstehend |
| R10 | P1 | Maßnahmen ohne EXP-01 und gemeinsame Limits | Angenommen; gemeinsame Aktivierung und globale Limits definiert, Codeanpassung ausstehend |
| R11 | P2 | ECO-Kosten in eigenständigem EXP-03 | Angenommen; Setup-Filter für vier Karten definiert, Codeanpassung ausstehend |
| R12 | P1 | Zugang zu SEC | Erwerbspfad durch R02 geklärt; Bankmodell durch R04 festgelegt |
| R13 | P2 | Maßnahmen ohne nutzbares Zeitfenster | Angenommen; künftige Auslöser und Settlement-Wirkung definiert, Codeanpassung ausstehend |
| R14 | P1 | Authority Apparatus und Competence Conflict | Angenommen; Aktivierung und nachgelagerte Control-Platzierung definiert, Codeanpassung ausstehend |
| R15 | P1 | Kosten automatischer Effekte, Settlement und Aktionsausfall | R15a/R15b/R15c angenommen; Codeanpassung ausstehend |
| R16 | P1 | SecurityLevel auf nichtnumerische Effekte | Angenommen; Codeanpassung ausstehend |
| R17 | P1 | Langfristige Maßnahmen und Atomarität | R17a/R17b angenommen; Codeanpassung ausstehend |
| R18 | P2 | Countdown ohne Platzierungseffekt | Angenommen: reserviert, M14/M15 ausgeschlossen; Codeanpassung ausstehend |
| R19 | P1 | Empfängerlimit bei Produktion | Angenommen: Limit nach Anteilsberechnung, Kürzung bleibt in Bank; Codeanpassung ausstehend |
| R20 | P1 | Komponentenbestand EXP-01 und CLM für 5–6 | Angenommen: Sondertiles je einmal, CLM-Zusatz W1/W2; Codeanpassung ausstehend |
| R21 | P1 | Investment Program und ConvertResources | Angenommen: alternative Grassroots-Konvertierung, ein ContextTile; Codeanpassung ausstehend |
| R22 | P1 | Supplemental Budget nach Bezahlung | Angenommen: Vorabersetzung im Zahlungsplan; Codeanpassung ausstehend |
| R23 | P1 | Influence erzeugen oder verschieben | Angenommen: Operationsumfang und Greenwashing-Ersatzpreis; Codeanpassung ausstehend |
| R24 | P1 | Definition eines Climate effect und Schutzumfang | R24a/R24b angenommen; Codeanpassung ausstehend |
| R25 | P2 | Zeitbegriffe und Overlay | R25a/R25b angenommen; Codeanpassung ausstehend |
| R26 | P3 | Regel-IDs und Fremdtext | Angenommen und redaktionell bereinigt; Anker und Verweise geprüft |

## Einzelbefunde

### R01 — Lobbyistenbonus: angenommen und normativ übernommen

**Stellen:** CORE-01-02-08; CORE-01-05-03A; CORE-01-05-04 bis -06.

**Ursprünglicher Befund:** Jeder benachbarte Lobbyist steuerte +1 virtuelle Influence bei, ohne die Zuordnung zu einem Spieler zu definieren. Weder Eigentum am Lobbyisten noch eine Bindung an dessen Kontrolle war festgelegt. Keine spezifischere Regel schloss diese Lücke.

**Beispiel:** A hat 1 Influence auf einem ResortTile, B hat dort 0. B kontrolliert einen benachbarten Lobbyisten. Ob dessen Bonus B, A oder allen Spielern zugerechnet wird, bleibt offen. Bei einer Bindung an Kontrolle können gegenseitig benachbarte Lobbyisten zudem rekursive Mehrheitsabhängigkeiten erzeugen.

**Angenommene Regelentscheidung:** Der Controller eines Lobbyisten erhält dessen Bonus. Lobbyisten erhalten selbst keine virtuellen Lobbyistenboni; auf ihnen zählt deshalb ausschließlich reale Influence. Ein unkontrollierter Lobbyist exportiert keinen Bonus. Jeder kontrollierte Lobbyist gibt seinem Controller +1 virtuelle Influence auf jedes benachbarte Tile außer Lobbyisten und Start Committee. Boni mehrerer Lobbyisten addieren sich; reale Marker auf dem Empfänger-Tile sind dafür keine Voraussetzung.

**Begründung:** Es bleibt eine einzige kanonische Mehrheitsberechnung. Die angenommene Ausnahme für Lobbyisten verhindert rekursive Abhängigkeiten, ohne eine zweite, vom Kontrollstatus abweichende Bonusberechtigung einzuführen. Die Start-Committee-Ausnahme bestand bereits; der Ausschluss benachbarter Lobbyisten und der Bonusempfänger sind hiermit freigegebene Festlegungen.

**Normative Übernahme:** `docs/rules/000-core.md`, CORE-01-05-04 bis -09 einschließlich -06A. Änderungshistorie: `docs/rules/ERRATA-0001-lobbyist-bonus.md`. Bestehende Regel-IDs bleiben erhalten.

**Beispiele zur späteren Verifikation:** A kontrolliert einen Lobbyisten mit 2:1 realen Markern. Auf einem benachbarten Resort stehen A=0, B=1: mit Bonus entsteht 1:1, also keine Kontrolle. Ein zweiter von A kontrollierter Lobbyist macht daraus 2:1. Bei 1:1 auf dem Lobbyisten selbst wird kein Bonus exportiert. Zwei benachbarte Lobbyisten verändern ihre gegenseitige Kontrolle nicht. Der Bonus wirkt auf alle benachbarten Hotspots/Resorts gleichzeitig; er wird nicht verteilt oder verbraucht.

**Freigabe:** Nutzerbestätigung „ja passt“ am 2026-11-07 auf den vorgestellten R01-Lösungsansatz einschließlich des Ausschlusses zwischen Lobbyisten. Diese Bestätigung betrifft ausschließlich R01. Die Softwareanpassung erfolgt separat; dieser Schritt bearbeitet ausschließlich die Regelunterlagen.

### R02 — Grassroots-Tauschregel: angenommen und normativ übernommen

**Stellen:** CORE-01-02-14; CORE-01-04-20 bis -22; ADD56-01-01-13.

**Ursprünglicher Befund:** ConvertResources bezog Kosten und Wirkung ausschließlich aus dem jeweiligen Tile-Text. Die Spezifikationen enthielten weder diese Texte noch eine Verteilung der acht beziehungsweise zehn Grassroots auf Umtauschregeln. Damit war keine konkrete CORE-Konvertierung normativ vollständig beschrieben.

**Normative Übernahme:** CORE-01-02-14A, CORE-01-04-22A bis -22E und ADD56-01-01-13A in `docs/rules/000-core.md`; Änderungshistorie in `docs/rules/ERRATA-0002-grassroots-conversion.md`. Bestehende IDs und Stückzahlen bleiben erhalten.

**Angenommene Regelentscheidung:** Alle acht Grassroots bieten denselben Tausch: drei Ressourcen desselben aktiven Ressorts gegen eine Ressource eines anderen aktiven Ressorts. Eine Political Action führt genau einen Tausch aus, sofern keine ausdrückliche Ausnahme gilt. Für 5–6 kommen zwei identische Tiles hinzu. Kosten gehen an Bank, Output kommt aus Bank; Zusatzkosten werden separat addiert und ändern nicht die drei gleichen Basisressourcen. Aktive Erweiterungsressourcen sind als Ein- und Ausgabe eingeschlossen.

**Warum 3:1:** Der ausdrücklich definierte 2-ECO-zu-1-Tausch des Investment Program behält dadurch einen Vorteil. Ein allgemeiner 2:1-Tausch würde diesen Vorteil bei gleicher Einbettung beseitigen. Die Quote 3:1 ist eine freigegebene Designentscheidung, keine rekonstruierte Originalregel und noch nicht durch Spieltests validiert. Die genaue Einbettung des Investment Program wurde anschließend unter R21 freigegeben.

**Beispiel:** 3 DOM → 1 FOR im CORE-Spiel; mit EXP-02 auch 3 DOM → 1 SEC. Damit ist der in R12 fehlende Erwerbspfad normativ definiert. Ohne EXP-02 ist SEC weder Ein- noch Ausgabeoption. Ein Aufschlag von 1 INF ergibt 3 DOM + 1 INF → 1 FOR und erlaubt nicht, die Basis mit 2 DOM + 1 INF zu bezahlen.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf die vorgestellte einheitliche 3:1-Regel einschließlich aktiver Erweiterungsressourcen. Die Kontrollfrage bleibt separat unter R08; das Bankmodell unter R04. Der Game-Code wurde hier nicht angepasst.

### R03 — ContextTile-Zuordnung: angenommen und normativ übernommen

**Stellen:** CORE-01-04-12; CORE-01-06-00-05 und -06; EXP-02-02-F-01; EXP-02-08-M03-03 und M04-03.

**Ursprünglicher Befund:** Influence- und Regulation-Bewegungen referenzierten Quelle und Ziel, ohne den ContextTile ausdrücklich festzulegen. CORE-01-06-00-06 erklärte solche Mehrfachreferenzen für ungültig. Die allgemeine Zielzuordnung in -05(b) beseitigte diese spezielle Anforderung nicht eindeutig.

**Normative Übernahme:** CORE-01-06-00-05A und -05B sowie EXP-02-02-D-03, EXP-02-02-E-03, EXP-02-02-F-04, EXP-02-04-A-07 und EXP-02-05-04/-05. Änderungshistorie: `docs/rules/ERRATA-0003-movement-context.md`. Bestehende IDs bleiben erhalten.

**Angenommene Zuordnung:**

| Vorgang | ContextTile | Weitere ausdrückliche Prüfung |
| --- | --- | --- |
| Influence platzieren oder bewegen | Ziel-Tile | Eigentümerregel gesondert R08; Quelle muss den Marker enthalten. |
| Regulation durch Maßnahme platzieren | Ziel-Tile | Zulässiger Regulation-Typ auf dem Ziel. |
| Regulation durch Maßnahme bewegen | Ziel-Tile | Quelle enthält die Regulation; Surveillance kann das Verlassen der Quelle ausdrücklich verbieten. |
| Regulation durch Maßnahme entfernen | Bisheriges Träger-Tile | Dortige Entfernungsverbote. |
| Apparatus aktivieren | Authority Apparatus | Quell-/Ziel-Tiles bleiben Parameter; ihre ausdrücklichen Bewegungs-/Entfernungsrestriktionen gelten zusätzlich. |

**Begründung:** Lokale Effektmodifikatoren benötigen genau einen Ort. Eine ausdrücklich auf einem Objekt liegende Bewegungsrestriktion ist eine zusätzliche Zulässigkeitsprüfung, kein zweiter ContextTile. Die Apparatus-Aktivierung wird einmal auf ihrem Aktivierungs-Tile reguliert; die eingebettete Bewegung/Entfernung erhält keine zweite lokale Modifikatorprüfung an Quelle oder Ziel. Zulässige Regulation-Typen am Ziel und ausdrückliche Objektverbote bleiben zu prüfen.

**Beispiel:** Influence von einem blockierten Quell-Tile auf ein freies Ziel bewegen ist nach der freigegebenen Regel erlaubt: Blockade verhindert dortige Effektausführung, ist allein aber kein Verlassensverbot. Ein blockiertes Ziel verhindert die Bewegung. Surveillance auf einer Regulation-Quelle verhindert deren Bewegung auch bei freiem Ziel.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf die vorgestellte Zuordnung einschließlich Apparatus-Ausnahme und erlaubtem Verlassen einer Blockade. Eigentümerrechte sind inzwischen durch R08 geklärt; Apparatus-Aktivierung R14 ist inzwischen angenommen; Output-Semantik R16 ist inzwischen angenommen. Game-Code wurde hier nicht angepasst.

### R04 — Ressourcenstart und Bankmodell: angenommen und normativ übernommen

**Stellen:** CORE-01-00-04; CORE-01-03-01 bis -06; CORE-01-06-12; EXP-03-08-M03-05.

**Ursprünglicher Befund:** Setup wies Influence zu, aber keine Ressourcenbestände für Bank, Noise und PersonalSupply. Produktion verschob vorhandene Objekte aus der Bank, ohne einen unbegrenzten Vorrat, Tokenzahlen oder Bankmangelverhalten festzulegen.

**Ursprüngliches Beispiel:** W5 soll fünf Ressourcen auszahlen, die Bank enthält drei. Teilproduktion, vollständiges Scheitern und Neuerzeugung ergaben unterschiedliche mögliche Zustände.

**Normative Übernahme:** CORE-01-00-04A bis -04D und CORE-01-03-07/-08 in `docs/rules/000-core.md`; Änderungshistorie in `docs/rules/ERRATA-0004-resource-bank.md`. Bestehende IDs bleiben erhalten.

**Angenommene Regelentscheidung:** Alle Spieler beginnen mit 0 Ressourcen, Noise ist leer. Bank stellt für jedes aktive Ressort einen unerschöpflichen Vorrat bereit. Setup erzeugt keine Bank-Ressourcenobjekte vorab; bei einem vorgeschriebenen Transfer entstehen genau die fehlenden Objekte in Bank und werden atomar von dort transferiert. Jede existierende Ressource bleibt stets in genau einer Zone; deaktivierte Ressorts besitzen keine Objekte oder Zähler. Die Bank bezahlt keine Kosten für Spieler.

**Begründung:** So wird keine zusätzliche Bankknappheitsmechanik eingeführt, für die bislang jede Verteilungsregel fehlt. Bezahlen führt weiter nach Bank; Produktion und ausdrücklich erlaubte Gewinne kommen weiter aus Bank. In einem deterministischen Softwaremodell darf die Bereitstellung weder Zeit noch ungesetzte Zufallswerte verwenden.

**Beispiel:** Ein W5 liefert bei unmodifiziertem Alleincontroller genau fünf Ressourcen, unabhängig von vorherigen Zahlungen. Es gibt keine teilweise Auszahlung wegen Tokenmangels. Enthält Bank bereits zwei passende Objekte, werden nur drei weitere bereitgestellt. Ein Spieler mit zwei DOM kann trotzdem keine Kosten von drei DOM bezahlen.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf den Ressourcenstart ohne Spielerressourcen, leeres Noise und den unbegrenzten Bankvorrat aktiver Ressorts. Der Game-Code wurde hier nicht angepasst. Kostenpflicht und Zahler automatischer Effekte bleiben R15.

### R05 — Letzter Zug und finales Settlement: angenommen und normativ übernommen

**Stellen:** CORE-01-04-04 bis -07; CORE-01-07-01 bis -03; CORE-01-09-01 und -02.

**Ursprünglicher Befund:** Das Spiel endete laut Text bei erschöpftem Stapel, zugleich erst nach einem finalen Settlement. Dessen Eintritt bei Stapelerschöpfung mitten in der Runde und die letzte Political Action waren nicht vollständig festgelegt. Spezifität allein bestimmte die fehlenden Phasen nicht.

**Ursprüngliches Beispiel:** A zieht als erster von drei Spielern das letzte Tile. Zugende nach Platzierung, nach A's Aktion und weitere Züge ohne Tile waren unterschiedliche mögliche Auslegungen; auch das Verwerfen des letzten Tiles war nicht abschließend geregelt.

**Normative Übernahme:** CORE-01-07-01A und CORE-01-09-01 bis -02 einschließlich -01A/-01B/-01C; Änderungshistorie in `docs/rules/ERRATA-0005-final-turn.md`. Bestehende IDs bleiben erhalten.

**Angenommener Ablauf:**

1. Der erfolgreiche letzte Draw beendet das Spiel noch nicht. Tile-Platzierung, dadurch ausgelöste Hotspots und die gesamte Political-Action-Sequenz dieses Zuges werden abgeschlossen, einschließlich einer durch PlayMeasure gewährten Zusatzaktion.
2. Danach beginnt genau ein finales Settlement. Ein am regulären Rundenende ohnehin anstehendes Settlement ist dasselbe Ereignis und wird nicht zusätzlich wiederholt.
3. Nach Abschluss aller hierfür zulässigen Settlement-Effekte wird gewertet; kein weiterer Spielerzug beginnt.
4. Wird DrawPile durch erfolglose Draw-/Discard-Versuche geleert, bevor ein Tile platziert wurde, entfällt die Political Action dieses begonnenen Zuges. Das finale Settlement folgt unmittelbar.

**Beispiel:** A zieht als erster von drei Spielern das letzte platzierbare Tile. A platziert, löst Hotspots auf und beendet seine Aktion; dann finales Settlement und Wertung. B und C erhalten keinen zusätzlichen Zug ohne Tile. Wird das letzte Tile stattdessen verworfen, gibt es auch für A keine Political Action.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf den vorgestellten Abschluss einschließlich einer nur teilweise gespielten Runde und des erfolglosen Leerziehens ohne Political Action. Keine zusätzlichen Spielerzüge zum Ausgleich der Zuganzahl. Anwendbare Settlement-Effekte enden vor Wertung; neue-Runde-Trigger starten nicht mehr. Die interne Settlement-Reihenfolge und Effektlaufzeiten bleiben R15/R25. Game-Code wurde hier nicht angepasst.

### R06 — Hotspot-Auflösung und Einmaligkeit: angenommen und normativ übernommen

**Stellen:** CORE-01-06-01 bis -07; CORE-01-06-00-02 und -03; EXP-01-08-M01; EXP-02-04-C-03; notation.md §6.1.

**Ursprünglicher Befund:** CORE-01-06-04 bestimmte erst Mehrheit, danach „before majority resolution“-Effekte, dann Mehrheitsergebnis und zuletzt Verbote/Modifikatoren. Reine Ergebnisberechnung und Markerplatzierung waren nicht ausdrücklich getrennt; Blockade musste eine Zustandsänderung zuverlässig vorher verhindern.

Die ursprüngliche normative Fassung legte außerdem Einmaligkeit und späteres Nachholen nicht eindeutig fest. „Resolve once“ stand nur in der informativen Notation. Budget Compromise, Blockade und leere PersonalSupply machten diese Lücke sichtbar.

**Normative Übernahme:** CORE-01-02-09, CORE-01-06-02A bis -05 einschließlich -03A/-04A, EXP-01-08-M01-06 und EXP-02-04-C-04. Änderungshistorie: `docs/rules/ERRATA-0006-hotspot-resolution.md`. Bestehende IDs bleiben erhalten.

**Angenommener Ablauf:** Erstmaliges vollständiges Einschließen erzeugt genau ein Hotspot-Ereignis. Es öffnet ein Fenster für bereits aktive, ausdrücklich passende Vorab-Effekte, bestimmt danach die Mehrheit und prüft anschließend Verbote, Kosten und Output, bevor der erlaubte Ausgang atomar ausgeführt wird. Die normale Auszahlung transferiert einen vorhandenen Marker aus PersonalSupply; besondere Tile-Texte behalten ihren abweichenden Ausgang. Das Vorabfenster erlaubt nicht automatisch, eine neue Karte aus der Hand zu spielen; R13 bleibt separat zu lösen.

**Einmaligkeit:** Nach diesem Ereignis wird der Hotspot als abgearbeitet vermerkt, auch bei Gleichstand, Blockade, Budget Compromise oder fehlender Influence in PersonalSupply. Es gibt kein Nachholen. Der Ereignisvermerk ist ausdrücklich von der atomaren Auszahlung getrennt: Eine gescheiterte Auszahlung macht keine anteiligen Auszahlungsänderungen, verbraucht aber das einmalige Ereignis. Die freigegebene Ausnahme ist nun in CORE-01-06-04A verankert.

**Beispiel:** Ein mit Budget Compromise belegter Hotspot wird eingeschlossen. Er zahlt in diesem Moment nichts aus und bleibt auch nach Ablauf der Maßnahme abgearbeitet. Ein späterer Markerzug oder eine weitere benachbarte Tile-Platzierung löst ihn nicht erneut aus. Betroffene Hotspots ohne verfügbare PersonalSupply-Influence erzeugen keine neue Influence.

**Mehrere gleichzeitige Einschließungen:** Ereignisse nach aufsteigender ordinal-lexikografischer Reihenfolge der vor Spielstart vergebenen, eindeutigen und unveränderlichen Tile-IDs ordnen und nacheinander vollständig abarbeiten; Vorabfenster und Mehrheit jeweils am dann aktuellen Zustand bestimmen. Keine zufällige oder UI-abhängige Reihenfolge.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf Einmaligkeit, feste Tile-ID-Reihenfolge und dauerhaften Ausfall einer unterdrückten Auszahlung. Die daraus folgende dauerhafte Vereitelung durch Budget Compromise wurde ausdrücklich zur Entscheidung gestellt und angenommen. R13, R15 und R16 sind inzwischen angenommen; Game-Code wurde hier nicht angepasst.

### R07 — DrawResolution und Recycling: angenommen und normativ übernommen

**Stellen:** CORE-01-00-01 und -05; CORE-01-04-04 bis -08; VAR-01-01-04 bis -06; EXP-03-08-M12-04 und -05.

**Ursprünglicher Befund:** Der Zonenvertrag kannte nur DrawPile, Board und DiscardFaceUp. Für ein gezogenes, noch nicht platziertes Tile fehlte eine explizite Zone oder Reservierung im DrawPile; VAR-01 sprach dennoch von „draw resolution“.

Unbezahlbare Platzierung durch Extreme Weather Event hatte keine vollständige Anschlussregel. Recycling konnte ausschließlich unplatzierbare Tiles unbegrenzt zurückmischen; auf endlichen Topologien war das auch ohne Klima möglich.

**Normative Übernahme:** CORE-01-00-05/-05A, CORE-01-03-09, CORE-01-04-04 bis -08A einschließlich -05A/-05B, CORE-01-09-01B, VAR-01-01-02 bis -08 einschließlich -04A und EXP-03-08-M12-06. Änderungshistorie: `docs/rules/ERRATA-0007-draw-and-recycling.md`. Bestehende IDs bleiben erhalten.

**Angenommene Regelentscheidung:** Die Zone DrawResolution startet leer und hält höchstens das aktuell gezogene Tile. Erfolgreiche Platzierung verschiebt es nach Board; Verwerfen nach DiscardFaceUp, geometrisches Scheitern mit Recycling zurück nach DrawPile. DrawPile-Leere allein zählt nicht als Abschluss, solange ein Tile in DrawResolution noch aufgelöst wird (R05).

**Kostenbedingtes Scheitern:** Gibt es trotz geometrischer Möglichkeit keine vollständig bezahlbare legale Platzierung, wird das Tile offen verworfen und neu gezogen. Bei mindestens einer bezahlbaren legalen Option darf der Spieler nicht stattdessen freiwillig verwerfen. Kostenbedingtes Verwerfen gilt ausdrücklich auch bei TileRecycling. Fehlgeschlagene Platzierung bezahlt keine Kosten.

**Geometrisches Scheitern mit Recycling:** Betroffene Tiles zurückgeben und mit der gesetzten Zufallsfolge mischen. Während derselben DrawAndPlaceTile-Phase darf jedes physische Tile höchstens einmal geprüft werden; der nächste Versuch nimmt das erste noch nicht geprüfte Tile in der aktuellen Stapelreihenfolge. Bereits geprüfte Tiles bleiben übersprungen im Stapel. Sind alle verbliebenen Tiles geometrisch unplatzierbar, endet die Draw-Phase als dauerhaft erschöpft und führt nach R05 ohne Political Action ins finale Settlement, obwohl die zurückgegebenen Tiles im DrawPile bleiben.

**Beispiele:** Ein Spieler ohne CLM/DOM zieht unter Extreme Weather ein ResortTile. Es wird ohne Zahlung verworfen, dann wird ein weiteres Tile gezogen. Ein danach gezogenes Committee ohne Platzierungsaufschlag kann normal platziert werden. Besteht der Reststapel nur aus unbezahlbaren ResortTiles, wird er endlich leergezogen. Bei geometrisch vollständig geschlossener endlicher Topologie beendet die begrenzte Prüfung das Recycling, ohne Endlosschleife.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf DrawResolution, Pflicht zur bezahlbaren legalen Platzierung, endliche Wiederholungen und die ausdrücklich hervorgehobene Ausnahme des Verwerfens trotz Recycling. TileRecycling schützt damit geometrisch unplatzierbare Tiles, nicht wegen Klimakosten unbezahlbare Tiles. Game-Code wurde hier nicht angepasst.

### R08 — Eigentum, Aktivierungsrechte und Nullgleichstand: angenommen

**Stellen:** CORE-01-04-11 bis -22; CORE-01-05-02 und -03A; CORE-01-06-13 bis -16; CORE-01-08-04 bis -06B.

**Ursprünglich wörtlich auslegbare Designfolgen:** Diese Punkte waren keine automatisch ergänzbaren Verbote:

- Place nannte den aktiven Spieler; Move beschränkte den Eigentümer des bewegten Markers nicht. „Nur eigene Marker bewegen“ war nicht belegt.
- FormalizeInfluence und ConvertResources verlangten ein passendes Tile, aber keine Kontrolle darüber. Eine Kontrollpflicht durfte nicht ohne Entscheidung ergänzt werden.
- Ein Tile mit Gesamtwerten 0:0 erfüllte den allgemeinen Gleichstandsfall. Die spezifische Gleichstandsverteilung konnte die pauschale Nullproduktion ohne Kontrolle übersteuern; ein positiver Mindestwert war nicht angegeben.
- Virtuelle Mehrheit könnte auch beim Start Committee berechnet werden; dessen ausdrückliche Unkontrollierbarkeit ist jedoch die spezifische Ausnahme.

**Normative Übernahme:** CORE-01-04-12, -14A und -21A; CORE-01-05-03B; CORE-01-06-13/-14 und -16(b)/(c); CORE-01-08-07A. Änderungshistorie: `docs/rules/ERRATA-0008-ownership-control-production.md`. Bestehende IDs bleiben erhalten. Dies sind ausdrückliche Designentscheidungen, keine aus Konventionen abgeleiteten Regeln.

**Angenommene Festlegungen:**

| Frage | Angenommene Regel | Designfolge |
| --- | --- | --- |
| Wessen Influence darf Move bewegen? | Nur einen eigenen Marker des aktiven Spielers. | Fremde Marker können durch die gewöhnliche Move-Aktion nicht versetzt werden. |
| Wer darf Standard Committees und Grassroots nutzen? | Der aktive Spieler muss das verwendete Tile kontrollieren, nach der kanonischen Mehrheit einschließlich zulässiger Lobbyistenboni. | Virtuelle Kontrolle genügt; reale eigene Influence auf dem Tile ist nicht zusätzlich nötig. Start Committee bleibt ohne Kontrollpflicht mit seinen bisherigen Sonderkosten, Zeit- und Nutzungslimits nutzbar. |
| Was produziert ein Resort bei höchstem Majority-Wert 0? | Nichts. Gleichstandsverteilung gilt nur bei positivem höchstem Gesamtwert. | Bei 0:0:0 keine Produktion; bei 1:1:0 teilen nur die zwei Führenden, der Rest geht nach Noise. Virtuelle Influence zählt in den Gesamtwerten mit. |

**Beispiele:** A darf B's Marker nicht gewöhnlich bewegen. Kontrolliert A ein Grassroots allein durch Lobbyistenbonus, darf A es nutzen. Ein W5 bei A=1, B=1, C=0 zahlt ohne weitere Modifikatoren A=2, B=2 und Noise=1; bei Gesamtwerten 0:0:0 zahlt es nichts. Ein physisch unbesetztes Tile mit positivem virtuellem Bonus ist kein 0:0:0-Fall.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf alle drei vorgestellten Festlegungen einschließlich virtueller Kontrolle und der Start-Committee-Ausnahme. Der Game-Code wurde hier nicht angepasst.

### R09 — Maßnahmenerwerb und Marktlebenszyklus: angenommen

**Stellen:** EXP-01-02-E-01; EXP-01-03-02 und -03; EXP-01-06-01 bis -04; EXP-01-07-01 bis -05.

**Ursprünglicher Befund:** TakeMeasure existierte und beendete den Zug, ohne Quelle, Auswahl und Zonentransfer zu definieren. Nachfüllzeitpunkt, Transfer des RecyclePile zurück in MeasureDrawPile und vollständige Markterschöpfung waren ebenfalls unvollständig.

**Normative Übernahme:** EXP-01-02-E-01/-01B, EXP-01-03-06, EXP-01-06-04 bis -04D und EXP-01-07-05 bis -05D; EXP-02-07-01A und EXP-03-07-01A wenden diese Verfahren auf ihre jeweils eigenen Zonen an. Änderungshistorie: `docs/rules/ERRATA-0009-measure-market.md`. Bestehende IDs bleiben erhalten.

**Angenommener Ablauf:** TakeMeasure wählt genau eine offene Karte des gewählten aktiven Erweiterungsmarkts und verschiebt sie in die eigene Hand, sofern das geltende Handlimit eingehalten wird. Anschließend wird dieser Markt sofort auf bis zu drei offene Karten aufgefüllt; nach Abschluss endet der Zug. TakeMeasure selbst hat keinen gedruckten Basis-Ressourcenpreis, mögliche ausdrücklich geregelte Zusatzkosten bleiben gesondert anwendbar.

**Nachfüllen und Recycling:** Benötigte Karten kommen nacheinander von oben aus dem zugehörigen MeasureDrawPile. Ist dieser für einen nötigen Draw leer, wird der zugehörige MeasureRecyclePile vollständig in ihn überführt und mit der gesetzten Zufallsfolge gemischt. Play-Counter bleiben unverändert; MeasureFinalDiscard wird nie verwendet. Falls auch Recycle leer ist, bleiben offene Plätze leer. Gibt es keine offene Karte, ist TakeMeasure nicht wählbar. Sind mehrere Plätze frei, erfolgt Nachfüllen in fester Platzreihenfolge.

**Markt wieder zugänglich machen:** Auch nachdem eine gespielte Karte ihren vorgesehenen Recycle-/FinalDiscard-Stapel erreicht, wird der zugehörige Markt auf bis zu drei aufgefüllt, noch vor einer gewährten zusätzlichen Political Action. Sonst könnte ein leerer Markt trotz neu verfügbarer Recycle-Karte dauerhaft unzugänglich bleiben. Das ändert weder die beiden Spielnutzungen noch die gesondert unter R17 zu klärenden aktiven Effektinstanzen.

**Beispiel:** A nimmt eine der drei offenen Karten; genau dieser Platz wird sofort nachgefüllt. Sind Draw und Recycle leer, bleiben zwei offene Karten. Ist der Markt später leer und eine erstmals gespielte Karte gelangt in Recycle, kann sie beim anschließenden Nachfüllen wieder offen erscheinen, weiterhin mit Play-Counter 1. Die zweite Ausspielung schickt sie endgültig in FinalDiscard. Erweiterungsübergreifende Limits und eigenständige Aktivierung bleiben R10.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf den Ablauf einschließlich Nachfüllen nach dem Ausspielen. R10 ist inzwischen angenommen; R17 bleibt offen. Game-Code wurde hier nicht angepasst.

### R10 — Gemeinsames Maßnahmensystem und Limits: angenommen

**Stellen:** EXP-01-06-01 bis -05; EXP-01-10-03; EXP-02-06-01; EXP-02-07-00-01 und -01; EXP-03-06-01 und -02; EXP-03-07-00-01 und -01.

**Ursprünglicher Befund:** EXP-02 erklärte Political Actions gegenüber CORE für unverändert und übernahm ausdrücklich nur den EXP-01-Lebenszyklus. Die separaten Aktionen waren nicht eindeutig importiert. EXP-03 verwendete PlayMeasure ebenfalls ohne notwendiges EXP-01, während EXP-01-10-03 dann sämtliche Measure-Regeln deaktivierte.

Mit mehreren Decks war außerdem nicht ausdrücklich bestimmt, ob Handlimit 2 und einmal PlayMeasure pro Runde insgesamt oder pro Erweiterung galten. Getrennte Zonen entschieden dies nicht.

**Normative Übernahme:** EXP-01-06-00 bis -00B, -01A, -02/-02A, -03 und -05A sowie EXP-01-10-03; EXP-02-06-01/-07-01; EXP-03-06-01/-06-02/-07-01; CORE-01-06-00-01(c). Änderungshistorie: `docs/rules/ERRATA-0010-shared-measures.md`. Die gemeinsamen Definitionen bleiben zentral im bestehenden EXP-01-Dokument, gelten aber ausdrücklich unabhängig vom Aktivierungsflag seiner eigenen Inhalte.

**Angenommene Festlegungen:**

- Das gemeinsame Maßnahmensystem wird bei mindestens einer aktiven Erweiterung mit Maßnahmendeck aktiviert. EXP-02 beziehungsweise EXP-03 benötigen dafür kein aktives EXP-01. Die Verfügbarkeit von TakeMeasure und PlayMeasure folgt diesem gemeinsamen System.
- Handlimit insgesamt zwei Maßnahmen pro Spieler, über alle aktiven Erweiterungen zusammen. Die Karten bleiben dennoch in ihren jeweiligen Erweiterungs-Handzonen.
- Insgesamt höchstens ein PlayMeasure pro Spieler und Runde, unabhängig vom gewählten Deck. Der gemeinsame Rundenverbrauch wird erst zu Beginn der folgenden Runde nach dem Settlement zurückgesetzt; Karten-spezifische Nutzungsflags bleiben davon getrennt.
- Nach PlayMeasure weiterhin genau eine zusätzliche zulässige Political Action, die nicht PlayMeasure sein darf; sie gewährt keine weitere Zusatzaktion. TakeMeasure ist möglich und beendet dann nach Nachfüllung den Zug.
- Das gemeinsame System aktiviert keine Ressourcen, Karten oder Zonen einer deaktivierten Erweiterung. Ohne jedes Maßnahmendeck fehlen gemeinsame Maßnahmenaktionen, Handzonen und Maßnahmen-Nutzungsflags vollständig.

**Beispiel:** A hält eine EXP-01- und eine EXP-03-Karte und darf keine dritte nehmen. Nach dem Ausspielen der EXP-03-Karte darf A in derselben Runde keine EXP-01-Karte mehr spielen. Mit ausschließlich EXP-02 gibt es SEC und das gemeinsame Maßnahmensystem, aber weder ECO noch EXP-01-Karten oder -Zonen.

**Freigabe:** Nutzerbestätigung „passt“ am 2026-11-07 auf das gemeinsame System, Handlimit zwei insgesamt und ein PlayMeasure pro Spieler/Runde über alle Decks. R11 und R13 sind inzwischen angenommen; R17 bleibt offen; Game-Code wurde hier nicht angepasst.

### R11 — ECO-abhängige Klimamaßnahmen: Setup-Filter angenommen

**Stellen:** EXP-01-01-06; EXP-03-Kopf „Requires: CORE-01“; EXP-03-08-M06-02, M09-02, M11-02 und M15-02.

**Ursprünglicher Befund:** Energy Crisis, Technology Initiative, Supply Chain Disruption und Future Committee kosten ECO. Ohne EXP-01 existiert ECO nicht; dennoch wurden alle EXP-03-Maßnahmen ungefiltert ins Deck gemischt.

**Hierarchie:** Die gedruckten Kosten bleiben gültig. Ohne ausdrücklich anwendbaren Kostenersatz sind die ECO-Komponenten bei deaktiviertem EXP-01 nicht bezahlbar; eine implizite Ersetzung ist unzulässig. Eine absolute Aussage, die Karten seien dann immer unspielbar, wäre jedoch zu stark: EXP-02-08-M06-03 erlaubt unter seinen Voraussetzungen die Ersetzung einer Kostenressource durch SEC. Ob ein solcher Ersatz im Einzelfall anwendbar ist, ändert nichts daran, dass der bisherige Aufbau ungefiltert alle Karten enthält.

**Normative Übernahme:** EXP-03-03-02 bis -02C in `docs/rules/003-expansion03.md`; Änderungshistorie in `docs/rules/ERRATA-0011-climate-deck-eligibility.md`. Bestehende IDs bleiben erhalten.

**Angenommene Regelentscheidung:** Beim Setup von EXP-03 werden Energy Crisis (M06), Technology Initiative (M09), Supply Chain Disruption (M11) und Future Committee (M15) nur aufgenommen, wenn EXP-01 aktiv ist. Ohne EXP-01 bleiben diese vier Karten außerhalb des Matchmaterials und aller Matchzonen; die übrigen elf bilden das EXP-03-Deck. Drei davon starten wie bisher offen. Mit EXP-01 bleiben alle fünfzehn enthalten, jeweils eine Kopie pro Maßnahme.

**Begründung und Grenze:** Gedruckte Preise bleiben unverändert, und es entsteht weder ECO-Zustand ohne EXP-01 noch eine neue Ersatzkostenregel. Der Ausschluss richtet sich beim Setup nach der Modulabhängigkeit, unabhängig von späteren, vorübergehenden Substitutionsmöglichkeiten wie Order Partnership. Die spätere separate Freigabe von R18 reserviert Countdown und schließt M14/M15 unbedingt aus; die aktuellen Deckgrößen sind daher 13/10 gemäß ERRATA-0020. Die hier dokumentierten ursprünglichen R11-Zahlen 15/11 sind damit fortgeschrieben.

**Freigabe:** Nutzerbestätigung „ja“ am 2026-11-07 auf die vier benannten Karten und das Setup mit fünfzehn beziehungsweise elf Karten. R12 ist bereits durch R02 geklärt; R13 wurde anschließend separat angenommen. Game-Code wurde hier nicht angepasst.

### R12 — SEC-Erwerbspfad: durch R02 normativ geklärt

**Stellen:** EXP-02-00-08; EXP-02-03; EXP-02-04-A-01; EXP-02-09-01; CORE-01-04-22; EXP-01-05-01.

**Ursprünglicher Befund:** EXP-02 produziert keine Ressourcen, enthält keine SEC-Resorts und weist keine Start-SEC zu. Maßnahmen und Regulation-Platzierungen benötigen SEC. Ein ausführbarer Erwerb über CORE-Grassroots war wegen fehlender Texte nicht definiert.

**Durch R02 geklärt:** CORE-01-04-22A und -22B erlauben mit aktivem EXP-02 den Tausch von drei Ressourcen eines anderen aktiven Ressorts gegen eine SEC. Das funktioniert ohne EXP-01; es werden weder SEC-Produktion noch Start-SEC ergänzt. Das Bankmodell wurde mit R04 festgelegt; die Softwareanpassung steht aus. Dies ist eine direkte Folge der genehmigten R02-Regel, keine zusätzliche eigenständige Regelentscheidung.

### R13 — Erreichbare Maßnahmenauslöser: angenommen

**Stellen:** CORE-01-06-02 und -03; EXP-01-06-05; EXP-01-08-M09-03 bis -05; EXP-02-08-M02 und M03; EXP-02-06-03.

**Ursprüngliche Befunde:**

- **Emergency Decree:** PlayMeasure in Phase 2 folgte auf Hotspot-Auflösung in Phase 1. „This turn“ endete vor der nächsten regulären Platzierung; ein Ausspielen aus der Hand als Reaktion war nicht definiert.
- **Deployment Order:** Ein späterer eigener Regulation-Platzierungsauslöser fehlte bei normalem PlayMeasure und dessen zusätzlicher Nicht-PlayMeasure-Aktion.
- **Investment Freeze:** Der Zielgegner war beim regulären Ausspielen nicht am Zug; Produktion erfolgte außerdem erst im Settlement.

**Normative Übernahme:** EXP-02-07-01B, EXP-02-08-M02-02 bis -05, EXP-02-08-M03-02 bis -04 und EXP-01-08-M09-04 bis -07. Änderungshistorie: `docs/rules/ERRATA-0012-measure-trigger-windows.md`. R12 ist bereits über R02 geklärt und besitzt keine eigene Errata; daher behandelt ERRATA-0012 den Befund R13.

**Angenommene Festlegungen:** Alle drei Karten werden weiterhin ausschließlich über die gewöhnliche PlayMeasure-Aktion ausgespielt. Preise und globales Ausspiellimit bleiben bestehen; kein zusätzliches Ausspielen aus der Hand während fremder Züge oder der Draw-Phase wird erlaubt. Registrierung schließt ihre unmittelbare Kartenauflösung ab; spätere Ausführung gewährt keine Zusatzaktion und ist kein neues PlayMeasure.

- **Emergency Decree:** Dauer „Until consumed“. Beim Ausspielen einen noch nicht vollständig eingeschlossenen, unverarbeiteten Hotspot auf Board festlegen. Vor der Mehrheit seiner ersten Einschließung versucht der bereits aktive Effekt einmal, dort Blockade zu platzieren. Der Karteninhaber bezahlt dann die normalen Regulation-Platzierungskosten zusätzlich zu den bereits beim Ausspielen bezahlten Kartenkosten; bei unbezahlbarem oder verbotenem Versuch entsteht keine Blockade. Der Effekt wird nach diesem Versuch verbraucht; der Hotspot läuft anschließend nach R06 weiter. Kein Rückzahlen der früheren Kartenkosten und keine zweite Versuchsmöglichkeit.
- **Deployment Order:** Dauer „Until consumed“. Nach der nächsten erfolgreichen Regulation-Platzierung des Karteninhabers darf dieser genau die gerade platzierte Regulation unmittelbar auf ein anderes zulässiges Tile bewegen. Das ist eine registrierte Folgewirkung ohne zusätzliche Political Action; die gewöhnlichen Bewegungsverbote, Zielrestriktionen und etwaigen Modifikatoren gelten. Danach ist die Wirkung verbraucht, auch wenn die Bewegung abgelehnt oder nicht legal möglich ist. Die bereits erfolgreiche Platzierung wird durch eine ausbleibende Bewegung nicht rückgängig gemacht.
- **Investment Freeze:** Ziel bleibt ein Gegner; Dauer das nächste Round Settlement, einschließlich eines als nächstes eintretenden finalen Settlements. Für ResortTiles, die dieser Spieler bei ihrer Produktion kontrolliert, werden Maßnahmenmodifikatoren des gedruckten Produktionswerts, der Verdopplung und des Tile-Ausstoßes ignoriert. Regulation-Modifikatoren bleiben wirksam. Bei Gleichstand ist das Tile unkontrolliert und nicht erfasst; andere Empfänger erhalten keine gesonderte Neuberechnung. Danach endet der Effekt. Empfangsbegrenzungen wie R19 sind kein Tile-Output-Modifikator und werden hier nicht mitentschieden.

**Beispiele:** Ein in Phase 2 registriertes Emergency Decree kann auf die Einschließung durch eine spätere gegnerische Tile-Platzierung reagieren, ohne eine neue Karte zu spielen. Deployment Order kann bis zu einer späteren eigenen Regulation-Platzierung über Inner Order warten. Investment Freeze kann beim nächsten Settlement Economic Stimulus auf einem dann vom Zielspieler kontrollierten Resort ignorieren.

**Freigabe:** Nutzerbestätigung „ja“ am 2026-11-07 auf das vorgestellte Paket für die drei Karten einschließlich Kostenzeitpunkt, Einmaligkeit und positiver/negativer Tile-Modifikatoren. Generische spätere Eingaben, Effektinstanzen und deren Reihenfolge bleiben R17; Game-Code wurde hier nicht angepasst.

### R14 — Authority Apparatus und Competence Conflict: angenommen

**Stellen:** EXP-02-05-01 bis -03; EXP-02-06-01; EXP-02-02-B-04 und -06; EXP-02-08-M05-03.

**Ursprünglicher Befund:** „Instead of its normal effect“ verwies auf einen nicht definierten Normal-Effekt. Zeitpunkt, Aktionsverbrauch und Aktivierungsvoraussetzungen fehlten.

Competence Conflict platzierte Administration auf dem Apparatus, obwohl Administration ein produzierendes/konvertierendes Tile verlangte und der Apparatus als keines davon definiert war. Der spezifische Kartentext konnte als Ausnahme gelesen werden, ohne diese ausdrücklich zu benennen.

**Normative Übernahme:** EXP-02-05-01 bis -06 einschließlich -02A, EXP-02-06-01 und EXP-02-08-M05-03 bis -05. Änderungshistorie: `docs/rules/ERRATA-0013-authority-apparatus.md`. Bestehende IDs und ContextTile-Regeln bleiben erhalten.

**Angenommene Regelentscheidung:** Bei aktivem EXP-02 gibt es die Political Action ActivateAuthorityApparatus. Der aktive Spieler muss den Apparatus nach der kanonischen Mehrheit kontrollieren; virtuelle Kontrolle genügt. Die Aktion hat Basis-Ressourcenkosten 0, verwendet ContextTile = Apparatus und bewegt oder entfernt genau eine vorhandene Regulation auf Board. Sie ist auch als die eine Zusatzaktion nach PlayMeasure zulässig und gewährt keine weitere Aktion. Dies ist seine vollständige Grundfunktion; er produziert und konvertiert keine Ressourcen.

**Ziele und Modifikatoren:** Das Ziel darf auf einem beliebigen Board-Tile liegen; es gibt keine zusätzliche Nachbarschaftsbedingung. Die bestehenden R03-Regeln gelten: einmalige lokale Modifikatorprüfung am Apparatus, explizite Verbote wie Surveillance an der Quelle und zulässige Regulation-Typen am Bewegungsziel. Die Aktion kann selbst keine neue Regulation aus Supply platzieren.

**Competence Conflict:** Control ersetzt Administration, damit die gewöhnliche Typ-Ziel-Zulässigkeit erhalten bleibt. Nach der nächsten erfolgreichen eigenen Apparatus-Aktivierung in diesem Zug darf der Karteninhaber einmal genau eine Control-Regulation auf dem Apparatus platzieren, gegen die normalen Platzierungskosten zusätzlich zum unveränderten Kartenpreis. Das ist ein separater nachgelagerter Effekt; die neue Regulation wirkt erst auf spätere Effekte. Unterlassene oder unmögliche Platzierung macht die bereits abgeschlossene Aktivierung nicht rückgängig. Die Karte bleibt „This turn“ und ist so mit der zusätzlichen Apparatus-Aktion direkt nutzbar.

**Beispiel:** A kontrolliert den Apparatus und entfernt als Political Action eine entfernte Regulation. Ein vorab über PlayMeasure aktivierter Competence Conflict bietet anschließend eine regulär bezahlte Control-Platzierung auf dem Apparatus an. Control verteuert künftige Effekte dort, nicht die schon abgeschlossene Aktivierung.

**Freigabe:** Nutzerbestätigung „passt für mich“ am 2026-11-07 auf Apparatus-Aktivierung und die Änderung an Competence Conflict. R15 und die Output-Abgrenzung R16 sind inzwischen angenommen; Game-Code wurde hier nicht angepasst.

### R15 — Kostenmodell, Settlement und Aktionsausfall angenommen

**Stellen:** CORE-01-06-00-01 und -02; CORE-01-06-16; CORE-01-07-03; EXP-02-02-B-05; EXP-02-04-C-02; EXP-02-08-M08 bis M10 und M12.

**Ursprünglicher Kostenbefund:** Administration und State of Exception konnten auch automatische Effekte ohne benannten Zahler verteuern. R15a hat Zahler, Ausnahmen und Auflösungsgrenzen inzwischen ausdrücklich festgelegt.

**Ursprünglicher Reihenfolgebefund:** EXP-02-04-C-02 modifizierte erst nach Mehrheitsbestimmung; CORE-01-06-16 ordnete Produktionsmodifikatoren davor ein. R15b hat die kanonische Produktion jetzt ausdrücklich bestätigt und den widersprüchlichen EXP-02-Satz korrigiert.

Produktion, De-escalation und Loss of Control konnten im selben Settlement stattfinden, ohne verbindliche Reihenfolge. Die Ausführung ist nun unten festgelegt. Bankknappheit ist seit der Annahme von R04 kein Reihenfolgefaktor; persönliche Zahlungsmittel für kostenpflichtige Operationen bleiben relevant.

**Vorschlag:** Kostenpflichtige automatische Effekte und Zahler ausdrücklich bestimmen oder solche Effekte von bestimmten Aufschlägen ausnehmen. Settlement-Vor-/Nachfenster und Tile-Reihenfolge festlegen; CORE-Produktionsordnung mit Zahlerermittlung abstimmen.

**R15a — Angenommenes Kostenmodell:**

- Automatische Resort-Produktion und die normale Influence-Auszahlung eines Hotspots haben keinen Zahler und erhalten keine Ressourcen-Kostenaufschläge. Blockade und anwendbare Output-Modifikatoren wirken weiterhin; das ist keine allgemeine Effektimmunität.
- Politische Aktionen und vom Spieler ausgeführte Maßnahmen-/Regulationsoperationen haben den handelnden Spieler als Zahler, auch bei Basispreis 0. Kosten einer registrierten späteren Maßnahmewirkung zahlt deren Karteninhaber, soweit die Wirkung eine kostenpflichtige Operation ausführt. Der freiwillig gewählte Regulationsausgang von Inner Order wird vom Mehrheitsgewinner bezahlt; er ist nicht die kostenlose normale Hotspot-Influence-Auszahlung. ContextTile dieses besonderen Hotspot-Ausgangs bleibt ausdrücklich Inner Order, auch bei einer eingebetteten Bewegung.
- Kartenpreis und eine unmittelbar enthaltene Regulation-Platzierung bilden eine gemeinsame Kostenbasis derselben Auflösung; lokale/globale Aufschläge werden darauf einmal angewendet. Ein bloß intern aufgeteilter Resolver darf keine zweite Steuer erzeugen. Spätere separat ausgelöste Operationen wie Emergency Decree oder Competence Conflict erhalten eine eigene Kostenprüfung am tatsächlichen Auslösezeitpunkt; vorher bezahlte Kartenkosten werden nicht rückwirkend neu berechnet.
- State of Exception wird entsprechend auf diese spielerbezahlten Auflösungen eingegrenzt: +1 auch auf eine normale Place-, Move-, TakeMeasure- oder Apparatus-Aktion mit Basispreis 0, aber keine Besteuerung der automatischen Produktion oder normalen Hotspot-Auszahlung. Die Auswertung von Modifikatoren oder das Zählen von Mehrheit ist kein weiterer kostenpflichtiger Effekt.
- Verbote werden vor Zahlung geprüft; nicht vollständig bezahlbare Auflösungen scheitern atomar. Ausdrückliche Verbrauch-bei-Fehlschlag-Regeln bleiben bestehen. Start-Committee-Immunität, explizite Basiskosten und additive Kostenstapelung bleiben erhalten.

**Beispiele zu R15a:** Ein W3 mit Administration produziert bei unmodifiziertem Alleincontroller weiterhin drei Ressourcen ohne Produktionsgebühr; eine Influence-Platzierung mit ContextTile auf diesem Resort erhält den Administration-Aufschlag. Threat Situation mit Kartenpreis SEC+INF und unmittelbarer normaler Regulation-Platzierung hat vor Modifikatoren zusammen 3 SEC + 1 INF; ein anwendbarer globaler +1-Aufschlag kommt einmal hinzu. Emergency Decree bezahlt seinen Kartenpreis beim Ausspielen und seinen getrennten Platzierungsversuch später, jeweils nach der dann geltenden Kostenlage.

**Normative Übernahme R15a:** CORE-01-06-00-07 bis -09; EXP-01-06-05B; EXP-02-02-C-05, -02-G-05A/-05B, -04-A-06, -08-M10-03 und -10-03. Änderungshistorie: `docs/rules/ERRATA-0014-effect-costs.md`. Bestehende IDs bleiben erhalten.

**Freigabe R15a:** Nutzerbestätigung „ja“ am 2026-11-07 ausschließlich auf das Kostenmodell einschließlich des eingegrenzten State of Exception und des Mehrheitsgewinners als Zahler bei Inner Order. Game-Code wurde hier nicht angepasst.

**R15b — Angenommene Settlement-Reihenfolge:**

1. Gültigkeit registrierter Effekte anhand ihrer ausdrücklich geltenden Zeitfenster prüfen; eine Änderung der Bedeutung von „This round“ bleibt R25.
2. Bereits registrierte einmalige Settlement-Operationen wie De-escalation und Loss of Control vor Produktion auflösen, in Reihenfolge ihrer Registrierung, bei Gleichstand nach stabiler Effektinstanz-ID. Hier gibt es kein neues PlayMeasure-Ausspielfenster. Gedruckte Produktionsmodifikatoren wie Economic Stimulus bleiben stattdessen während der jeweiligen Tile-Produktion anwendbar.
3. ResortTiles in aufsteigender stabiler Tile-ID-Reihenfolge produzieren lassen. Pro Tile bleibt CORE-01-06-16 vollständig maßgeblich: Druckwert → Verdopplung → Output-Modifikatoren einschließlich SecurityLevel → Floor → Mehrheit → Verteilung/Noise. Regulierungs-Output wird nicht hinter die Mehrheitsbestimmung verschoben.
4. Ausdrücklich nachgelagerte Settlement-Effekte abschließen. Erst anschließend ist das Settlement beendet; nur wenn eine weitere Runde beginnt, deren Flags zurücksetzen. Bei finalem Settlement gilt R05 mit anschließender Wertung.

**Normative Übernahme R15b:** CORE-01-07-03 bis -06, EXP-02-04-C-02 und EXP-02-08-M08-04/-M12-04. Änderungshistorie: `docs/rules/ERRATA-0015-settlement-sequence.md`.

**Freigabe R15b:** Nutzerbestätigung „ja“ am 2026-11-07 auf die separat vorgestellte Settlement-Reihenfolge. R15a/R15b wurden damit angenommen; R15c wurde anschließend separat freigegeben (siehe unten). Allgemeine Effektinstanzen bleiben R17 und die Zeitdefinitionen R25. Game-Code wurde hier nicht angepasst.

**R15c — Angenommene Ergänzung zur Aktionsverfügbarkeit:** Unter State of Exception und bei null Ressourcen kann jede sonst kostenlose Political Action mindestens eine Ressource kosten. Place, Move, TakeMeasure und Apparatus sind dann unbezahlbar; Formalisierung, Konvertierung und sämtliche vorhandenen Maßnahmen haben ebenfalls unbezahlbare Grund-/Zusatzkosten. Start Committee bleibt zwar gegen Aufschläge immun, verlangt aber weiterhin vier Basisressourcen. Ein Spieler kann somit nach einer erfolgreichen Tile-Platzierung ohne legale Political Action verbleiben; eine freiwillige fehlgeschlagene Aktion ist bislang keine ausdrückliche Zugabschlussregel.

**Angenommene Regelentscheidung R15c:** Nach Abschluss der für den Aktionsslot vorgeschriebenen Vorauflösungen prüfen, ob irgendeine dort zulässige legale Political Action existiert, einschließlich zulässiger Kostenersetzungen, Kostentransfers und der Start-Committee-Immunität. Gibt es keine, den verpflichtenden Slot zwingend ohne Aktion und ohne Zahlung abschließen. Dasselbe gilt für die zusätzliche Nicht-PlayMeasure-Aktion nach PlayMeasure; geprüft werden jeweils nur die in diesem Slot erlaubten Aktionen. Bei mindestens einer legalen Option ist Auslassen nicht erlaubt.

**Angenommene ausdrückliche Budget-Deficit-Ausnahme:** Das erzwungene Auslassen zählt ausschließlich für dessen Verbrauch wie ein gescheiterter Political-Action-Versuch. Budget Deficit wird verbraucht, damit sein eigener Aufschlag bei einem ressourcenlosen Spieler ohne Einkommensquelle keine dauerhafte Aktionssperre erzeugt. Es findet trotzdem keine echte Aktion statt: kein zusätzlicher PlayMeasure-Verbrauch, kein Nehmen einer Karte und keine Zahlung. Andere wartende Effekte werden ohne ihren tatsächlichen Auslöser nicht verbraucht; insbesondere bleibt Intergenerational Pact ohne Transfer ungenutzt. Diese angenommene Ausnahme ersetzt den früheren, nicht freigegebenen Vorschlag, auch Budget Deficit beim Auslassen unverändert zu lassen. Nach Verbrauch wird der abgeschlossene Slot nicht erneut geöffnet.

**Erhaltene Ergebnisse und Grenze:** Bereits erfolgte Tile-Platzierung, Hotspot-Auflösungen, eine erfolgreich gespielte Maßnahme, bezahlte Kosten und die gemeinsame PlayMeasure-Rundennutzung bleiben bestehen. Normale Runden-/Spielabschlussregeln folgen. Dies ist eine zwingende Ausnahme zu den Pflicht-Aktionsslots, kein freiwilliges Passen. R15c wurde unabhängig von den Freigaben zu R15a und R15b separat bestätigt.

**Normative Übernahme R15c:** CORE-01-04-09 bis -09C, EXP-01-06-05(b)/-05C und EXP-01-08-M06-07A. Änderungshistorie: `docs/rules/ERRATA-0016-no-legal-action.md`.

**Freigabe R15c:** Nutzerbestätigung „ja“ am 2026-11-08 auf die zwingende Auslassregel einschließlich der Budget-Deficit-Verbrauchsausnahme. R15a/R15b/R15c sind damit angenommen. Game-Code wurde hier nicht angepasst.

### R16 — SecurityLevel-Output-Arten und bezahlter Nulloutput angenommen

**Stellen:** CORE-01-06-00-01; EXP-02-02-B-02; EXP-02-04-B-01 bis -04.

**Ursprünglicher Befund:** „Effect output -1“ war für Ressourcenproduktion verständlich, aber nicht für Influence-Bewegung, Regulation-Entfernung/-Bewegung oder dauerhafte Verbote. „Output 0“ bestimmte außerdem nicht, ob eine bezahlte Aktion erfolgreich mit Nullwirkung ist oder atomar scheitert.

**Vorschlag:** Reduzierbare Mengen je Effektfamilie auflisten; nichtnumerische Effekte ausdrücklich ausnehmen oder ihre Reduktion definieren. Kosten und Erfolgsstatus bei Output 0 bestimmen.

**Angenommene Regelentscheidung R16:** SecurityLevel reduziert ausschließlich die ausdrücklich erzeugte/gewährte Ressourcen- oder Influence-Ausgabemenge am ContextTile. Dazu gehören Resort-Produktion (vor Verteilung/Noise), Ressourcenoutput von ConvertResources einschließlich Investment Program, unmittelbare Ressourcengewinne wie Future Investment, neue Influence durch FormalizeInfluence und die normale Hotspot-Influence-Auszahlung einschließlich Labor Market. Bei Hotspots zählt die gewährte Auszahlung trotz Transfers eines vorhandenen Markers aus PersonalSupply als reduzierbarer Output. Die bereits angenommenen Kosten-, ContextTile-, Immunitäts- und Einmaligkeitsregeln bleiben bestehen.

**Angenommene ausgenommene Vorgänge:** Gewöhnliches PlaceOrMoveInfluence, Regulation-Platzierung/-Bewegung/-Entfernung einschließlich Apparatus und Inner Order, Kartennehmen/-nachfüllen/-recyceln, Tile-Platzierung, Mehrheit/virtuelle Influence, Kosten/Zahlungen sowie Verbote, Laufzeiten und andere nichtnumerische Modifikatoren werden nicht durch SecurityLevel reduziert. Die Anzahl bewegter oder platzierter Objekte ist allein keine Output-Klassifizierung; die oben benannten Influence-Gewinne sind ausdrücklich eingeschlossen. R18 wurde anschließend separat als Reservierung ohne Countdown-Zustand angenommen; keine implizite neue Countdown-Wirkung.

**Angenommener Nulloutput:** Additive SecurityLevel-Reduktion mit Floor 0. Eine sonst legale und vollständig bezahlbare Aktion mit auf 0 reduziertem Output bleibt legal und erfolgreich; volle Kosten werden bezahlt und der Aktionsslot wird verbraucht. Es gibt keine Rückzahlung. Ein solcher verfügbarer Aktionsweg verhindert das automatische Auslassen nach R15c. Verbote, unerfüllte Zielbedingungen und unbezahlbare Kosten scheitern weiterhin nach ihren eigenen Regeln. Ein auf 0 reduziertes Hotspot-Ergebnis bleibt nach R06 einmalig verarbeitet; keine spätere Auszahlung.

**Beispiele:** W3 mit einem SecurityLevel liefert vor Verteilung 2; Grassroots-Tausch 3:1 mit einem SecurityLevel zahlt 3 und liefert 0; Standard-Formalisierung zahlt regulär und erzeugt 0 neue Influence. Gewöhnliche eigene Influence-Platzierung und Apparatus-Entfernung funktionieren dagegen weiterhin, sofern andere Restriktionen und Kosten erfüllt sind. Diese Entscheidung ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R16:** EXP-02-02-B-02/-02A/-02B und EXP-02-04-B-05 bis -07. Änderungshistorie: `docs/rules/ERRATA-0017-securitylevel-output.md`.

**Freigabe R16:** Nutzerbestätigung „ja“ am 2026-11-08 auf die vorgestellte Abgrenzung und die erfolgreiche bezahlte Nullwirkung. Game-Code wurde hier nicht angepasst.

### R17 — Karten-/Effekttrennung, Reihenfolge und Atomarität angenommen

**Stellen:** CORE-01-06-00-03; EXP-01-06-05(a); EXP-01-07-01 bis -07; EXP-01-08-M06-07 und M08; EXP-03-08-M13-05 bis -07.

**Ursprünglicher Befund R17a:** Gespielte Karten werden recycelt/abgelegt, können aber langfristig wirken. Dieselbe Karte könnte erneut gezogen werden, während ihr erster Effekt aktiv ist. Unabhängige Effektinstanzen mit Eigentümer, Dauer und Nutzungsflags waren nicht ausdrücklich spezifiziert. Auch „resolve completely“ musste bei Registrierung zukünftiger Effekte von deren späterer Ausführung getrennt werden.

Budget Deficit verbraucht sich ausdrücklich auch nach gescheitertem Versuch: eine spezifische Ausnahme zur allgemeinen Atomarität. Intergenerational Pact verbraucht sich nach Transfer, verlangt bei unbezahlbarer Fremdzahlung aber „no state change“. Der Commit-Zeitpunkt für Verbrauch, Zahlung und gleichzeitig verwendete Ersetzungen war nicht ausdrücklich bestimmt; R17b legt ihn nun unten fest.

**Vorschlag:** Kartenobjekt und aktive Effektinstanz trennen. Pro Ausspielung eigene Instanz mit Dauer/Flags; spätere Entscheidungen als explizite Ereignisse. Verbrauch und Zahlungen erst am definierten Commit ändern; ausdrückliche Verbrauch-bei-Fehlschlag-Ausnahmen beibehalten.

**Angenommene Regelentscheidung R17a — Kartenobjekt und Wirkung trennen:** Jede erfolgreiche Ausspielung mit fortdauernder oder zukünftiger Wirkung registriert eine eigene Effektinstanz. Diese enthält eine unveränderliche eindeutige ID, Quellkarten-ID und deren Ausspielnummer, den damaligen ausspielenden Spieler als Inhaber, festgelegte Ziele/Parameter, das normative Zeitfenster bzw. den Auslöser sowie eigene Verbrauchs-/Nutzungsflags. IDs werden aus Spielereignissen deterministisch vergeben, nicht aus Uhrzeit oder ungesetztem Zufall. Eine aktive Instanz ist kein zweites Kartenobjekt und kein Aufenthalt der Karte in einer zusätzlichen Zone.

**Angenommener unabhängiger Kartenumlauf:** Die Registrierung beendet die unmittelbare Auflösung einer zukünftigen Wirkung. Danach folgt die Karte ihrem normalen Recycle-/FinalDiscard-Lebenszyklus, der Markt wird nachgefüllt und die gewöhnliche Nicht-PlayMeasure-Zusatzaktion folgt einschließlich R15c. Eine nur sofortige Wirkung braucht keine wartende Instanz. Recycle, erneutes Ziehen, Besitzerwechsel der Karte oder FinalDiscard beenden keine bereits registrierte Wirkung und ändern deren Inhaber, Ziele oder Flags nicht. Eine spätere erfolgreiche Ausspielung derselben physischen Karte erhält eine neue Instanz mit eigenen Werten; bestehende Wirkungen werden dadurch weder ersetzt noch zurückgesetzt.

**Angenommene Grenzen:** Jede Instanz wirkt bis zu ihrem eigenen normativen Ablauf/Verbrauch. Eine abgelaufene oder verbrauchte Instanz wirkt nicht weiter; ihr Ende bewegt die Quellkarte nicht. Bestehende Verbote mehrfacher Instanzen wie Carbon Levy bleiben bindend; getrennte Instanzen umgehen weder diese Verbote noch gemeinsame PlayMeasure-Limits oder besondere Stapelregeln. Allgemeine zusätzliche Stapelwirkung wird damit nicht erfunden. Nutzungsflags gehören zur jeweiligen Effektinstanz und werden nur gemäß deren Regel zurückgesetzt, nicht durch Kartenumlauf. Die Zeitbegriffe selbst bleiben R25.

**Angenommene Regel für spätere Entscheidungen:** Bereits beim Ausspielen bestimmte Ziele bleiben gebunden. Nur ausdrücklich später vorgesehene Wahlmöglichkeiten werden am normativen Auslöser durch den laut Regel zuständigen Spieler aus den dann legalen Optionen gewählt und als Spielereignis für Replay erfasst; keine automatische Zielerfindung oder stillschweigende Neuwahl. Das ist kein neues PlayMeasure, kein neues Handkartenfenster und gewährt keine weitere Political Action.

**Beispiel R17a:** Eine von A gespielte Budget-Deficit-Karte wirkt nach dem ersten Ausspielen gegen B weiter, obwohl sie bereits im RecyclePile liegt. Wird dieselbe Karte später von C legal gegen D ausgespielt, sind C/D und A/B voneinander unabhängige Wirkungszuordnungen; FinalDiscard der Karte beendet die erste Wirkung gegen B nicht. Beide enden nur durch ihren jeweiligen regelgerechten Verbrauch.

**Normative Übernahme R17a:** EXP-01-06-05D, EXP-01-07-08 bis -13, EXP-02-07-01C und EXP-03-07-01B; bestehende Nutzungsflag-Absätze auf aktive Effektinstanzen präzisiert. Änderungshistorie: `docs/rules/ERRATA-0018-active-effect-instances.md`.

**Freigabe R17a:** Nutzerbestätigung „ja“ am 2026-11-08 auf die Trennung von physischer Karte und unabhängigen Wirkungen. Die bereits angenommenen Spezialfälle aus R13–R16 bleiben erhalten. Game-Code wurde hier nicht angepasst. R17b wurde anschließend separat bestätigt (siehe unten).

**Angenommene Regelentscheidung R17b — Reihenfolge:** Die kanonischen Auflösungsstufen und bereits ausdrücklich bestimmten Zeitfenster bleiben vorrangig. Innerhalb desselben Fensters werden gleichzeitig ausgelöste Operationen nach Registrierung ihrer Instanzen, bei Gleichstand nach stabiler Instanz-ID ordinal-lexikografisch aufgelöst. Am auslösenden Ereignis wird festgehalten, welche bereits registrierten Instanzen dafür ausgelöst wurden; jede höchstens einmal für dieses Ereignis. Jede Operation wird vollständig vor der nächsten abgeschlossen und gegen den dann aktuellen Zustand geprüft. Neue Instanzen reagieren nicht rückwirkend auf ein bereits begonnenes Ereignis. Passive Modifikatoren bleiben in ihrer kanonischen Modifikatorstufe, statt als zusätzliche Operationen ausgeführt zu werden.

**Angenommener R17b-Zahlungsplan:** Vor Zustandsänderungen einen vollständigen Zahlungsplan mit regelgerecht bestimmten Kosten, zulässigen Ersetzungen, optionalen Nutzungen und Übertragungen festlegen. Jede Ressource darf nur einen Kostenbestandteil bezahlen; alle betroffenen Zahler müssen ihre endgültigen Anteile vollständig bezahlen können. Jeder zusätzliche Kostenbestandteil darf innerhalb dieser Auflösung höchstens einmal durch Intergenerational Pact übertragen werden; keine Weiterübertragung desselben Bestandteils oder Übertragungsschleife. Mehrere erlaubte Instanzen können unterschiedliche Bestandteile übertragen. R22 und R24a/R24b wurden anschließend separat freigegeben, einschließlich Schutzumfang und Reihenfolge der Befreiungen.

**Angenommener R17b-Erfolgsabschluss:** Zahlung aller Anteile, unmittelbarer Effekt, gegebenenfalls neue Effektregistrierung und der durch diese erfolgreiche Zahlung ausgelöste Verbrauch bzw. die Nutzung von Intergenerational Pact/Economic Council werden gemeinsam atomar übernommen. Bei einem erfolgreichen PlayMeasure gehören auch Karten-Spielzähler und gemeinsames PlayMeasure-Nutzungsflag zum erfolgreichen Ausspielen; danach folgen der vorgeschriebene Kartenumlauf und die Marktauffüllung. Spätere separate Trigger sind eigene Auflösungen und machen vorher erfolgreich abgeschlossene Schritte nicht rückgängig.

**Angenommene R17b-Fehlschlagsregel:** Scheitert die Auflösung an Verbot, Zielbedingung oder vollständiger Zahlung, werden keine Teilzahlungen und keine Hauptwirkung übernommen. Nur dafür vorgesehene Nutzungen von Economic Council oder Transfers von Intergenerational Pact gelten nicht als erfolgt; ihre Flags bzw. Verbrauch bleiben unverändert. Bei gescheitertem PlayMeasure bleibt die Karte in Hand, ohne Spielzählererhöhung, neues gemeinsames PlayMeasure-Flag, neue Effektinstanz, durch diesen Versuch ausgelöste Auffüllung oder Zusatzaktion. Explizite Verbrauchsausnahmen wie Budget Deficit, Emergency Decree und Deployment Order gelten trotzdem genau in ihrem definierten Umfang; diese Ausnahmen rollen bereits abgeschlossene Vorgänger nicht zurück. Eine nach R16 erfolgreiche Nulloutput-Aktion ist kein Fehlschlag.

**Angenommene Regel für abgewiesene Eingaben:** Eine von vornherein regelwidrige Eingabe ist kein regelgerecht begonnener Aktionsversuch und löst insbesondere keinen kostenlosen Budget-Deficit-Verbrauch aus. Das zwingende Auslassen nach R15c einschließlich seiner ausdrücklich freigegebenen Verbrauchsausnahme bleibt bestehen.

**Beispiel R17b:** A plant, einen Aufschlag mit Intergenerational Pact auf B zu übertragen und Economic Council für den verbleibenden ECO-Anteil zu nutzen. Kann ein erforderlicher Anteil nicht vollständig bezahlt werden, zahlt niemand teilweise; Pact bleibt ungenutzt und Council behält seine Nutzung. Bei vollständig erfolgreicher Zahlung werden beide betroffenen Nutzungen zusammen mit der Hauptwirkung übernommen. Ein ausdrücklich ausgelöster Budget-Deficit-Verbrauch bleibt davon ausgenommen. R17b ist nach separater Freigabe normativ übernommen.

**Normative Übernahme R17b:** CORE-01-06-00-10 bis -12; EXP-01-07-13 bis -15; EXP-01-08-M08-05; EXP-02-07-01C; EXP-03-07-01B und EXP-03-08-M13-06/-08/-09. Änderungshistorie: `docs/rules/ERRATA-0019-effect-order-and-payment.md`.

**Freigabe R17b:** Nutzerbestätigung „ja“ am 2026-11-08 auf Reihenfolge, vollständigen Zahlungsplan, gemeinsamen Abschluss und Fehlschlagsregeln einschließlich bestehender Ausnahmen. Game-Code wurde hier nicht angepasst.

### R18 — Countdown reserviert und unwirksame Karten ausgeschlossen

**Stellen:** EXP-03-02-C-02 bis -09; EXP-03-03; EXP-03-04-B-01 bis -05; EXP-03-08-M14 und M15; EXP-03-10-06.

**Ursprünglicher Befund:** CountdownSupply wurde nicht initialisiert. Keine vorhandene Maßnahme platzierte oder entfernte Marker. M14 und M15 verteuerten nur hypothetische Platzierung; „may hold“ war keine Platzierungsanweisung. Automatische Auflösung war ausdrücklich ausgeschlossen.

**Folge:** Marker und beide Platzierungsaufschläge besitzen im vorliegenden Regelbestand keinen erreichbaren Anwendungsfall.

**Vorschlag:** Mechanik bewusst als reserviert kennzeichnen und entsprechende Karten ausschließen oder konkrete Vorrats-, Platzierungs- und Entfernungseffekte definieren. Keinen automatischen Countdown ergänzen.

**Angenommene Regelentscheidung R18 — Mechanik reservieren:** Countdown in dieser Regelversion ausdrücklich als inaktiv/reserviert kennzeichnen. Keine Countdown-Marker, kein CountdownSupply und keine Countdown-spezifischen Board-Einträge oder Zähler im Match anlegen. Bestehende Beschreibungstexte dürfen als reservierte Definitionen erhalten bleiben, autorisieren aber keine Aktion und keinen Effekt. Eine spätere Aktivierung benötigt eine eigene freigegebene Regeländerung mit Vorrat, Platzierung und tatsächlicher Funktion; keine automatische Countdown-Auflösung ergänzen.

**Angenommene Deckfolge:** Transformation Blockade (M14) und Future Committee (M15) bei jedem Setup aus dem Matchmaterial ausschließen, unabhängig von EXP-01-Aktivierung. Mit dem bereits freigegebenen R11-Filter ergibt das 13 EXP-03-Maßnahmen mit EXP-01 und 10 ohne EXP-01; M15 wird bei den Ausschlüssen nur einmal gezählt. Ausgeschlossene Karten befinden sich in keiner Zone und kommen auch durch Recycling oder Kostenersetzung nicht zurück. Die drei offenen Marktplätze bleiben unverändert.

**Erhaltener Hotspot:** Transformationsdruck bleibt einmal als gewöhnlicher CORE-Hotspot im DrawPile, mit normaler Mehrheits-Influence-Auszahlung und ohne Ressourcenproduktion. Sein Countdown-Bezug ist reserviert und erzeugt keine Marker. Damit wird keine neue Markeraktion, Wertungsfunktion oder wirtschaftliche Wirkung erfunden. Eine spätere vollständige Ausarbeitung der Countdown-Mechanik benötigt eine eigene Designentscheidung. R18 ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R18:** EXP-03-00-08; EXP-03-02-B-02/-04; EXP-03-02-C-00/-01; EXP-03-03-02 bis -02D und -07; reservierte Kennzeichnung in EXP-03-04-B/-04-C und EXP-03-08-M14-00/-M15-00. Änderungshistorie: `docs/rules/ERRATA-0020-countdown-reserved.md`.

**Freigabe R18:** Nutzerbestätigung „ja“ am 2026-11-08 auf Reservierung, zustandsfreie Umsetzung und Ausschluss beider Karten einschließlich Deckgrößen 13/10. Game-Code wurde hier nicht angepasst.

### R19 — Supply Chain Disruption: Empfangslimit und Bankverbleib angenommen

**Stellen:** CORE-01-06-12 bis -16; EXP-03-08-M11-05; EXP-03-05-03; EXP-03-10-04.

**Ursprünglicher Befund:** M11 begrenzte den Empfang eines Spielers auf 1 pro Produktionsinstanz, ohne Verbleib der Kürzung und Reihenfolge zur Gleichstandsverteilung zu bestimmen. Empfängerlimit und globaler Tile-Output sind nicht dasselbe.

**Beispiel:** Output 5, Gleichstand A/B, A betroffen. Regulär A=2, B=2, Noise=1. Nach A's Begrenzung kann der gekürzte Token in Bank bleiben oder Noise erhöhen; globale Output-Kürzung würde sogar B betreffen.

**Vorschlag:** Tile-Output und reguläre Anteile berechnen, anschließend ausschließlich den betroffenen Anteil begrenzen. Kürzung ausdrücklich in Bank belassen; Noise erhält nur ursprünglichen Teilungsrest. Andere Lösungen müssen ausdrücklich gewählt werden.

**Angenommene Regelentscheidung R19 — Empfangslimit nach Anteilsberechnung:** Eine Produktionsinstanz ist die vollständige Produktion eines einzelnen ResortTiles in einem Settlement, auch im finalen Settlement. Zuerst den Tile-Output nach CORE-01-06-16 einschließlich Verdopplung, SecurityLevel, sonstigen Modifikatoren und Floor berechnen, dann die regulären Spieleranteile und den ursprünglichen Gleichstandsrest bestimmen. Erst danach den Anteil eines von Supply Chain Disruption betroffenen Spielers auf min(regulärer Anteil, 1) begrenzen. Es wird nur die endgültige Auszahlung ausgeführt; kein vorläufiger Empfang mit anschließender Rücknahme.

**Angenommener Verbleib:** Nicht ausgezahlte Ressourcen bleiben in Bank beziehungsweise werden bei der unbegrenzten Bank gar nicht erst für eine Ausgabe materialisiert. Sie gehen weder an Noise noch an andere Spieler. Noise erhält nur den ursprünglichen Teilungsrest. Bei Alleinkontrolle bleibt die Kürzung vollständig in Bank; andere Empfänger behalten ihren regulären Anteil. Output 0, Blockade oder höchster Influence-Wert 0 erzeugen weiterhin keine Auszahlung; das Limit gewährt keinen Mindestanspruch auf eine Ressource.

**Angenommene Reichweite:** Das Limit gilt pro betroffenem Spieler und ResortTile-Produktion, nicht einmal für das ganze Settlement. Mehrere gleichartige Empfangslimits bleiben dieselbe Obergrenze 1 und reduzieren sie nicht auf 0. Es ist kein Tile-Output-Modifikator und wird von Investment Freeze nicht ignoriert. Gedruckter Kartenpreis, Zielspieler und Dauer bleiben unverändert; Zeitbegriffe bleiben R25.

**Beispiel R19:** Tile-Output 5 bei positivem Gleichstand A/B ergibt zunächst Anteile A=2, B=2 und Noise=1. Ist nur A betroffen, lautet die endgültige Auszahlung A=1, B=2, Noise=1; eine Ressource verbleibt in Bank. Bei alleiniger Kontrolle und Output 5 erhält A genau 1, während 4 nicht ausgegeben werden. R19 ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R19:** CORE-01-06-16(c)/-16A und EXP-03-08-M11-05 bis -09. Änderungshistorie: `docs/rules/ERRATA-0021-production-receipt-limit.md`.

**Freigabe R19:** Nutzerbestätigung „ja“ am 2026-11-08 auf Empfangslimit nach regulärer Anteilsberechnung, unveränderten ursprünglichen Noise-Rest, Bankverbleib der Kürzung und Anwendung pro ResortTile einschließlich Final-Settlement. Game-Code wurde hier nicht angepasst.

### R20 — Komponentenbestand und CLM-Zusatzverteilung angenommen

**Stellen:** CORE-01-03-02; EXP-01-02-C und -D; EXP-01-03; EXP-03-02-A-02; ADD56-01-01-02 bis -10.

**Ursprünglicher Befund:** Labor Market wurde beschrieben, aber ohne explizite Stückzahl. Investment Program war ×1, seine DrawPile-Zuordnung folgte nur mittelbar aus CORE „all non-Start tiles“.

EXP-03 verlangte zwei zusätzliche CLM-Tiles für 5–6 mit „identical distribution logic as other resorts“. CORE ergänzt W2/W3/W4, EXP-01 W1/W2/W3. Daraus folgte keine eindeutige Verteilung von zwei Tiles.

**Vorschlag:** Labor-Market-Anzahl, expliziten EXP-01-DrawPile-Bestand und die zwei CLM-Werte konkret benennen. Investment Programs mittelbare Zuordnung ist keine eigenständige unauflösbare Kollision.

**Angenommene Regelentscheidung R20 — EXP-01-Bestand:** Bei aktivem EXP-01 genau einen Labor Market und genau ein Investment Program in den Tile-DrawPile aufnehmen, jeweils für 2–4 und für 5–6 Spieler. Die vorhandenen ECO-Mengen beibehalten: für 2–4 insgesamt vier ResortTiles (W1×2, W2×1, W3×1), für 5–6 zusätzlich W1/W2/W3 je einmal, insgesamt sieben. EXP-01 ergänzt damit sechs bzw. neun Tiles einschließlich der beiden Sondertiles. Komponentenbeschreibung und Setup benennen dieselben Exemplare und erzeugen keine zusätzlichen Kopien. Measures bleiben in ihren separaten Measure-Zonen; deaktiviertes EXP-01 liefert keine dieser Tiles.

**Angenommene CLM-Verteilung:** Für 5–6 ausdrücklich zusätzlich CLM-W1×1 und CLM-W2×1 aufnehmen. Damit ergeben sich für 2–4 CLM-W1×2 und CLM-W2×2, für 5–6 jeweils ×3. Dies erhält die vorhandene gleichmäßige Verteilung und den durchschnittlichen Druckwert 1,5. Die Auswahl der Zusatzwerte ist eine neue Designfestlegung, nicht aus dem bisherigen Text eindeutig ableitbar und kein durch Tests belegter Balance-Nachweis. Transformationsdruck bleibt davon unabhängig genau einmal; kein Countdown-Zustand gemäß R18.

**Grenze:** R20 entscheidet nur Stückzahlen, Werte und Setup-Zuordnung. Investment Programs Aktionsintegration wurde anschließend separat unter R21 freigegeben; seine Aufnahme in den DrawPile allein erzeugt keine zusätzliche Aktion. R20 ist nach eigener Freigabe normativ übernommen.

**Normative Übernahme R20:** EXP-01-02-C-08, EXP-01-02-D-01, EXP-01-03-01/-07 und EXP-03-02-A-02/-02A. Änderungshistorie: `docs/rules/ERRATA-0022-component-setup.md`.

**Freigabe R20:** Nutzerbestätigung „ja“ am 2026-11-08 auf Stückzahlen, gemeinsame Tile-DrawPile-Zuordnung und zusätzlich CLM-W1/CLM-W2 je einmal für 5–6. Game-Code wurde hier nicht angepasst.

### R21 — Investment Program als alternative Grassroots-Konvertierung angenommen

**Stellen:** CORE-01-04-21 und -22; CORE-01-06-00-05 und -06; EXP-01-02-D-02; EXP-01-05-01 bis -04.

**Ursprünglicher Befund:** ConvertResources lief über Grassroots, Investment Program ist kein Grassroots. Offen blieb, ob sein Tausch den gedruckten Tausch ersetzt oder zusätzlich stattfindet. „The controlling player“ benannte das kontrollierte Tile nicht ausdrücklich. Bei mehreren beteiligten Tiles fehlte die explizite ContextTile-Zuweisung.

**Vorschlag:** Als alternative Tauschoption während derselben Grassroots-Aktion definieren, wenn der aktive Spieler Investment Program kontrolliert; ContextTile ausdrücklich Grassroots. Falls ein zusätzlicher Tausch beabsichtigt ist, Reihenfolge und gemeinsame Atomarität festlegen.

**Angenommene Regelentscheidung R21 — Alternative derselben Konvertierung:** ConvertResources bleibt eine Aktion über ein vom aktiven Spieler kontrolliertes Grassroots. Kontrolliert er zusätzlich Investment Program nach der kanonischen Mehrheit, darf er anstelle des normalen 3:1-Tauschs genau 2 ECO gegen 1 Ressource eines anderen aktiven Ressorts tauschen. Virtuelle Kontrolle genügt für beide Tiles. Keine Nachbarschaft zwischen den Tiles erforderlich. Die normale 3:1-Option bleibt wählbar; pro Aktion genau einer der beiden Tauschwege, kein zusätzlicher oder verketteter Austausch.

**Angenommene ContextTile- und Modifikatorzuordnung:** ContextTile ist ausschließlich das benutzte Grassroots. Dort gelten Verbote, Zusatzkosten und Output-Modifikatoren einmal nach dem kanonischen Resolver. Investment Program liefert nur die Zugangsbedingung zur Alternative und benötigt keine eigene Aktivierung; seine lokalen Modifikatoren werden für diesen Tausch nicht zusätzlich ausgewertet. Auch eine Blockade auf Investment Program allein deaktiviert die so definierte passive Tauschoption nicht; eine Blockade am Grassroots verhindert den Tausch. Dies ist die ausdrücklich freigegebene Ein-Kontext-Festlegung.

**Angenommene Zahlung und Output:** 2 ECO ersetzen ausschließlich die normale Basiszahlung von 3 gleichen Ressourcen; anwendbare Zusatzkosten kommen weiterhin hinzu. Zahlung aus PersonalSupply an Bank, Output aus Bank an PersonalSupply, gemeinsam atomar nach R17b. Andere aktive Erweiterungsressorts dürfen Ausgabe sein; ECO selbst ist als Ausgabe dieses ECO-Tauschs ausgeschlossen. SecurityLevel auf dem Grassroots kann Output 1 auf 0 reduzieren; bei sonst legalem, bezahlbarem Tausch gilt die erfolgreiche bezahlte Nullwirkung aus R16. Kontrolle allein über Investment Program ohne kontrolliertes Grassroots bietet keine Konvertierungsaktion.

**Beispiel R21:** A kontrolliert Investment Program und ein entferntes Grassroots. A wählt dort 2 ECO → 1 DOM statt des normalen 3:1-Tauschs. Ein dortiger Administration-Aufschlag bleibt zusätzlich zu bezahlen; ein SecurityLevel nur auf Investment Program reduziert diesen Grassroots-Output nicht. Eine weitere Konvertierung wird dadurch nicht gewährt. R21 ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R21:** EXP-01-05-01 bis -08. Änderungshistorie: `docs/rules/ERRATA-0023-investment-program-conversion.md`.

**Freigabe R21:** Nutzerbestätigung „ja“ am 2026-11-08 auf alternative Konvertierung, Kontrolle beider Tiles und ausschließlichen Grassroots-Kontext einschließlich der ausdrücklich vorgestellten Blockade-Folge am Investment Program. Game-Code wurde hier nicht angepasst.

### R22 — Supplemental Budget vor Zahlung mit fester Ersatzzahlung angenommen

**Stellen:** EXP-01-08-M10-04 und -05; CORE-01-06-00-02 und -03; EXP-02-02-C-02 und -03.

**Ursprünglicher Befund:** Erst nach Bezahlung erlaubte M10 eine zusätzliche Zahlung zum Ignorieren einer bereits enthaltenen Zusatzkomponente. Offen blieb Vorab-Erlass, Erstattung oder wirkungslose Zahlung ohne Erstattung. Bei unbezahlbaren Gesamtkosten wurde der angegebene Nutzungszeitpunkt gar nicht erreicht.

**Vorschlag:** Auswahl vor Bezahlung; Endkosten = Grundkosten + übrige Aufschläge + freiwillige Ersatzzahlung. Falls Erstattung gemeint ist, diese ausdrücklich anordnen.

**Angenommene Regelentscheidung R22 — Vorabwahl im Zahlungsplan:** Supplemental Budget bleibt eine Measure mit Kartenpreis 1 ECO und Dauer This turn. Nach erfolgreichem Ausspielen darf der Inhaber für eine danach ausgeführte eigene Political Action dieses Zuges vor Bezahlung genau einen tatsächlich anwendbaren zusätzlichen Ressourcen-Kostenbestandteil aus einer Measure oder kostensteigernden Regulation auswählen und durch eine feste Zahlung von 1 Ressource eines beliebigen aktiven Ressorts ersetzen. Der Kartenpreis bleibt separat beim Ausspielen bezahlt; die Karte erleichtert nicht rückwirkend ihre eigene Zahlung. Ohne passenden Aufschlag gibt es keine Ersatzoption. „Overlay“ an dieser Kartenstelle wird dabei ausdrücklich als Regulation präzisiert; das weitere Begriffsvokabular bleibt R25.

**Angenommene Endkosten:** Grundkosten + alle übrigen anwendbaren Aufschläge + feste Ersatzzahlung 1 Ressource. Pro Aktion höchstens ein Bestandteil; Grundkosten, Verbote und Mindestanforderungen werden nicht aufgehoben. Es handelt sich um eine Ressourcen-Einheit aus dem Aufschlag, nicht um sämtliche Aufschläge einer Quelle. Es gibt keine nachträgliche Erstattung und keine Zahlung des zuerst gestrichenen Bestandteils. Das kann eine fehlende Ressortfarbe ersetzen, spart aber nicht automatisch Ressourcenanzahl.

**Angenommene Regel gegen Wiederholungsschleifen:** Die feste Ersatzzahlung ist Teil desselben Zahlungsplans, keine eigenständige Aktion oder weitere besteuerte Auflösung. Sie ist selbst kein zusätzlicher Aufschlag für weitere Erlasse, Ersetzungen oder Übertragungen; insbesondere kann sie weder nochmals mit Supplemental Budget ersetzt noch mit Intergenerational Pact weitergegeben werden. Ein gestrichener ursprünglicher Bestandteil kann ebenfalls nicht übertragen werden. Andere zulässige Planbestandteile werden weiterhin nach R17b geprüft und gemeinsam bezahlt.

**Angenommene Erfolgs-/Fehlschlagsregel:** Verbote zuerst prüfen, dann nur den endgültigen vollständigen Zahlungsplan atomar mit der Political Action ausführen. Bei fehlender Endzahlung kein Teiltransfer, keine Rückerstattung alter erfolgreicher Zahlungen und keine Hauptwirkung; bereits geltende ausdrückliche Verbrauchsausnahmen bleiben bestehen. Die Wirkung gewährt keine weitere Political Action und ändert das This-turn-Zeitfenster nicht.

**Beispiel R22:** Investment-Program-Konvertierung mit Grundkosten 2 ECO und Energy-Crisis-Aufschlag 1 DOM. Mit Supplemental Budget kann der Spieler den DOM-Aufschlag im Zahlungsplan durch 1 FOR ersetzen: Endzahlung 2 ECO + 1 FOR. Der zuvor beim Ausspielen bezahlte Kartenpreis 1 ECO bleibt bestehen. R22 ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R22:** EXP-01-08-M10-04 bis -08. Änderungshistorie: `docs/rules/ERRATA-0024-supplemental-budget-payment.md`.

**Freigabe R22:** Nutzerbestätigung „ja“ am 2026-11-08 auf Vorabwahl und festen Ersatzpreis, einschließlich Ausschluss erneuter Ersetzung/Übertragung und Erhalt der übrigen Zahlungspflichten. Game-Code wurde hier nicht angepasst.

### R23 — Influence-Unterdrückung und Greenwashing-Ersatzpreis angenommen

**Stellen:** CORE-01-04-11, -12 und -17; CORE-01-06-05 bis -07; EXP-03-06-06 und -07; EXP-03-08-M05 und M07.

**Ursprünglicher Befund:** CORE unterscheidet Erzeugung durch Formalisierung und Transfer vorhandener Marker. Hotspot-Mehrheit erzeugt kein neues Objekt. Greenwashing verbot „generate“, Protest Movement „Majority does not generate“, während EXP-03-06-06 allgemeiner von verhinderter Platzierung sprach.

Offen war die Wirkung auf Formalisierung, Hotspot-Auszahlung, normales Place und Move. Greenwashing legte auch die Einheit der Ersatzzahlung (pro Effekt/Objekt) nicht ausdrücklich fest. Andere Verbote dürfen ohne ausdrückliche Ausnahme nicht umgangen werden.

**Vorschlag:** Betroffene Operationen pro Karte auflisten, etwa Formalisierung/Hotspot für Greenwashing und nur Hotspot für Protest Movement. Normales Place/Move gesondert behandeln. Ersatzzahlung pro betroffener Effektinstanz definieren; weitere Verbote bleiben wirksam.

**Angenommene Regelentscheidung R23 — Operationen ausdrücklich abgrenzen:** Greenwashing unterdrückt für alle Spieler neue Influence durch FormalizeInfluence und die normale Hotspot-Influence-Auszahlung einschließlich Labor Market und Transformationsdruck. Die Auszahlung zählt hierfür als Influence-Gewinn, obwohl sie einen vorhandenen Marker aus PersonalSupply transferiert. Protest Movement unterdrückt ausschließlich diese Hotspot-Influence-Auszahlungen. Gewöhnliches PlaceOrMoveInfluence, virtuelle Influence, Mehrheit, Ressourcen und Regulationsausgänge von Inner Order bleiben von beiden Karten unberührt. Start Committee bleibt gemäß CORE-01-08-06A immun; seine Timing-/Einmal-/Basiskostenregeln gelten unverändert.

**Angenommene Greenwashing-Ersatzregel:** Der Spieler, dem der Influence-Gewinn zusteht, darf genau einmal pro betroffener Formalisierungs- oder Hotspot-Auflösung 1 CLM oder 1 INF aus seiner PersonalSupply an Bank zahlen, um ausschließlich die Greenwashing-Unterdrückung dieser Auflösung aufzuheben. Der Ersatzpreis gilt pro Gewinnauflösung, nicht pro Marker; mehrere gleichzeitig anwendbare Greenwashing-Instanzen vervielfachen ihn nicht. Dies ist eine ausdrücklich dem Empfänger zugewiesene feste Ersatzzahlung, auch für den ansonsten kostenfreien automatischen Hotspot-Ausgang. Keine allgemeine Hotspot-Besteuerung und keine neue Political Action.

**Angenommene Zahlungsgrenzen:** Die feste Greenwashing-Ersatzzahlung ist kein zusätzlicher Kostenaufschlag, der seinerseits durch Supplemental Budget ersetzt oder durch Intergenerational Pact übertragen wird; sie wird nicht als eigene Auflösung erneut besteuert. Bei Formalisierung mit der normalen vollständigen Zahlung atomar ausführen, bei Hotspot mit dessen erlaubtem Influence-Ausgang. Ohne die gewählte, vollständig bezahlbare Ersatzoption bleibt der Gewinn untersagt; eine so verbotene Formalisierung ist keine legale Aktionsoption. Kein Teiltransfer, wenn die Auflösung an einer anderen Voraussetzung scheitert. Geltende ausdrückliche Fehlschlags-Verbrauchsregeln bleiben bestehen.

**Angenommene weitere Beschränkungen:** Die Greenwashing-Zahlung hebt weder Protest Movement noch Blockade, Budget Compromise, fehlenden Influence-Vorrat oder andere Voraussetzungen auf. Bei einem weiterhin wirksamen Verbot keine Ersatzgebühr bezahlen. Output-Modifikatoren wie SecurityLevel gelten nach Aufhebung der Greenwashing-Unterdrückung weiterhin; sie können einen sonst erlaubten bezahlten Ausgang auf 0 reduzieren. Start Committee benötigt wegen seiner Immunität keine Ersatzgebühr. Ein unterdrückter Hotspot wird nach R06 dennoch einmalig verarbeitet, ohne spätere Nachzahlung oder Wiederholung.

**Beispiel R23:** A hat die Mehrheit an einem gerade eingeschlossenen Hotspot. Nur Greenwashing aktiv: A kann 1 CLM oder 1 INF für den normalen Influence-Ausgang zahlen. Auch Protest Movement aktiv: keine Auszahlung und keine Greenwashing-Gebühr. Ein gewöhnlicher eigener Influence-Move bleibt unter beiden Karten zulässig, soweit seine sonstigen Regeln erfüllt sind. R23 ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R23:** EXP-03-06-06 bis -08, EXP-03-08-M05-04 bis -09 und EXP-03-08-M07-04 bis -06. Änderungshistorie: `docs/rules/ERRATA-0025-influence-suppression.md`.

**Freigabe R23:** Nutzerbestätigung „ja“ am 2026-11-08 auf Operationsabgrenzung, globale Wirkung, Start-Immunität und Greenwashing-Ersatzregel einschließlich festem, nicht übertragbarem/weiter ersetzbarem Preis und Fortgeltung anderer Verbote. Game-Code wurde hier nicht angepasst.

### R24 — Klima-/Kostenklassifikation, Schutzumfang und Reihenfolge angenommen

**Stellen:** EXP-03-02-D-01(a) bis (d); EXP-03-08-M08-04, M09-05 und M10-04; EXP-03-01-05; EXP-03-10-02.

**Ursprünglicher Befund:** Ein Effekt war Climate effect, wenn er CLM als Kosten verlangte. Ob nur gedruckte Pflichtkosten oder auch variable, tatsächlich mit CLM bezahlte Kosten zählten, blieb offen. So konnte ein allgemeiner Regulation-Aufschlag bei CLM-Zahlung als Klima gelten und durch Adaptation Strategy entfallen. Absatz (d) erfasste zudem Klima-Kostenbefreiungen möglicherweise selbst.

**Vorschlag:** Herkunft und Typ des Modifikators unveränderlich bestimmen. Nur gedruckte CLM-Pflichtkosten beziehungsweise ausdrücklich markierte Effekte klassifizieren; gewählte Zahlungsressourcen ändern Aufschlagsherkunft nicht. Keine rekursive Neuklassifikation der eigenen Kosten.

**Angenommene Regelentscheidung R24a — Statische Herkunft:** Effekte aus EXP-03-Maßnahmen und ausdrücklich als Klimaeffekt definierte Tile-/Regeltexte sind Climate effects; auch eine ausdrücklich gedruckte verpflichtende CLM-Basiskost ist ein statisches Kennzeichen. Die bloße Erwähnung einer Befreiung oder die Wahl von CLM für eine freie Zahlung klassifiziert keine fremde Operation neu. Eine erlaubte spätere Kostenersetzung entfernt umgekehrt das vorhandene Herkunftskennzeichen nicht. Das Ausführen einer CORE-Aktion auf einem CLM-Tile macht diese Aktion nicht allein deshalb zum Klimaeffekt. Reservierte/exkludierte Inhalte werden durch Klassifikation nicht aktiv.

**Angenommene Kostenbestandteile R24a:** Jeder Bestandteil behält seine verursachende Regel/Effektinstanz und seine Art: Basiskost, zusätzlicher Aufschlag oder feste Ersatzzahlung. Die Herkunft eines aufgeschlagenen Bestandteils wird nicht auf die ganze Aktion oder auf andere Bestandteile übertragen. Eine Intergenerational-Pact-Übertragung behält Quelle und Art; sie ist keine neue Kostenursache. Bei Supplemental Budget entfällt der ursprüngliche Bestandteil und die neue feste Zahlung stammt aus dessen EXP-01-Regel, statt die alte Klimaklassifikation zu übernehmen.

**Angenommene R24a-Grenze der Befreiungen:** Adaptation Strategy, Technology Initiative und Future Pact entfernen innerhalb ihres jeweils geltenden Schutzumfangs ausschließlich zusätzliche Ressourcen-Kostenbestandteile mit Klimaquelle. Gedruckte Kartenpreise/sonstige Basiskosten, feste Greenwashing-/Supplemental-Budget-Ersatzzahlungen, Verbote und nichtklimatische Aufschläge bleiben bestehen. Eine Befreiung filtert Kostenbestandteile; sie löscht weder sich selbst noch andere Effektinstanzen. Keine erneute Kostenauflösung oder rekursive Neuklassifikation durch diesen Filter.

**Beispiele R24a:** Carbon-Levy-Aufschlag 1 CLM oder 1 DOM bleibt klimatisch, auch bei DOM-Zahlung. Energy Crisis bleibt eine Klimaquelle für seinen DOM-Aufschlag. Administration oder State of Exception bleiben nichtklimatisch, selbst wenn deren freie Zahlung mit CLM erfolgt. Eine erforderliche Greenwashing-Ersatzgebühr bleibt trotz Klimaquelle feste Ersatzzahlung und wird durch die drei Aufschlagsbefreiungen nicht aufgehoben. R24a ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R24a:** EXP-03-02-D-01 bis -06. Änderungshistorie: `docs/rules/ERRATA-0026-climate-cost-classification.md`.

**Freigabe R24a:** Nutzerbestätigung „ja“ am 2026-11-08 auf feste Klima-/Kostenherkunft, Typentrennung und Beschränkung der Befreiungen auf zusätzliche Klimaaufschläge. Schutzumfang und Übertragungsreihenfolge wurden anschließend separat unter R24b freigegeben. Game-Code wurde hier nicht angepasst.

**Ursprünglicher ergänzender Befund R24b — Schutzumfang und Reihenfolge:** Adaptation Strategy benennt unqualifiziert „Actions“, Technology Initiative „your Political Action“, Future Pact „affecting you“. Globaler gegenüber persönlichem Schutz sowie dessen Bezug bei Übertragung auf einen anderen Zahler müssen ausdrücklich festgelegt werden. Ebenso ist zu entscheiden, ob Befreiungen vor Kostenübertragungen geprüft werden oder der neue Zahler zusätzliche Befreiungen einbringen kann, und wann dann Pact verbraucht wird. Die statische Herkunft aus R24a allein entschied diese Punkte nicht; R24b wurde anschließend eigenständig freigegeben. Die Schutzkarten wurden bei R24a noch nicht umgeschrieben.

**Angenommene Regelentscheidung R24b — Schutzumfang:** Adaptation Strategy gilt global für spielerbezahlte Vorgänge aller Spieler, einschließlich kostenpflichtiger Tile-Platzierung. Technology Initiative wird regulär als PlayMeasure ausgespielt und schützt ausschließlich die eine anschließende zulässige Nicht-PlayMeasure-Political-Action des Inhabers in diesem Zug, nicht einen neuen Handkarten-Zeitpunkt oder eine getrennte Folgeoperation. Wird der Zusatzslot nach R15c ohne Aktion abgeschlossen, entsteht keine nachholbare Nutzung. Future Pact gilt persönlich für Klimaaufschläge, deren ursprünglicher regelbestimmter Zahler der Karteninhaber ist, einschließlich Tile-Platzierung und ausdrücklich späterer eigener Operationen; der aktive Spieler kann bei einer solchen Operation jemand anderes sein. Bestehende gedruckte Dauern bleiben unverändert, exakte Grenzdefinitionen bleiben R25.

**Angenommene R24b-Reihenfolge im Kostenplan:** Nach Start-Immunität, Verbotsprüfung und Sammlung der Aufschläge alle anwendbaren Klimaaufschlags-Befreiungen nach R24a und dem eben definierten Schutzumfang anwenden. Dann optional Supplemental Budget auf einen verbliebenen geeigneten Bestandteil anwenden, danach Intergenerational Pact auf einen verbliebenen positiven zusätzlichen Bestandteil. Erst den daraus vollständig legalen Zahlungsplan mit zulässigen Ressourcensubstitutionen atomar ausführen. Derselbe Aufschlag wird höchstens einmal entfernt; Befreiungen erzeugen keinen Verbrauch anderer Effekte und keine Ersatzzahlung.

**Angenommene R24b-Übertragungsgrenze:** Persönlicher Schutz wird anhand des ursprünglichen Zahlers vor Übertragung geprüft. Der Empfänger eines übertragenen Kostenbestandteils erhält keine neue Befreiungsprüfung durch dessen Zuweisung. Quelle/Art bleiben gemäß R24a erhalten, der Empfänger muss den verbliebenen Bestandteil nach Pact vollständig zahlen. Entfallene Bestandteile und feste Ersatzgebühren sind nicht übertragbar. Pact wird nur bei tatsächlich ausgeführter Übertragung und erfolgreicher Gesamtabwicklung nach R17b verbraucht; ohne verbleibenden Bestandteil kein Transfer und kein Pact-Verbrauch.

**Beispiele R24b:** A ist durch Future Pact geschützt: sein Climate-Aufschlag entfällt vor einer möglichen Übertragung; Pact bleibt ungenutzt. Ist nur B persönlich geschützt, A aber ursprünglicher Zahler eines Klimaaufschlags, schützt B's Future Pact nicht vor dem von A auf B übertragenen Bestandteil; B muss zahlen können. Eine globale Adaptation Strategy hätte den Aufschlag bereits vor Übertragung entfernt. Diese Originalzahler-Grenze ist eine neue ausdrückliche Designentscheidung und nicht allein aus R24a ableitbar. R24b ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R24b:** EXP-03-02-D-07/-08; EXP-03-08-M08-04/-05; EXP-03-08-M09-04 bis -06; EXP-03-08-M10-04/-05 und EXP-03-08-M13-10. Änderungshistorie: `docs/rules/ERRATA-0027-climate-protection-scope.md`.

**Freigabe R24b:** Nutzerbestätigung „ja“ am 2026-11-08 auf Schutzbereiche, ursprünglichen Zahler vor Übertragung und Kostenplan-Reihenfolge. Game-Code wurde hier nicht angepasst.

### R25 — Gemeinsame Zeitgrenzen und kanonischer Produktionswortlaut angenommen

**Stellen:** EXP-01-04-A-01 bis -03; EXP-01-07-06 und -07; EXP-02-07-02 und -03; EXP-03-04-A-01 bis -04; EXP-03-07-02 und -04; EXP-03-08; EXP-01-08-M10-05; EXP-03-10-04.

EXP-03 verwendet trotz abschließender Timing-Liste unter anderem „Immediate“, „Until the beginning of your next turn“, „During the target player's next turn“ und „Until the end of the next round“. **Spezifische Kartendauern können nach CORE-01-10-02 Ausnahmen sein.** Die Karten sind dadurch nicht automatisch ungültig; die Liste ist dennoch unvollständig.

**Ursprünglicher Zeitbefund:** Erweiterungsrunden enthielten Settlement, „This round“ endete ausdrücklich davor. Das war als enger definierte Dauer auslegbar: Solche Modifikatoren galten dann im Settlement nicht mehr. R25a schließt Settlement nun ausdrücklich ein und legt auch die Grenze von „End of the next round“ fest.

**Ursprünglicher Begriffsbefund:** „Overlay“ in M10 und EXP-03-10-04 war nicht definiert. R22 hat den Begriff an EXP-01-M10 inzwischen ausdrücklich als Regulation präzisiert; R25b hat anschließend die EXP-03-Stelle ausdrücklich durch Regulation präzisiert und die EXP-01-Reduktionen vollständig in die kanonische Produktionsreihenfolge eingeordnet.

**Vorschlag:** Gemeinsames vollständiges Timing-Vokabular und exakte Ereignisgrenzen definieren. „This round“ bewusst vor oder einschließlich Settlement wählen. Overlay durch den gemeinten definierten Begriff ersetzen; sämtliche Produktionsmodifikatoren in einer vollständigen Pipeline verorten.

**Angenommene Regelentscheidung R25a — Gemeinsame Spieluhr:** Dauerbegriffe zentral und erweiterungsunabhängig an Spielereignissen definieren. Registrierung gilt nicht rückwirkend; ausdrücklich zukünftige Fenster aktivieren erst an ihrem Beginn. Ein Zug umfasst Draw/Place, Hotspots, die gesamte Political-Action-Sequenz einschließlich Zusatzaktion, Nachfüllung und vorgeschriebener Folgeauflösungen; er endet vor Settlement. Eine Runde umfasst Spielerzyklus plus Settlement, mit der bereits freigegebenen verkürzten finalen Runde. Ein begonnener Zug mit erfolglosem Leerziehen endet gemäß R05 ohne Political Action, zählt aber als begonnener Zug.

**Angenommene R25a-Dauergrenzen:** Immediate löst im aktuellen erlaubten Vorgang vollständig auf; This turn endet nach dem vollständigen Zug vor Settlement; This round endet erst nach dem aktuellen Settlement. During this Round Settlement, During Round Settlement und During the next Round Settlement bezeichnen im regulären Ausspielfall das nächste anstehende Settlement, einschließlich finalem, und enden danach. Next round beginnt erst mit der tatsächlich nächsten Runde und endet nach deren Settlement. Until the end of the next round wirkt dagegen schon ab Registrierung bis nach diesem nächsten Settlement. Until the beginning of your next turn endet vor Phase 1 des nächsten tatsächlich begonnenen Zuges des ursprünglichen Inhabers. During the target player's next turn wirkt ausschließlich ab Phase 1 des nächsten Zielspielerzuges bis dessen vollständigem Ende. Until consumed endet nur nach dem normativ festgelegten Verbrauch einschließlich ausdrücklich benannter Fehlschläge.

**Angenommene bewusste Änderung This round:** Die bisherige Grenze vor Settlement wird ausdrücklich auf nach Settlement verschoben. Damit bleiben Rundeneffekte wie Order Partnership, Surveillance oder State of Exception während zulässiger Settlement-Operationen aktiv; State of Exception erhält dadurch weiterhin keine Gebühr für automatische Produktion nach R15a. Ablauf bestehender Rundeneffekte nach Settlement, anschließend nur bei tatsächlicher neuer Runde deren Nutzungsflags zurücksetzen und Next-round-Fenster beginnen. Am Zugbeginn erst dort endende Wirkungen beenden, dann für diesen Zug vorgesehene Wirkungen aktivieren, jeweils vor Draw/Place. Keine Systemzeit, keine neuen Handkartenfenster.

**Angenommene R25a-Grenzen am Spielende und bei Objekten:** Finale Settlements zählen als wirkliche Settlements. Wird danach keine neue Runde/kein weiterer Zug begonnen, werden entsprechende zukünftige Fenster nicht künstlich ausgelöst oder nachgeholt. Ein Wirkungsablauf nimmt keine bereits vollständig ausgeführten Ergebnisse zurück: platzierte Regulations/Influence/Resources bleiben nach ihren Objektregeln bestehen, sofern keine ausdrückliche Entfernungsregel gilt. Es entsteht keine Countdown-Automatik; R18 bleibt maßgeblich. Unvollständige lokale Timing-Listen durch Verweise auf dieselbe Spieluhr ersetzen, ohne neue Ausspielrechte zu erfinden.

**Separater Teilpunkt R25b:** Die verbleibende EXP-03-10-04-Bezeichnung Overlay ausdrücklich als Regulation klären und alle zulässigen Produktionsmodifikatoren vollständig der kanonischen Pipeline zuweisen. Die unter R15b/R19 bereits freigegebenen Settlement-/Auszahlungsstufen bleiben erhalten; mögliche Präzisierung additiver Modifikatoren und einmaliger abschließender Floor wird separat vorgestellt. R25a wurde separat freigegeben und normativ übernommen; R25b wurde anschließend ebenfalls eigenständig bestätigt.

**Normative Übernahme R25a:** CORE-01-07-01/-06 und -07 bis -18; EXP-01-04-A-01 bis -03 und EXP-01-07-06/-07; EXP-02-07-02 bis -04; EXP-03-00-09, EXP-03-04-A-01 bis -04 und EXP-03-07-02/-04 samt bestehendem Flag-Absatz. Änderungshistorie: `docs/rules/ERRATA-0028-shared-game-clock.md`. Die unter R26 dokumentierten doppelten/falschen IDs bleiben bis zur separaten Bereinigung bestehen.

**Freigabe R25a:** Nutzerbestätigung „ja. absolut.“ am 2026-11-08 auf die gemeinsame Zeitdefinition einschließlich This round mit vollständigem Settlement, Grenzreihenfolge, tatsächlichen Folgerunden und Erhalt abgeschlossener Ergebnisse. Game-Code wurde hier nicht angepasst.

**Angenommene Regelentscheidung R25b — Einheitlicher Produktionswortlaut:** EXP-03-10-04 verweist vollständig auf CORE-01-06-16; Overlay wird dort durch den definierten Begriff Regulation ersetzt. Blockade und sonstige Verbote zuerst gemäß bestehendem Resolver; automatische Produktion erhält nach R15a keine Ressourcen-Kostengebühr. Druckwert nehmen, danach jede ausdrücklich zulässige Verdopplung, dann alle zulässigen additiven Produktions-Output-Modifikatoren aus EXP-01, EXP-03 und Regulations gemeinsam verrechnen. Dazu gehören insbesondere die bisher im EXP-03-Satz fehlenden EXP-01-Reduktionen und SecurityLevel. Erst anschließend einmal Floor 0 anwenden. Keine separate Zwischen-Untergrenze je Erweiterung oder Modifikatorquelle.

**Angenommene R25b-Verteilungsfolge:** Nach endgültigem Output die kanonische Mehrheit bestimmen, reguläre Anteile und ursprünglichen Noise-Rest berechnen, dann Empfängerlimits nach R19 auf die betroffenen Anteile anwenden und ausschließlich die endgültigen Transfers ausführen. Supply Chain Disruption ist weiterhin kein Tile-Output-Modifikator. Investment Freeze filtert nach R13 nur die ausdrücklich betroffenen Maßnahmenmodifikatoren; Regulation-Modifikatoren bleiben erhalten. Reine unmittelbare Ressourcengewinne wie Future Investment werden durch diesen Wortlaut nicht zu Resort-Produktion.

**Angenommene R25b-Stapelgrenze:** Mehrere ausdrücklich erlaubte Verdopplungen werden im Verdopplungsschritt jeweils angewendet; dies autorisiert keine zusätzlichen Instanzen oder bisher verbotene Stapelung. Additive Änderungen werden vor einem gemeinsamen Floor summiert; Kosten-/Verbots-Regulations werden nicht als numerische Output-Abzüge interpretiert. Das ist eine Präzisierung der kanonischen Pipeline, keine zweite Produktionsberechnung.

**Beispiele R25b:** Druckwert 3, Verdopplung und zweimal -1 (ein Maßnahmenabzug, ein SecurityLevel) ergeben Output 4. Bei positivem Gleichstand A/B zunächst je 2, Noise 0; unter Supply Chain Disruption erhält A endgültig 1, B 2, während 1 in Bank verbleibt. Druckwert 1, Verdopplung und drei zulässige -1-Modifikatoren ergeben zunächst -1 und nach gemeinsamem Floor Output 0. R25b ist nach Nutzerfreigabe normativ übernommen.

**Normative Übernahme R25b:** CORE-01-06-16-00, CORE-01-06-16(a)(2) bis (4), CORE-01-06-17, EXP-01-04-B-03, EXP-03-05-03/-04 und EXP-03-10-04. Änderungshistorie: `docs/rules/ERRATA-0029-canonical-production-wording.md`.

**Freigabe R25b:** Nutzerbestätigung „passt“ am 2026-11-08 auf vollständige Produktionsreihenfolge, gemeinsame additive Verrechnung, einmaligen Floor und Regulation statt Overlay. Game-Code wurde hier nicht angepasst.

### R26 — Eindeutige Anker und Bearbeitungsrest bereinigt

**Stellen:** EXP-01-07-07 zweimal in `001-expansion01.md`; EXP-01-07-03 innerhalb von `003-expansion03.md`; Text vor EXP-03-08.

**Ursprünglicher Befund:**

- `EXP-01-07-07` bezeichnete Flag-Reset und Verbot weiterer Zeitfenster.
- EXP-03 trug beim Flag-Reset fälschlich `EXP-01-07-03`; diese ID bezeichnet in EXP-01 den FinalDiscard nach zweitem Spiel.
- Vor EXP-03-08 stand ein deutschsprachiger Bearbeitungsrest („Hier ist die identische …“), keine Spielregel.

**Vorschlag:** Eindeutige IDs vergeben, betroffene Code-/Dokumentreferenzen gezielt migrieren und Fremdtext entfernen. Nicht pauschal umnummerieren. Doppelte ID und falscher Präfix wurden zusätzlich mechanisch bestätigt.

**Angenommene Regelentscheidung R26 — Gezielt zwei Anker korrigieren:** EXP-01-07-07 bleibt die ID des Per-Round-Usage-Flags-Absatzes. Nur die zweite Verwendung für die Aussage ohne zusätzliches Ausspielfenster erhält EXP-01-07-07A. Der falsch als EXP-01-07-03 bezeichnete Nutzungsflag-Absatz im EXP-03-Dokument wird EXP-03-07-03. Die echte EXP-01-07-03-Regel zum FinalDiscard nach zweitem Spiel bleibt unverändert. Keine pauschale Umnummerierung oder globale Ersetzung dieser Zeichenfolge.

**Angenommener R26-Bereinigungsumfang:** Den fünfzeiligen deutschen Bearbeitungsrest vor EXP-03-08 einschließlich überflüssigem Trenner entfernen; normativen Karteninhalt beibehalten. Dokumentationsverweise auf die korrigierten Absätze gezielt nachziehen, ursprüngliche Befunde/alte IDs im Prüfverlauf als historische Referenzen erhalten. Den vorhandenen Task-Text zur Flag-Rücksetzung an das bereits freigegebene R25a anpassen (nur tatsächlicher neuer Rundenbeginn nach Settlement).

**Referenzprüfung und Grenze:** Die Suche einschließlich ignorierter Dateien in packages/scripts/docs fand einen Code-Verweis auf EXP-01-07-07 in `packages/game/src/factory.ts` beim Flag-Reset sowie denselben gültig bleibenden Verweis im Task `docs/tasks/0027_measures_framework_exp01.md`. Der Code-Anker bleibt richtig und benötigt keine Änderung. Die R26-Bereinigung betrifft Regel-/Dokumenttexte. Die anschließende Prüfung über alle vier normativen Spezifikationen ergibt 801 eindeutige Regel-/Abschnittsanker ohne doppelte Definitionen; alle ausgeschriebenen vollständigen Abschnittsverweise sind auflösbar. Keine funktionale Game-Code-Änderung.

**Normative Übernahme R26:** EXP-01-07-07A und EXP-03-07-03; fünfzeiligen Bearbeitungsrest entfernt; Task 0027 beim Reset-Zeitpunkt an CORE-01-07-17 angepasst und ältere Testergebnisse ausdrücklich als historisch gekennzeichnet. Änderungshistorie: `docs/rules/ERRATA-0030-rule-anchor-cleanup.md`.

**Freigabe R26:** Nutzerbestätigung „ja“ am 2026-11-08 auf gezielte redaktionelle Bereinigung einschließlich Referenz-/Eindeutigkeitsprüfung. Bestehender gültiger Code-Anker blieb unverändert.

## Alle Erweiterungskombinationen

Alle Kombinationen betrafen ursprünglich R01–R08; R01–R11 und R13–R26 sind inzwischen normativ geklärt, außerdem der SEC-Erwerb aus R12 durch R02. Die Tabelle hält den Prüfstand mit diesen Fortschreibungen fest. Dies ist eine Textprüfung, keine bestandene Integrationstestsuite und kein Nachweis einer Softwareanpassung.

| Aktive Erweiterungen | Zusätzliche besonders relevante Befunde |
| --- | --- |
| Keine | CORE-Grundentscheidungen R01–R08 dokumentiert; Softwareanpassung ausstehend. |
| EXP-01 | Supplemental Budget R22, Investment Program R21, Komponenten R20, R13/R17, Markt R09 und Zeitgrenzen R25a geklärt. Produktionswortlaut R25b ist geklärt; Anker R26 sind bereinigt. |
| EXP-02 | R13–R17, Maßnahmenframework R10, SEC-Erwerb R02 und Zeitgrenzen R25a geklärt. Produktionswortlaut R25b ist geklärt; Anker R26 sind bereinigt. |
| EXP-03 | R25a, R17–R20 und R23/R24 sind angenommen; Produktionswortlaut R25b ist geklärt; Anker R26 sind bereinigt. R11/R18 bestimmen das Deck mit 13 Karten mit EXP-01 bzw. 10 ohne EXP-01. |
| EXP-01 + EXP-02 | Gemeinsame Limits, Regulation-Kosten/Output, Settlement-Reihenfolge, Effektinstanzen, Komponenten, Investment Program und Supplemental Budget geklärt. Zeitgrenzen R25a sind geklärt; Produktionswortlaut R25b ist geklärt; Anker R26 sind bereinigt. |
| EXP-01 + EXP-03 | ECO vorhanden; Empfängerlimit R19, Komponenten R20, Investment Program R21, Supplemental Budget R22 und Influence-Unterdrückung R23 geklärt. Klima-Schutzumfang R24 und Zeitgrenzen R25a sind geklärt; Produktionswortlaut R25b ist geklärt; Anker R26 sind bereinigt. |
| EXP-02 + EXP-03 | Maßnahmenframework, SEC-Erwerb, Deckaufbau, Kosten-/Output-Grenzen, Effektinstanzen und Influence-Unterdrückung geklärt. Countdown durch R18 reserviert, Klimadeck ohne ECO mit 10 Karten; R19 ist entschieden, seine ECO-Karte ohne EXP-01 ausgeschlossen. Klima-Schutzumfang R24 und Zeitgrenzen R25a sind geklärt; Produktionswortlaut R25b ist geklärt; Anker R26 sind bereinigt. |
| EXP-01 + EXP-02 + EXP-03 | Maßnahmensystem, Komponenten, Deckaufbau, ContextTile, Zahler, Settlement, Output, Effektinstanzen, Empfängerlimit, Investment Program, Supplemental Budget, Influence-Unterdrückung, Klima-/Kostenherkunft und Schutzumfang geklärt; Countdown reserviert, Klimadeck mit 13 Karten; Zeitgrenzen R25a geklärt. R25b ist geklärt; R26 ist bereinigt. |

## Bereits durch Spezifität auflösbare Punkte

- Start-Committee-Kosten und Einmal-pro-Spiel-Limit ersetzen Standardformalisierung. Die Timing-Sperre bleibt ausdrücklich bestehen (CORE-01-08-06B).
- Cap 8 für 5–6 Spieler ersetzt ausdrücklich Cap 7 (ADD56-01-03-00-01).
- Inner Order vergibt ausdrücklich keine Influence und ersetzt die allgemeine Hotspot-Auszahlung (EXP-02-02-G-04 und -07).
- Labor Market ordnet keine ausdrückliche Neuschöpfung/andere Zielzone an; „no additional special rules“ belässt den CORE-Transfer aus PersonalSupply (EXP-01-02-C-06).
- R08 beschränkt Gleichstandsproduktion ausdrücklich auf positive höchste Gesamtwerte; bei 0:0 gibt es weder Auszahlung noch Noise.
- Kartendauern können allgemeine Timing-Listen übersteuern (R25). Daraus folgt kein zusätzliches Recht zum Spielen außerhalb von PlayMeasure (R13).
- Informative Symbole ergänzen keine fehlenden normativen Effekte.

## Historische Implementierungschecks und Dokumentationsprüfung

- `pnpm test`: bei der Erstprüfung bestanden, 30 Testdateien / 65 Tests, einschließlich Golden Replay.
- `pnpm lint`: bei der Erstprüfung nicht bestanden; drei bereits vorhandene `no-explicit-any`-Fehler in `packages/server/src/bot.runner.ts:22`. Die Datei wurde nicht verändert.
- `pnpm check:encoding`: bei der Erstprüfung nicht bestanden; vorhandene Encoding-Probleme in `docs/changelog.md`, `docs/llm/local-bot-ollama.md`, `scripts/fix-fffd-rewrite.mjs`, `scripts/replace-fffd.mjs` und `scripts/utf8-clean.mjs`. Alle fünf Befunde sind bereits im HEAD-Stand nachweisbar. Der Changelog wurde byteerhaltend nur ergänzt.
- Neuer Bericht: gültiges UTF-8 ohne BOM oder Ersatzzeichen; 26 eindeutige Befundüberschriften.
- `git diff --check`: bei der Erstprüfung bestanden. Damals wurden nur dieser Bericht und der Changelog geändert; nach Freigabe von R01–R11 und R13–R26 wurden zusätzlich CORE-/Erweiterungsregeltexte und ERRATA-0001 bis -0030 angepasst. Es gibt weiterhin keine Codeänderungen oder temporären Dateien.
- Ausführungsumgebung der Repository-Checks: Node v24.18.0, pnpm 10.18.0. pnpm meldet eine Engine-Abweichung gegenüber `>=20.11.0 <23` und `.nvmrc` v20.11.1; Tests sind daher kein Nachweis für die vorgesehene Node-Version.

Bestandene Implementierungstests widerlegen die textlichen Regelbefunde nicht. Es wurden keine neuen Tests geschrieben, die unfreigegebene Auslegungen festlegen würden.

Die oben genannten Codechecks beziehen sich auf den weiterhin unveränderten Implementierungsstand. Bei der Dokumentationsfortschreibung werden Diff, Encoding und Befundanker erneut geprüft. R01–R11 und R13–R26 sind nach Nutzerbestätigung angenommen und normativ übernommen; R12 ist durch R02 geklärt. Für die 26 erfassten Befunde bleibt keine Regelentscheidung offen. Die ursprünglichen Tests sind kein Nachweis, dass die Software die neuen Fassungen zu R01–R11 und R13–R26 erfüllt.

### Abschlussprüfung 2026-11-08

- Alle vier normativen Spezifikationen zusammen: 801 eindeutige Regel-/Abschnittsdefinitionen; keine doppelten Anker. Alle ausgeschriebenen vollständigen Abschnittsverweise sind auflösbar. Kapitelauflistungen im Inhaltsverzeichnis werden nicht als zweite Definition gezählt.
- Alle 26 Befundüberschriften sind eindeutig und vollständig; ERRATA-0001 bis -0030 sind vorhanden. Kein Befund enthält noch einen nicht freigegebenen aktuellen Empfehlungsteil.
- Alle 36 geänderten Dokumente außer dem bekannten Legacy-Changelog bestehen die strikte UTF-8-Prüfung ohne BOM und Ersatzzeichen. Der alte Changelog-Inhalt bleibt erhalten; nur Audit-Einträge wurden angehängt.
- `git diff --check` bestanden. Genau 37 erwartete Dokumentdateien geändert/ergänzt; keine Code-, Konfigurations- oder temporären Dateien. `packages` und `scripts` gegenüber HEAD unverändert.
- R26-Referenzprüfung bestanden: bestehender Code-Anker für Flag-Reset bleibt gültig, FinalDiscard behält seine eigene ID, Climate-Flag-Absatz und Play-Window-Absatz haben eindeutige IDs. Kein normativer Overlay-Begriff und kein deutscher Bearbeitungsrest mehr vorhanden.
- Keine neuen Implementierungstests in diesem Dokumentationsabschluss ausgeführt. Die oben protokollierten früheren Laufzeit-/Lint-Ergebnisse bleiben ausdrücklich historische Bestandsprüfung; Validierung der konsolidierten Spielregeln im Code steht aus.

## Entscheidungsabschluss und ausstehender Softwareabgleich

1. CORE vervollständigen: R01–R08 sind normativ angenommen; die CORE-Grundentscheidungen sind dokumentiert; die Codeanpassung steht aus.
2. Maßnahmenframework: R09/R10, die Zeitfenster R13 und R17a/R17b sind angenommen. R11 ist angenommen und R12 durch R02 geklärt.
3. Ressourcen und Komponenten: R20, R18 und R11 sind angenommen. R04 ist angenommen; der SEC-Erwerb aus R12 ist bereits durch R02 geklärt.
4. R14, R15a/R15b/R15c, R16, R17a/R17b und R18–R26 sind angenommen; R26 ist bereinigt und geprüft.
5. Als nächster Arbeitsbereich bleibt der Softwareabgleich gegen die konsolidierten Regeln: Zustands-/Setup-Modelle und gemeinsame Effekt-/Zeitauflösung, legale Aktionen/Bot-Auswahl sowie passende Unit-, Golden-Replay- und alle acht Erweiterungskombinationstests. Dieser Implementierungsschritt wurde hier nicht begonnen.

Die Regelprüfung und die Abstimmung aller 26 erfassten Befunde sind abgeschlossen. R01–R11 und R13–R26 sind über ERRATA-0001 bis -0030 normativ übernommen; R12 ist eine geklärte Folge von R02. Es gibt keine aus diesem Audit verbliebene offene Regelentscheidung. Das ist kein Beweis allgemeiner Widerspruchsfreiheit oder Softwarekonformität. Game-Code wurde hier nicht geändert; dessen Abgleich und Validierung gegen die konsolidierten Regeln stehen aus.
