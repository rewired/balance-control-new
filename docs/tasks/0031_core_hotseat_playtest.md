# Task 0031 – CORE-Hotseat für den ersten Spieltest

## Ziel

Zwei Personen können eine CORE-Partie auf einem Gerät im Browser spielen, vom ersten Tile bis zur Wertung. Der Client verwendet dafür den bestehenden Spielzustand, die kanonische Mehrheitsberechnung und die legalen Engine-Optionen.

## Umsetzung

- Die Hotseat-Ansicht öffnet direkt eine CORE-Partie zu zweit.
- Das Spielfeld verwendet die vorhandene SVG-Plättchenvorlage, die Textur und die Tile-Icons aus dem bisherigen UI-Projekt. Der Rand und die Beschriftung zeigen die Kontrolle. Die Markeranzeige zählt reale Marker und zeigt virtuellen Einfluss als Zusatz.
- Beim Platzieren zeigt das Brett nur Ziele aus der Engine-Optionsliste. Politische Aktionen lassen sich nach Kontexttile filtern. Die Auswahl zeigt Ziel und Kosten vor der Bestätigung.
- Die Wertung übernimmt die Gewinner aus der Engine und zeigt die realen Einflussmarker pro Person.

## Spieltest zu zweit

1. Im Workspace mit Node.js 24 und pnpm 10 `pnpm install` und `pnpm dev` ausführen. Im Browser die von Vite ausgegebene Adresse öffnen.
2. Abwechselnd ein hervorgehobenes Feld anklicken, dann eine politische Aktion wählen und bestätigen. Ein Klick auf ein belegtes Feld filtert die Aktionen. Die Auswahl lässt sich oberhalb des Spielfelds zurücksetzen.
3. Bis zur Wertung spielen. Das Ergebnis mit den angezeigten Markern vergleichen und bei Bedarf eine neue Partie starten.
4. Pro Auffälligkeit Zug, Situation und Beobachtung erfassen. Bedienprobleme, Regelfragen und taktische Entscheidungen getrennt festhalten.

## Prüfung

- [x] Regression für Platzierungsziele, Aktionsbeschriftung, Spielerwechsel und Kontrolle.
- [x] Deterministischer Testfall über 71 Züge mit vorhandener Referenz für den Endhash.
- [x] Automatisierter DOM-Durchlauf über 71 Züge mit Spielfeldklicks, Aktionsauswahl, geteilter Wertung und Neustart.
- [ ] Spieltest mit zwei Personen und Protokoll.
