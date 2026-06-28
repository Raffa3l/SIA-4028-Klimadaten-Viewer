# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [1.3.0] — 2026-06-28

### Hinzugefügt
- SMA-Messdatenvergleich: Station SMA lädt eigene MeteoSchweiz-Messungen (`SMA_clean_15m_2025.csv`, `SMA_clean_15m-2026-Jan-Jun.csv`) statt Walche-Daten für den Messvergleich
- `DataLoader.loadStationMeasurements()`: generische Methode für stationsspezifische Messdateien (konfigurierbar via `measurementFiles` / `measurementLabel` in `CONFIG.stations`)
- `DataLoader._loadMeasurementFiles()`: gemeinsame Ladelogik für alle Messdaten-CSVs (mehrere Dateien, beliebig viele Kopfzeilen)
- Walche-Datenbasis erweitert: neu zwei Dateien (`Walche_MES01-Istwert_15m-2025.csv` + `Walche_MES01-Istwert_15m-2026-Jan-Jun.csv`) — deckt nun ~12 Monate ab statt nur Jan–Jun 2026
- Automatische Aggregationsumschaltung: Auswahl «Monatsvergleich»/«Differenz» schaltet Aggregation auf Monatsmittel; «Heatmap» schaltet auf Stündlich
- Symmetrischer Rückschalter: manuelle Aggregationsänderung auf einen inkompatiblen Wert setzt Ansicht auf «Alle Diagramme» zurück (verhindert leere Seite)
- RMSE/MAE-Erklärung im README mit Formeln und Interpretation

### Geändert
- Ansicht «Messvergleich Walche» umbenannt zu «Messvergleich» — Diagrammtitel und Legendenbezeichnungen werden dynamisch aus `measurementLabel` gesetzt
- X-Achsen-Beschriftung im Overlay-Diagramm erklärt nun explizit die 2024-Normierung
- `DataLoader.loadWalcheData()` lädt sequenziell vor dem ersten `loadStation()`-Aufruf, eliminiert Race Condition beim App-Start

### Behoben
- Null-Werte in `groupedAggregate` und `monthlyMeans` wurden fälschlicherweise als 0 in Mittelwert-Berechnung einbezogen (Zähler wurde trotzdem erhöht) — jetzt werden null-Werte übersprungen
- `Math.max()` auf leeren Arrays lieferte `-Infinity` → ungültige Plotly-Achsen-Range im RMSE-Diagramm; jetzt abgesichert mit `Number.isFinite()` Prüfung
- Ungenutzte Variable `yy` in `DataLoader.buildTimestamps()` entfernt
- Walche-Ansicht zeigte leere Container ohne Fehlermeldung, wenn keine Messdaten geladen werden konnten

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
