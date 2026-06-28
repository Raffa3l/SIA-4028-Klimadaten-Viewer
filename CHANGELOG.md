# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [1.4.0] — 2026-06-28

### Hinzugefügt
- **Urania als zweite globale Messquelle**: Messdaten `URANIA_MES01-Istwert_15m-2025.csv` und `URANIA_MES01-Istwert_15m-2026-Jan-Jun.csv` (bis 28.6.2026) ergänzen den Messvergleich neben Walche
- **`CONFIG.globalMeasurements`-Array**: Neue Konfigurationsstruktur für beliebig viele globale Messquellen (je `key`, `label`, `files`); Walche und Urania sind die ersten Einträge — weitere Quellen können hier ergänzt werden
- **`DataLoader.loadGlobalMeasurements()`**: Löst `loadWalcheData()` ab; lädt alle in `CONFIG.globalMeasurements` konfigurierten Quellen sequenziell und kombiniert die Einträge in einem gemeinsamen Array
- **`ChartManager._allMeasPairs(measData)`**: Neue Hilfsmethode; gibt eine geordnete Liste aller `{key, source, sourceLabel, year, colorIdx}`-Paare zurück — globale Quellen in CONFIG-Reihenfolge (Walche vor Urania), stationsspezifische danach, je aufsteigend nach Jahr; bildet die Grundlage für stabile Farbzuordnungen
- **Messungen-Checkboxen in der Seitenleiste**: Neuer Abschnitt «Messungen» unterhalb der Szenarien; erscheint nur bei Parameter Lufttemperatur; zeigt eine Checkbox pro `(Quelle, Jahr)`-Paar mit Farbpunkt — aktive Kombinationen werden in allen relevanten Diagrammen dargestellt
- **Messdaten im Monatsvergleich**: `renderComparisonChart` ergänzt bei Lufttemperatur die Klimaszenarien-Balken um Messdaten-Balken (Monatsmittel) pro aktiver Quelle/Jahr

### Geändert
- `DataLoader._loadMeasurementFiles(urls, source, sourceLabel)`: Neue Parameter; jeder Dateneintrag enthält jetzt die Felder `source` (Config-Schlüssel, z. B. `'walche'`) und `sourceLabel` (Anzeigebezeichnung)
- `App.globalMeasData` ersetzt `App.walcheData`; `App.getActiveMeasKeys()` ersetzt `getActiveYears()` und gibt zusammengesetzte Schlüssel im Format `"source||year"` zurück
- `ChartManager._measurementTraces(measData, aggregation, activeKeys)`: Signatur vereinfacht (kein `measLabel` mehr, da in Einträgen enthalten); iteriert über `_allMeasPairs` statt über rohe Jahres-Map; der Farbindex basiert auf `pair.colorIdx` und bleibt stabil, auch wenn einzelne Quellen/Jahre ausgeblendet werden
- `renderTimeseries`, `renderComparisonChart`: Parameter `measLabel` entfernt (Bezeichnung kommt aus den Einträgen)
- `renderWalcheOverlay`, `renderWalcheRMSE`: Parameter `measurementLabel` entfernt; Diagrammtitel lauten neu «Messwerte vs. Klimadaten» bzw. «Abweichung von den Messwerten»; Monatsfilterung basiert auf den aktuell aktiven Einträgen
- `MEASUREMENT_YEAR_COLORS` von 3 auf 6 Farben erweitert: Walche erhält Navy/Slate (`#1a1a2e`, `#64748b`), Urania Lila (`#6d28d9`, `#a78bfa`); Farbzuordnung bleibt über Config-Reihenfolge stabil
- `renderWalcheRMSE` iteriert nun über `_allMeasPairs` statt `byYear`; Balken-Opazität und Symbol-Zuordnung basieren auf `pair.colorIdx`

## [1.3.0] — 2026-06-28

### Hinzugefügt
- **Messungen-Checkboxen pro Jahr**: Seitenleiste zeigt unterhalb der Szenarien einen neuen Abschnitt «Messungen» mit einer Checkbox pro Messjahr (Farbpunkt entspricht der Kurvenfarbe im Diagramm); ersetzt die bisherige statische Messquellen-Anzeige
- Messdaten im Monatsvergleich: Für den Parameter Lufttemperatur werden im Monatsvergleich-Diagramm Messdaten-Balken (Monatsmittel pro Jahr) neben den Klimaszenarien-Balken eingeblendet
- SMA-Messdatenvergleich: Station SMA lädt eigene MeteoSchweiz-Messungen (`SMA_clean_15m_2025.csv`, `SMA_clean_15m-2026-Jan-Jun.csv`) statt Walche-Daten für den Messvergleich
- `DataLoader.loadStationMeasurements()`: generische Methode für stationsspezifische Messdateien (konfigurierbar via `measurementFiles` / `measurementLabel` in `CONFIG.stations`)
- `DataLoader._loadMeasurementFiles()`: gemeinsame Ladelogik für alle Messdaten-CSVs (mehrere Dateien, beliebig viele Kopfzeilen)
- Walche-Datenbasis erweitert: neu zwei Dateien (`Walche_MES01-Istwert_15m-2025.csv` + `Walche_MES01-Istwert_15m-2026-Jan-Jun.csv`) — deckt nun ~12 Monate ab statt nur Jan–Jun 2026
- Automatische Aggregationsumschaltung: Auswahl «Monatsvergleich»/«Differenz» schaltet Aggregation auf Monatsmittel; «Heatmap» schaltet auf Stündlich
- Symmetrischer Rückschalter: manuelle Aggregationsänderung auf einen inkompatiblen Wert setzt Ansicht auf «Alle Diagramme» zurück (verhindert leere Seite)
- RMSE/MAE-Erklärung im README mit Formeln und Interpretation
- Eine Kurve pro Messjahr: Messdaten in Overlay- und Zeitreihen-Diagramm werden nach Kalenderjahr getrennt dargestellt (separate gepunktete Linien für 2025 und 2026), umgesetzt via `ChartManager._measurementTraces()`
- Messdaten in Zeitreihe: Für den Parameter Lufttemperatur werden im Zeitreihen-Diagramm zusätzlich die Messdaten eingeblendet (gepunktete Linie je Messjahr)
- RMSE-Diagramm pro Messjahr: RMSE und MAE werden separat für 2025 und 2026 berechnet und als gruppierte Balken dargestellt — vermeidet fehlerhafte jahresübergreifende Mittelung

