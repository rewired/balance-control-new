# DD-0034 — Workspace-Pakete für CORE und Erweiterungen

Stand 2026-11-08.

Die Spielfabrik importiert und registriert `@bc/exp-00-core`, `@bc/exp-01-economy`, `@bc/exp-02-security` und `@bc/exp-03-climate`. Die Erweiterungen hängen von `@bc/rules` ab. Dort liegen der gemeinsame Modulvertrag, die Registry, die serialisierten Spieltypen und die Zahlungsplanung. Die Registrierung im Paket `@bc/game` hält diese Abhängigkeiten gerichtet.

CORE stellt den kanonischen Resolver, den Startzustand, die Platzierung, Mehrheitsberechnung, Produktion und Zugsteuerung bereit. Economy, Security und Climate registrieren ihre Kartenwirkungen über Hooks. Security plant Regulation-Operationen und liefert deren Kosten und die Commit-Funktion an den Resolver. Die Spielzustandsänderung erfolgt erst nach erfolgreicher Planung und Zahlung. CORE-01-06-00-07 bis -12 und EXP-02-04-A-06.

Die fachlichen IDs `core` und `exp01` bis `exp03` bestimmen weiterhin die gespeicherten Slices. Die CORE-Migration aus DD-0033 liegt im CORE-Paket und ist weiterhin über `@bc/game` erreichbar. Die normative Spezifikation liegt unter `docs/rules`. Paketinterne Regeltests liegen bei der jeweiligen Implementierung. Tests, die die zusammengesetzte Spielfabrik und mehrere Module ausführen, liegen bei `@bc/game`.
