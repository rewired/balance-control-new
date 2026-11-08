# DD-0025 — Kanonische Produktionsrechnung pro ResortTile

Stand 2026-11-08. Task 0030, S07/S13 und T07. Normgrundlage sind CORE-01-06-00-05(c), CORE-01-06-00-07(a), CORE-01-06-16 bis -17 und ERRATA-0029.

Der Resolver bindet den ContextTile an das produzierende ResortTile und prüft Verbote vor der Modifikatorsammlung. Die Produktions-Hooks aktiver Erweiterungen melden die für diese Produktion zulässigen Modifikatoren als Daten. Der Typ unterscheidet `double` von `additive` mit vorzeichenbehaftetem `delta`. Ein Hook erhält den gedruckten Produktionswert und meldet nur anwendbare Effekte. Welche Verdopplungen zugleich zulässig sind, ergibt sich aus den jeweiligen Regeln.

Die Berechnung verdoppelt den Druckwert je zulässigem Verdopplungseffekt und addiert die Nettosumme aller anwendbaren Deltas. Ein einzelner Minimum-0-Floor folgt auf die gesamte Rechnung. Danach bestimmt die kanonische Mehrheit die regulären Anteile und den ursprünglichen Noise-Rest. Der Resolver bucht die Transfers gemeinsam aus der Bank. Automatische Resort-Produktion hat keinen Payer und keinen Kostenpass.

Kartenspezifische Quellenfilter und Empfängerlimits folgen mit den aktiven Effektinstanzen. Die Reihenfolge der ResortTiles und die einmaligen Settlement-Operationen sind als eigener Schritt in Task 0030 erfasst.

T07 verwendet einen synthetischen Kosten-Hook. Er blockiert eine Spieleraktion am kontrollierten DOM-W3 bei leerem Vorrat und läuft für dessen automatischen Ertrag von 3 DOM nicht. Weitere Engine-Fälle prüfen die Verbotsschranke, den Stapel über aktive und deaktivierte Quellen sowie den ursprünglichen Noise-Rest nach Verdopplung, Nettosumme und Floor. [Engine-Tests](../../packages/game/src/production.engine.test.ts)
