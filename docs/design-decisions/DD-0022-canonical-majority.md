# DD-0022 — Kanonische Mehrheit und Kontrollrechte

- Datum: 2026-11-08
- Status: Implementiert und geprüft
- Bezug: R01, Kontrollanteil von R08 sowie S06 und der Mehrheitsanteil von S07

`computeMajority` ermittelt Kontrolle, positive Führende und Einflusswerte aus derselben Berechnung. Der bisherige Aufruf gibt den Controller oder `null` zurück. Produktion fragt dieselbe Funktion mit `details` nach den Führenden ab. Hotspots und `getControl` verwenden den Controller. Kontrolle wird aus den aktuellen Markern berechnet und ändert sich unmittelbar nach einem Transfer gemäß CORE-01-05-01 bis -03A. [Mehrheitsdienst](../../packages/rules/src/majority.ts), [Produktionsplan](../../packages/rules/src/production.plan.ts)

Ein Lobbyist ermittelt seine eigene Kontrolle anhand realer Marker. Bei Gleichstand trägt er keinen Bonus bei. Andernfalls erhält ausschließlich sein Controller auf jedem zulässigen Nachbartile einen Punkt. Die Nachbarschaft folgt der Match-Topologie. Mehrere Boni addieren sich. Lobbyisten und das Start Committee sind als Empfänger ausgeschlossen. Die virtuellen Werte ändern die Markerbestände nicht. Maßgeblich sind CORE-01-05-04 bis -09 und CORE-01-08-05. [Mehrheitsdienst](../../packages/rules/src/majority.ts)

Nach CORE-01-05-03B reicht virtuelle Kontrolle auch für die Kontrollbedingung auf Standard Committees und Grassroots. Die politischen Aktionen prüfen beim folgenden Umsetzungsschritt zusätzlich Tile-Typ, Zeitpunkt, Kosten und die Start-Committee-Ausnahme nach CORE-01-04-14A, CORE-01-04-21A und CORE-01-08-07A. [Task 0030](../tasks/0030_rules_conformity_implementation.md)

Bei fehlenden positiven Führenden bleibt die Produktion null. Bei positivem Gleichstand wird die Ausgabe unter den kanonischen Führenden geteilt und nur der Rest geht an Noise. Das folgt CORE-01-06-13 bis -16. T01 prüft die exklusive Bonusvergabe bei 2:1 auf dem Lobbyisten und 1:1 auf dem Resort. T02 prüft das Start Committee neben einem kontrollierten Lobbyisten. T03 prüft null Auszahlung an Spieler und Noise. Der feste Engine-Replay prüft den SHA-256 mit dem korrigierten Noise-Bestand. [Mehrheitstests](../../packages/rules/src/majority.test.ts), [Produktionstests](../../packages/rules/src/production.test.ts), [Golden-Replay](../../packages/game/src/golden.test.ts)
