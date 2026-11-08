# DD-0024 — Einmalige Hotspot-Einschließung

Stand 2026-11-08. Task 0030, S08 und T04. Normgrundlage sind CORE-01-06-01 bis -07 und ERRATA-0006.

## Zustandsvermerk

`enclosureProcessed: true` gehört zum Board-Eintrag der unveränderlichen Hotspot-ID. Das Feld entsteht erst nach der Auflösung und wird mit dem Spielzustand gespeichert und gehasht. Ein fehlender Vermerk ist der Ausgangszustand. Die Platzierungsprüfung betrachtet nur Hotspots, die vor der Platzierung offen waren, sowie das neu platzierte Tile, falls es ein Hotspot ist. Dadurch löst ein bereits vollständig eingeschlossener Hotspot aus einem älteren Spielstand beim Weiterspielen nicht nachträglich aus. CORE-01-06-02/-02A.

## Auflösung

Der Platzierungsresolver verarbeitet die Kandidaten vor Beginn der politischen Aktion in aufsteigender ordinaler Reihenfolge ihrer Tile-IDs. Jeder Hotspot prüft seinen Vermerk und die Geometrie. Der Resolver bestimmt die kanonische Mehrheit anhand des aktuellen Zustands und bindet Verbote und Output-Modifikatoren an den Hotspot. Die normale Auszahlung überträgt einen vorhandenen Influence-Marker ohne Ressourcenzahlung. Der Abschlussvermerk folgt auch bei Gleichstand, Verbot, leerem Vorrat oder reduziertem Output. Er ist getrennt vom Markertransfer. CORE-01-06-00-05(d)/-07(a) und CORE-01-06-03 bis -07.

Bereits registrierte Vor-Mehrheits-Effekte nach CORE-01-06-04(a) benötigen das gemeinsame Modell für aktive Effektinstanzen aus Task 0030, Stufe 3. Die Engine-Tests verwenden synthetische Verbots- und Output-Hooks für die unterdrückten Auszahlungen.

## Nachweis

T04 spielt die Einschließungen über den boardgame.io-Client. Ein Test-Move ruft den Resolver nach einem JSON-Roundtrip erneut über den Engine-Reducer auf. Der Versuch erzeugt weder nach einer erfolgreichen Auszahlung noch nach dem Wegfall eines Auszahlungshindernisses einen weiteren Transfer. Ein gemeinsamer letzter Marker geht bei zwei gleichzeitig eingeschlossenen Hotspots an die kleinere Tile-ID, auch wenn der andere Hotspot früher auf dem Board lag.
