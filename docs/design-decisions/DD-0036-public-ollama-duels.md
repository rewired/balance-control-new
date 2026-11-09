# DD-0036 — Ollama-Duelle mit sichtbarem Spielstand

Ollama und der Hotseat-Bot erhalten ihre Position über `createComputerPosition`. Für Ollama serialisiert der Runner daraus nur sichtbare Zonen, Vorräte, Karten, Effekte und die Anzahl verbleibender Plättchen und Karten. Der Prompt erklärt das Ziel, fasst die relevanten Regeln zusammen und entnimmt sichtbare Kartentexte den normativen Dateien. Die echten und die hypothetischen Stapel, der Match-Seed, die Engine-PRNG und alle Hashes bleiben außerhalb des Prompts.

Die Engine liefert dem Runner Optionen mit Vorschauhash nach AGENTS §4.3. Der Runner stellt dem Modell eine begrenzte Auswahl als indizierte, bepreiste Optionen bereit. Nach der Indexprüfung verarbeitet er den ausgewählten Zug probeweise auf dem echten Zustand und vergleicht dessen Ergebnis nach der Ausführung. Die Prüfung des echten Zustands findet erst nach der Entscheidung statt.

Pro Seed werden zwei Partien mit vertauschten Startplätzen aus demselben Anfangszustand gespielt. Ein optionaler neutraler Vorlauf erlaubt einen Test im Endspiel. Paare mit Ersatzzügen oder ohne Modellentscheidung in einer Partie zählen nicht zur Gesamtwertung. Ein Fehler beim Modellzugriff beendet den Lauf. So bleiben Ergebnisse aus dem realen Modell und technische Fehler getrennt.
