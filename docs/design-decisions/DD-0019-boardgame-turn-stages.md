# DD-0019 — Setup und Zuggrenzen in boardgame.io

- Datum: 2026-11-08
- Status: Implementiert und über boardgame.io 0.50.2 geprüft
- Bezug: S01/S02 und der Eingabeablehnungsteil von S04 aus DD-0018

Ein Spielzug umfasst Ziehen und Platzieren, Hotspot-Auflösung und die vollständige politische Aktionssequenz. `endPhase` beendet in boardgame.io den laufenden Engine-Turn. Deshalb bildet ein Engine-Turn den gesamten Spielzug ab. Die Engine-Stages `DrawAndPlaceTile` und `ExactlyOnePoliticalAction` begrenzen die zulässigen Moves desselben aktiven Spielers. `AdditionalPoliticalAction` bildet den zweiten Slot nach einem erfolgreichen PlayMeasure ab. Maßgeblich sind CORE-01-04-01 bis -04, CORE-01-06-03, CORE-01-07-08 und EXP-01-06-05. [Turn-Konfiguration](../../packages/game/src/core.turns.ts)

Die Factory liest `ctx.numPlayers` aus dem Setup-Kontext und übernimmt `setupData` als zweites Argument. Für zwei bis vier Spieler werden die Startmengen aus CORE-01-03-04 bis -06 angewendet. Die Setup-Daten ersetzen die Factory-Vorgaben, wenn sie angegeben sind. `matchSeed` steuert die deterministischen Tile- und Maßnahmenstapel über `G.matchSeed`. Der Startwert `match` gilt bei fehlendem Seed. Der Engine-Zufallsplugin erhält einen deterministischen Factory-Seed. `setupCoreMatch` stellt dem bestehenden Headless-Runner denselben Initialisierer vor Beginn des ersten Zugs bereit. [Factory](../../packages/game/src/factory.ts)

Der Game-Layer wartet auf ein erfolgreiches Resolverergebnis, bevor er die Stage wechselt oder den Turn beendet. Schemafehler, unzulässige Slots und verweigerte Auflösungen liefern `INVALID_MOVE`. Der Move-Katalog kennzeichnet PlayMeasure für die Slotprüfung. Die Engine hält den Zusatzslot im Turn-Kontext. Das Rundensettlement beginnt am Ende des letzten vollständigen Zugs nach CORE-01-07-02/-03. Die EXP-01-Nutzung wird am Beginn der folgenden Runde nach CORE-01-07-17 und EXP-01-07-07 zurückgesetzt. [Move-Katalog](../../packages/rules/src/moves.ts), [Turn-Konfiguration](../../packages/game/src/core.turns.ts)

Die Tests rufen `InitializeGame` und `createMatch` für Spielerzahl, Setup-Daten, Seed und Validierung auf. Ein echter `Client` spielt zwei volle Runden zweimal mit derselben Aktionsfolge. Die Tests vergleichen Spieler, Stages, Produktionsauszahlungen und die Zustandshashes nach jedem Zug. Ein weiterer Client-Test prüft den Zusatzslot mit den vorhandenen EXP-01-Scaffold-Moves bis zum nächsten Rundenbeginn. [Setup-Tests](../../packages/game/src/factory.test.ts), [Startmarker-Tests](../../packages/game/src/core.state.test.ts), [Zug-Replay](../../packages/game/src/core.turns.test.ts), [Maßnahmen-Tests](../../packages/game/src/exp01.measures.test.ts)

Die nächsten Umsetzungsschritte für politische CORE-Aktionen, Spielabschluss, Ressourcentransfers und das gemeinsame Effektmodell sind in Task 0030 verzeichnet. [Task 0030](../tasks/0030_rules_conformity_implementation.md)
