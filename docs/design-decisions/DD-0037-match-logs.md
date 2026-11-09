# DD-0037 — Reproduzierbare Spielprotokolle für Playtests

Das versionierte JSON-Protokoll verwendet die von boardgame.io angenommenen Aktionen. Hotseat und Bot-Runner lesen den lokalen Engine-Client. Im Netzwerk protokolliert der Server den bestätigten Stand. Bot-Vorschauen, ungültige Eingaben und Wiederholungen durch Netzwerk-Synchronisierung landen so nicht im Protokoll. Undo und Redo bleiben als eigene Aktionen sichtbar. Die Engine erzeugt interne Ereignisse beim Replay erneut.

Das Replay baut den Startzustand aus Seed, Spielerzahl und Konfiguration neu auf und prüft die Checkpoints der Originalpartie. Nach jeder bestätigten Aktion enthält das Protokoll den Zustandshash, den zuletzt von der Engine gespeicherten Zughash, Einfluss auf dem Brett, Vorräte, Noise und Kachelzahlen. `result` enthält die Gewinnerliste der Engine (einschließlich geteilter Siege) oder `null` für eine unvollständige Partie. Bei Zwischenentscheidungen können der Sitz der Aktion in `action.playerID` und der Sitz des aktuellen Zugs in `turnPlayer` abweichen. Automatische Folgen wie Settlement und das Ziehen für den nächsten Zug können bereits in derselben Zustandsaufnahme enthalten sein. Vorratsdifferenzen geben die Nettoänderung an.

Der Export übernimmt keine Lobby-Namen, Zugangsdaten oder LLM-Prompts aus den Metadaten. Seed und Aktionen machen verdeckte Inhalte rekonstruierbar; Netzwerklogs deshalb erst nach der Partie mit den Mitspielern teilen. Das Protokollformat hat eine eigene Versionsnummer. Für langfristige Vergleiche die Git-Revision des Playtest-Builds zusammen mit den Logs aufbewahren; ein Replay mit geänderten Regeln kann an einem Hash abweichen.

## Nutzung

Alle erzeugten Spielprotokolle liegen unter `logs/` im Projektverzeichnis. Git ignoriert den gesamten Ordner. `pnpm dev` startet den Browserclient und den lokalen Server gemeinsam.

- **Hotseat** speichert in `logs/hotseat/<Match-ID>.match-log.json`. Der Browser aktualisiert die Datei über den lokalen Server bei Spielbeginn und nach bestätigten Aktionen.
- **Netzwerk** speichert in `logs/network/<Match-ID>.match-log.json`. Das funktioniert auch mit der Lobby im Arbeitsspeicher. Für ältere gespeicherte Partien liest `match:log export <Match-ID>` aus dem gesetzten `FLATFILE_DIR` und schreibt nach `logs/export/`.
- **Bot** speichert in `logs/bot-…/1.match-log.json`. Ein Duell speichert eine Datei pro Partie, ein durch `N` begrenzter Lauf speichert seinen letzten Stand. Bei Einzelläufen wählen `SEED` und `BOT_EXPANSIONS` Seed und Erweiterungen. EXP-01 ist standardmäßig aktiv.

Bot-Testlauf und Replay-Prüfung in PowerShell aus dem Projektverzeichnis. Beim Prüfen den tatsächlichen Dateinamen aus der Runner-Ausgabe verwenden.

```powershell
$env:SEED = 'playtest-01'
$env:N = '100'
pnpm --filter @bc/server bot:run
pnpm --filter @bc/server match:log verify (Join-Path (Get-Location) 'logs/bot-EXAMPLE/1.match-log.json')
```

`verify` spielt die Aktionen ohne Bot oder Netzwerk erneut ab und gibt Gewinner, Endstand und Zustandshash aus. Bei abweichenden Checkpoints nennt es die erste abweichende Revision. Für Balancing-Vergleiche mehrere Seeds mit derselben Konfiguration spielen, Startsitze tauschen und geteilte Siege separat zählen. Einflussverlauf, Ressourcen und Noise helfen, auffällige Partien bis zur konkreten Aktion zurückzuverfolgen.
