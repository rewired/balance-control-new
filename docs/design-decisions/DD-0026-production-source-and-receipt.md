# DD-0026 — Produktionsquellen und endgültige Anteile

Stand 2026-11-08. Task 0030, S07/S13 und R19.

Produktionsmodifikatoren deklarieren ihre Herkunft als Measure, Regulation oder sonstige Quelle. Beim Sammeln prüft Investment Freeze mit der kanonischen Mehrheitsfunktion die aktuelle Kontrolle des produzierenden Tiles. Bei Kontrolle durch das Ziel entfallen sämtliche Measure-Modifikatoren dieses Tiles. Bei Gleichstand bleiben sie wirksam. Die übrigen Quellen gehen in dieselbe Produktionsrechnung ein. EXP-01-08-M09-05/-06 und CORE-01-06-16-00.

Supply Chain Disruption greift nach der Berechnung der regulären Anteile und des ursprünglichen Noise-Rests. Für jeden betroffenen Spieler und jedes produzierende ResortTile gilt `min(Anteil, 1)`, auch bei mehreren aktiven Instanzen. Die atomare Bankbuchung verwendet nur die endgültigen Beträge. Andere Spieler, der ursprüngliche Noise-Rest und die verbliebenen Bankbestände behalten ihre regelgemäßen Beträge. CORE-01-06-16A und EXP-03-08-M11-05 bis -09.

Der Resolver speichert registrierte Wirkungen unabhängig von Kartenzonen mit deterministischer ID aus Karten-ID und Spielnummer, ursprünglichem Eigentümer und Ziel. Investment Freeze endet nach dem nächsten tatsächlichen Settlement. Supply Chain Disruption endet vor dem tatsächlich beginnenden nächsten Zug ihres ursprünglichen Eigentümers. Die Registrierung prüft die aktiven Erweiterungen einschließlich der EXP-01-Voraussetzung für Supply Chain Disruption. EXP-01-07-08 bis -10, EXP-03-03-02A, CORE-01-07-11/-14/-17/-18.

Die Engine-Tests registrieren die Wirkungen über einen Test-Move und spielen reguläre und finale Settlements aus. Kartenmaterial, Bezahlung und das reguläre PlayMeasure-Routing folgen mit den betreffenden Erweiterungsschritten. [Engine-Tests](../../packages/game/src/production.effects.engine.test.ts)
