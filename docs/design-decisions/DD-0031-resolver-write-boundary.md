# DD-0031 — Resolvergrenze und fehlgeschlagene Zahlungsversuche

Stand 2026-11-08. Task 0030, S04/S13/S14/S19.

Der Resolver verarbeitet Budget Deficit am Versuch. Scheitert die vollständige Planung an der Zahlung, wird derselbe Plan erneut geprüft, wobei ausschließlich die Budget-Deficit-Einheiten als unbezahlt gelten. Ziele, Verbote, übrige Kosten und die Auswahlregeln für Zahlungseffekte gelten auch bei dieser Prüfung. Nur wenn der übrige Plan aufgeht, werden die betreffenden Budget-Deficit-Instanzen verbraucht. Der Pflichtslot verlangt weiterhin eine legale Aktion. Beim automatisch abgeschlossenen leeren Slot greift ausschließlich die Regel für diesen Fall. CORE-01-04-09 bis -09C, CORE-01-06-00-10 bis -12 und EXP-01-08-M06-05 bis -07A.

Blockade hat einen eigenen Verbots-Hook, den der Resolver vor den übrigen Verboten auswertet. Situation Assessment ermäßigt die nächste Regulation-Platzierung in der Runde auf mindestens ein SEC. Die beteiligten Instanzen werden erst mit erfolgreicher Platzierung als verwendet markiert. EXP-02-04-A-01, EXP-02-04-B-01 und EXP-02-08-M15-03.

Die Mutation-Prüfung wertet den TypeScript-Syntaxbaum und die Herkunft von Referenzen aus. Sie erfasst direkte Schreibzugriffe und typische Aliasformen wie Destrukturierung, Schleifen und Array-Zugriffe. Der einzige autorisierte Schreibpfad für CORE-Zustand ist der Resolver. Der separate Counter-Demomove bleibt durch DD-0002 abgegrenzt. Ein Negativtest erkannte sechs Schreibzugriffe in einer temporären Server-Datei und ließ das Sortieren einer lokalen Kopie zu.

Die Engine-Tests decken den leeren Pflichtslot, einen fehlgeschlagenen Deficit-Versuch, unabhängige Trigger, Surveillance und die nächste Regulation-Platzierung ab. [Kostentests](../../packages/game/src/costs.engine.test.ts), [Regulationstests](../../packages/game/src/regulations.engine.test.ts), [Erweiterungsmatrix](../../packages/game/src/expansion.stack.engine.test.ts)
