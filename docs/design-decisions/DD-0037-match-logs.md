# DD-0037 — Reproduzierbare Spielprotokolle für Playtests

Das versionierte JSON-Protokoll verwendet die von boardgame.io angenommenen Aktionen. Hotseat und Bot-Runner lesen den lokalen Engine-Client, der Netzwerkexport den gespeicherten Serververlauf. Bot-Vorschauen, ungültige Eingaben und Wiederholungen durch Netzwerk-Synchronisierung landen so nicht im Protokoll. Undo und Redo bleiben als eigene Aktionen sichtbar. Die Engine erzeugt interne Ereignisse beim Replay erneut. Das Protokoll ist außerhalb des Spielzustands; Regelablauf und Zughashes bleiben unverändert.

Der Export baut den Startzustand aus Seed, Spielerzahl und Konfiguration neu auf und vergleicht Start und Ende mit der Originalpartie. Nach jeder bestätigten Aktion enthält er den Zustandshash, den zuletzt von der Engine gespeicherten Zughash, Einfluss auf dem Brett, Vorräte, Noise und Kachelzahlen. `result` enthält die Gewinnerliste der Engine (einschließlich geteilter Siege) oder `null` für eine unvollständige Partie. Der Sitz der Aktion steht in `action.playerID`, der Sitz des aktuellen Zugs in `turnPlayer`: Bei Zwischenentscheidungen können sie abweichen. Automatische Folgen wie Settlement und das Ziehen für den nächsten Zug können bereits in derselben Zustandsaufnahme enthalten sein. Vorratsdifferenzen sind daher Nettoänderungen, keine Aufschlüsselung einzelner Kosten oder Erträge.

Der Export übernimmt keine Lobby-Namen, Zugangsdaten oder LLM-Prompts aus den Metadaten. Seed und Aktionen machen verdeckte Inhalte rekonstruierbar; Netzwerklogs deshalb erst nach der Partie mit den Mitspielern teilen. Das Protokollformat hat eine eigene Versionsnummer. Für langfristige Vergleiche die Git-Revision des Playtest-Builds zusammen mit den Logs aufbewahren; ein Replay mit geänderten Regeln kann an einem Hash abweichen.

## Nutzung

Alle erzeugten Logs und die Netzwerk-Speicherdaten gehören außerhalb des Checkouts. Server und Kommandozeile lehnen Schreibziele in Git-Checkouts ab. `*.match-log.json` ist zusätzlich in Git ignoriert, falls ein Download im Checkout landet.

- **Hotseat:** **Download match log** ist während und nach der Partie verfügbar. Vor dem Verlassen herunterladen; der laufende Hotseat-Spielstand lebt im Browser bis zum Verlassen der Partie.
- **Netzwerk:** Den Server mit `FLATFILE_DIR` auf ein externes Verzeichnis starten. Falls die bisherigen Speicherdateien im Checkout liegen, das Verzeichnis vor dem Neustart nach außen verschieben und den neuen Pfad setzen. Der Export läuft lokal beim Serverbetreiber, ohne öffentliche Route. Nach der Partie die Match-ID aus der Lobby verwenden. Der flüchtige Servermodus unterstützt keinen Export.
- **Bot:** `MATCH_LOG_DIR` auf ein externes Verzeichnis setzen. Der Runner schreibt pro Partie eine Datei, bei `BOT=duel` also je eine pro Sitztausch. Ein mit `N` begrenzter Lauf kann als unvollständige Partie exportiert werden. `SEED` und `BOT_EXPANSIONS` wählen bei Einzelläufen den Seed und die Erweiterungen; ohne Angabe bleibt EXP-01 aktiv.

Beispiel mit PowerShell:

```powershell
$logRoot = Join-Path $HOME 'balance-control-playtests'
New-Item -ItemType Directory -Force -Path $logRoot
$env:FLATFILE_DIR = Join-Path $logRoot 'network-saves'
$env:MATCH_LOG_DIR = Join-Path $logRoot 'bot-logs'

# Server in einem Terminal starten, das dieselbe FLATFILE_DIR verwendet.
pnpm --filter @bc/server dev

# Nach der Partie in einem weiteren Terminal mit derselben FLATFILE_DIR:
$output = Join-Path $logRoot 'testpartie.match-log.json'
pnpm --filter @bc/server match:log export MATCH_ID $output
pnpm --filter @bc/server match:log verify $output

# Deterministischer Bot-Testlauf ohne Ollama:
$env:SEED = 'playtest-01'
$env:N = '100'
pnpm --filter @bc/server bot:run
```

`verify` spielt die Aktionen ohne Bot oder Netzwerk erneut ab und gibt Gewinner, Endstand und Zustandshash aus. Bei abweichenden Checkpoints nennt es die erste abweichende Revision. Für Balancing-Vergleiche mehrere Seeds mit derselben Konfiguration spielen, Startsitze tauschen und geteilte Siege separat zählen. Einflussverlauf, Ressourcen und Noise helfen, auffällige Partien bis zur konkreten Aktion zurückzuverfolgen.