### Geändert
- Ansicht «Messvergleich Walche» umbenannt zu «Messvergleich» — Diagrammtitel und Legendenbezeichnungen werden dynamisch aus `measurementLabel` gesetzt
- X-Achsen-Beschriftung im Overlay-Diagramm erklärt nun explizit die 2024-Normierung
- Y-Achse im Overlay-Diagramm (`dtick: 10`) für einheitliche 10 K-Schritte bei allen Stationen
- `DataLoader.loadWalcheData()` lädt sequenziell vor dem ersten `loadStation()`-Aufruf, eliminiert Race Condition beim App-Start

### Behoben
- Null-Werte in `groupedAggregate` und `monthlyMeans` wurden fälschlicherweise als 0 in Mittelwert-Berechnung einbezogen (Zähler wurde trotzdem erhöht) — jetzt werden null-Werte übersprungen
- `Math.max()` auf leeren Arrays lieferte `-Infinity` → ungültige Plotly-Achsen-Range im RMSE-Diagramm; jetzt abgesichert mit `Number.isFinite()` Prüfung
- RMSE-Diagramm mittelte Messdaten aus 2025 und 2026 für denselben Kalendertag zusammen (normierte Datums-Schlüssel kollidierten); jetzt wird RMSE pro Jahr separat berechnet
- Cache-Inkonsistenz in `loadStationMeasurements`: bei nicht erreichbaren Messdateien wurde `[]` gecacht, beim zweiten Aufruf jedoch `[]` zurückgegeben (truthy) statt `null` — Walche-Fallback wurde umgangen
- Ungenutzte Variable `yy` in `DataLoader.buildTimestamps()` entfernt
- Walche-Ansicht zeigte leere Container ohne Fehlermeldung, wenn keine Messdaten geladen werden konnten
- Sidebar-Messquellenanzeige war auch bei Parametern ohne Messdaten sichtbar (z. B. Feuchtigkeit, Wind)

## [1.2.0] — 2026-06-28

### Hinzugefügt
- Messvergleich Walche: neue Ansicht «Messvergleich Walche» vergleicht reale Aussentemperaturmessungen (Jan–Jun 2026, 15-min-Werte) gegen alle vier SIA 4028 Klimaszenarien der gewählten Station
- Tagesmitten-Overlay-Diagramm: Klimaszenarien vs. Messung Walche (Jan–Jun, normiert auf 2024)
- RMSE/MAE-Balkendiagramm: quantitativer Vergleich, welches Szenario am besten passt
- `DataLoader.loadWalcheData()`: parst 15-min-CSV, aggregiert auf Stundenmittel, normiert Jahr auf 2024

### Geändert
- Standardstation geändert von KLO auf ZUESTA (Zürich Stadt)
- Standardaggregation geändert von Tagesmittel auf Stündlich
- Farbe 2060 RCP8.5 1-in-10 Warmsummer: von Orange-Rot (`#e74c3c`) auf klar unterscheidbares Orange (`#e67e22`)
- Datenverzeichnis umbenannt: `Ressourcen/` → `data/`; Referenzdokumente in neuem Ordner `docs/`

## [1.0.0] — 2026-06-24

### Hinzugefügt
- Interaktive Web-App zur Visualisierung von SIA 4028 Klimadaten
- Stationsauswahl mit automatischer Erkennung verfügbarer Daten (parallele Abfragen)
- Parameterauswahl mit Gruppierung (vergleichbar 2023 & 2060 vs. nur 2023)
- Vier Szenario-Toggles: 2023 DRY, 2023 1-in-10, 2060 RCP8.5 DRY, 2060 RCP8.5 1-in-10
- Zeitreihen-Diagramm mit stündlicher, täglicher und monatlicher Aggregation
- Monatlicher Vergleich als Balkendiagramm (bei Monatsmittel-Aggregation)
- Differenz-Diagramm 2060 vs. 2023 als Balkendiagramm (bei Monatsmittel-Aggregation)
- Heatmap-Ansicht (Stunde × Tag) mit einer Heatmap pro aktivem Szenario (bei stündlicher Aggregation)
- Aggregationsabhängige Sichtbarkeit: Jedes Diagramm erscheint nur bei der passenden Aggregationsstufe
- Korrekte Niederschlagsaggregation (Summe statt Mittelwert)
- Race-Condition-Schutz bei schnellem Stationswechsel
- Robuste Behandlung fehlender CSV-Spalten
- Unterstützung für 4 Stationen: KLO, REH, SMA, ZUESTA (inkl. NABZUE-Mapping für 2060)
- MeteoSchweiz-inspiriertes Design mit Farbschema (Blau = 2023, Rot = 2060)
- Responsive Layout für verschiedene Bildschirmgrössen
