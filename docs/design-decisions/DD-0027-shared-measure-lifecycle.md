# DD-0027 — Deckübergreifender Maßnahmenlebenszyklus

Stand 2026-11-08. Task 0030, S11/S12, T10 und T18.

Erweiterungsmodule deklarieren ihr Measure-Deck. Der Match-Setup initialisiert die separaten Zonen und die gemeinsame Nutzungsmarke über den Resolver. Der Move-Katalog bietet Take und Play je aktivem Deck an. Handlimit und PlayMeasure-Nutzung gelten über die Decks hinweg. Ohne aktives Deck entfällt die gemeinsame Nutzungsmarke. Ältere EXP-01-Speicherstände übernehmen ihre bisherige Nutzungsmarke beim ersten Schreibzugriff in die gemeinsame Struktur. EXP-01-06-00A bis -03.

Die drei Marktslots halten Karten-IDs oder `null`. Nach erfolgreichem Take oder Play füllt der Resolver leere Slots aufsteigend aus dem DrawPile oder dem deterministisch gemischten RecyclePile. PlayCounts bleiben über alle Transfers erhalten. Die Vorschau verwendet denselben Plan für die Zonenprüfung, die Limits, Verbote und den gemeinsamen Banktransfer wie die Ausführung. Kartenspezifische Kosten, Ziele und Wirkungen werden bei der Kartenanbindung ergänzt. EXP-01-02-E-01B, EXP-01-03-06, EXP-01-06-04C/-04D und EXP-01-07-01 bis -05D.

ResortTiles werden im Settlement unabhängig von der Einfügereihenfolge nach ordinaler Tile-ID verarbeitet. CORE-01-07-04(c).

Die Engine-Tests prüfen stabile Marktpositionen, Refill aus einer gerade gespielten Karte vor der Zusatzaktion, deckübergreifende Limits und eine umgekehrt eingefügte ResortTile-Reihenfolge. [Measure-Tests](../../packages/game/src/measure-framework.engine.test.ts), [Produktions-Tests](../../packages/game/src/production.engine.test.ts)
