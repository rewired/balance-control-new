# DD-0038 — Taktische-Tiefe-Varianten: Ergebnisse und Empfehlung

Hintergrund ist die Analyse der Match-Logs (`logs/trade-depth-dc193588`, `logs/search-duel-UyIFVp`, `logs/threat-situation-2sec-ua6RC4`, `logs/late-production-b0j0Dl`): Das Spätspiel bestand zu rund 63 % aus reinem Einfluss-Setzen, weil Komitee-Kontrolle über die Hälfte der Fenster blockierte, Vorräte weit über dem Verbrauch lagen (Endstand-Median 67,5, Maximum 230) und Measures (8 von 28 Partien) sowie Blockade (0 Einsätze) praktisch tot waren. ERRATA-0033 (neutraler Grassroots-Tausch, kombinierte Tausch-Formalisierung) und eine kostenlose Measure-Aufnahme je Zug wurden darauf aufbauend bereits umgesetzt und laufen seitdem als gemeinsame Basis aller folgenden Tests.

Vier weitere Varianten wurden auf dieser Basis gegeneinander getestet (`logs/balance-variants-41e03295`, 7 Seeds, 28 Sitzverteilungen, Suchhorizont 1 Zug / 4 Aktionen, beide Bots gleich):

## Ergebnis je Variante

**Vorratsdeckel bei 12 Einheiten pro Rohstoff** (`cap`): Endvorrat-Median sinkt von 53,5 auf 27, Tausche steigen von 246 auf 255, Sieger bleibt in 27 von 28 Partien gleich. Wirkt wie beabsichtigt, ohne die Balance zu verschieben. **Empfehlung: übernehmen.**

**Zusätzliche SEC-Produktionskachel (Wert 1)** (`sec`, `secChallenge`): Sieger bleibt nur in 7 von 16 Partien gleich, obwohl die Kachel nie regulär kontrolliert und ihr SEC-Output nie für Challenge oder Blockade genutzt wurde. Allein die zusätzliche Kachel im DrawPile verändert Tempo und Kachelmix stark genug, um in über der Hälfte der Partien einen anderen Sieger zu erzeugen. **Empfehlung: verwerfen.** SEC-Zugang sollte über eine Änderung an einer bestehenden Mechanik gelöst werden (z. B. ein zusätzliches Umtauschziel), nicht über eine neue Tile mit eigenem Platz im DrawPile.

**Challenge für 2 SEC** (`committeeChallenge`, isoliert ohne zusätzliche SEC-Quelle): Identisch zur Kontrollgruppe in jeder gemessenen Größe (16 von 16 gleiche Sieger, 0 Partien mit abweichender Dauer) — die Mechanik kam mangels verfügbarem SEC nie zum Einsatz. Eine separate Gegenprobe an festen Stellungen mit künstlich bereitgestelltem SEC (`logs/balance-variants-41e03295/funded-challenge.json`) zeigt aber, dass Challenge dort in 74 von 106 geeigneten Fenstern die Kontrolle entfernt und in 52 von 106 Fenstern (15 von 16 Partien) *alle* unmittelbar verfügbaren produktiven Formalisierungen des Gegners blockiert hätte — für einen Preis von 2 SEC. **Empfehlung: Preis oder Wirkung abschwächen** (z. B. nur einen Marker von der Mehrheitsberechnung ausschließen statt alle produktiven Formalisierungen zu blockieren), bevor ein echter SEC-Zugang geschaffen wird — sonst ersetzt die Mechanik nur eine Monotonie durch eine andere, diesmal mit härterem Einzeleffekt.

**Variable Grassroots-Kurse** (`variableGrassroots`): Tausche steigen von 246 auf 281 (169 davon zu 2:1, 9 zu 4:2), Partien enden im Mittel früher (Median 59 → 56,5 Züge). Sieger bleibt aber nur in 19 von 28 Partien gleich — eine deutlich größere Verschiebung als beim Vorratsdeckel. Der 4:2-Kurs ist der wahrscheinlichste Grund. **Empfehlung: Kurstabelle entschärfen** (z. B. 4:2 streichen oder durch einen milderen Kurs ersetzen) und erneut testen, bevor übernommen wird.

## Offene Punkte

- SEC-Zugang ist weiterhin ungelöst; ohne ihn bleiben Challenge und Blockade totes Gewicht.
- Challenge braucht eine überarbeitete Wirkung/einen höheren Preis, bevor sie zusammen mit einer funktionierenden SEC-Quelle erneut getestet wird.
- Die Grassroots-Kurstabelle braucht eine mildere Variante vor der nächsten Testrunde.

Bis zur Klärung dieser Punkte gilt nur der Vorratsdeckel als freigegeben für die Übernahme in den Hauptstrang; die übrigen drei Varianten bleiben experimentell.
