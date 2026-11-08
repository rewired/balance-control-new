# DD-0030 — Engine-Optionen und Vorschauhash

Stand 2026-11-08. Task 0030, S15.

Pflichtslots und Bot verwenden dieselbe Zahlungsplanung. Die Suche berücksichtigt explizite Ressourcenauswahl, Supplemental Budget, Intergenerational Pact, Economic Council und Order Partnership. Jede ausgegebene Option enthält die tatsächlichen Zahler und Beträge. Sie wird mit der ausgewählten Zahlung vollständig aufgelöst, bevor sie der Bot wählen kann. CORE-01-04-09A bis -09C und CORE-01-06-00-07 bis -12.

Für den Vorschauhash verarbeitet der boardgame.io-Reducer jede Option auf einem separaten Zustandsabbild. Der Hash umfasst den resultierenden Domainzustand und Engine-Kontext einschließlich der dadurch ausgelösten Phasenwechsel. Der Runner vergleicht ihn nach dem tatsächlichen Zug mit dem berechneten Hash. Der Turn-Checkpoint im Spielzustand bleibt separat und folgt weiterhin dem vollständigen Zug.

Der Bot schickt dem Backend die geordneten Optionen mit ihren nullbasierten Indizes. Ein ungültiger Index, ein ungültiges Antwortformat oder ein ausgefallenes Backend führt zur ersten legalen Option. Die Engine führt leere Pflichtslots automatisch weiter.
