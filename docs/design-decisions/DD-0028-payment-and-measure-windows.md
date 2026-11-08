# DD-0028 — Maßnahmenfenster und Zahlungskomponenten

Stand 2026-11-08. Task 0030, S04/S13/S14.

Aktive Maßnahmen speichern ihre Karten-ID und Spielnummer, ihren ursprünglichen Eigentümer, Ziele, Zeitfenster und eigene Nutzungsmarken. Die Engine verarbeitet Grenzen ausschließlich beim tatsächlichen Beginn und Ende eines Zugs oder Settlements. Ein Wartestatus für die nächste Runde oder den nächsten Zug wird erst an der betreffenden tatsächlichen Grenze aufgehoben. Die Karten können unabhängig davon erneut in den Markt oder in eine Hand gelangen. CORE-01-07-07 bis -18 und EXP-01-07-08 bis -15.

Der Zahlungsplan trennt gedruckte Kosten und zusätzliche Einheiten. Zusatzeinheiten tragen ihre Herkunft und gegebenenfalls eine Auswahl erlaubter Ressorts. Er filtert Climate-Befreiungen nach dem ursprünglichen Zahler, verarbeitet Supplemental Budget vor Intergenerational Pact und berücksichtigt Economic Council vor der endgültigen Buchung. Der Resolver bucht sämtliche Zahler und aktualisiert Nutzungsmarken erst bei erfolgreicher Auflösung. CORE-01-06-00-07 bis -12, EXP-01-08-M08/-M10 und EXP-03-02-D-03 bis -08.

Die Engine-Tests prüfen ausgewählte Ersetzungen, fehlgeschlagene Fremdzahlung, Verbrauch bei einem leeren Pflichtslot, Regulation-Identität und den Pre-Mehrheitsversuch von Emergency Decree. [Kostentests](../../packages/game/src/costs.engine.test.ts), [Regulationstests](../../packages/game/src/regulations.engine.test.ts)
