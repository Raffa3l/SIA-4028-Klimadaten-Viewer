# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

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
