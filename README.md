# SIA 4028 Klimadaten-Viewer

[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)
[![Lizenz: CC BY 4.0](https://img.shields.io/badge/Daten%20%26%20Docs-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-orange.svg)](https://raffa3l.github.io/SIA-4028-Klimadaten-Viewer/)

Interaktive Web-Applikation zur Visualisierung der stündlichen SIA 4028 Klimadaten von MeteoSchweiz für bauphysikalische, energetische und gebäudetechnische Berechnungen.

[Live-Demo](https://raffa3l.github.io/SIA-4028-Klimadaten-Viewer/)

## Funktionen

- **Stationsauswahl**: Automatische Erkennung verfügbarer Stationen aus dem Datenverzeichnis
- **Parameterauswahl**: Alle verfügbaren Klimaparameter (Temperatur, Feuchte, Wind, Strahlung, etc.)
- **Szenario-Vergleich**: Aktuelles Klima (2023) vs. zukünftiges Klima (2060 RCP8.5)
- **Zwei Varianten**: DRY (durchschnittliche Monate) und 1-in-10 (warmer Sommer)
- **Interaktive Charts**: Zoom, Pan, Hover-Tooltips, Export als PNG
- **Messvergleich**: Reale Aussentemperaturmessungen (2025–2026) vs. alle Klimaszenarien mit RMSE/MAE-Auswertung — Walche-Gebäude für alle Stationen, SMA Fluntern für Station SMA

Der Quellcode in diesem Repository steht unter der [MIT-Lizenz](LICENSE).

### Diagrammtypen und Aggregation

Die verfügbaren Diagramme hängen von der gewählten Aggregation ab:

| Aggregation | Zeitreihe | Monatlicher Vergleich | Differenz 2060 vs. 2023 | Heatmaps |
|---|---|---|---|---|
| **Stündlich** | Linien (8760 Werte) | — | — | 1 pro Szenario (Stunde × Tag) |
| **Tagesmittel** | Linien (365 Werte) | — | — | — |
| **Monatsmittel** | Linien + Marker (12 Werte) | Balkendiagramm | Balkendiagramm | — |

- **Zeitreihe**: Immer sichtbar, zeigt den Jahresverlauf aller aktiven Szenarien
- **Monatlicher Vergleich**: Balken pro Monat und Szenario (nur bei Monatsmittel)
- **Differenz 2060 vs. 2023**: Monatliche Differenz zwischen Zukunft und Gegenwart (nur bei Monatsmittel, nur für vergleichbare Parameter)
- **Heatmaps**: Stunde × Tag Matrix, eine pro aktivem Szenario (nur bei stündlicher Auflösung)
- **Messvergleich**: Unabhängig von Aggregation; zeigt Tagesmitten-Overlay (2025–2026, normiert auf 2024) und RMSE/MAE-Balkendiagramm pro Szenario

> **Hinweis:** Beim Wechsel auf «Monatsvergleich» oder «Differenz 2060 vs. 2023» wird die Aggregation automatisch auf *Monatsmittel* umgestellt. Beim Wechsel auf «Heatmap» wird automatisch auf *Stündlich* umgestellt.

### Statistische Kennwerte im Messvergleich

Im Messvergleich-Diagramm werden zwei Kennwerte berechnet, die zeigen, wie gut das jeweilige SIA 4028 Klimaszenario mit den realen Messwerten übereinstimmt:

**RMSE (Root Mean Square Error — Wurzel des mittleren quadratischen Fehlers)**

Misst die typische Abweichung zwischen Messung und Klimaszenario. Grosse Einzelabweichungen werden quadratisch stärker gewichtet:

```
RMSE = sqrt( (1/n) * Summe( (T_Messung_i - T_Klima_i)^2 ) )
```

**MAE (Mean Absolute Error — Mittlerer absoluter Fehler)**

Mittlere absolute Abweichung; gleichmässige Gewichtung aller Tagesmittelwerte, weniger empfindlich auf Ausreisser als der RMSE:

```
MAE = (1/n) * Summe( |T_Messung_i - T_Klima_i| )
```

Ein kleinerer RMSE/MAE bedeutet bessere Übereinstimmung. Da RMSE quadratisch penalisiert, ist er typischerweise etwas grösser als der MAE. Je näher RMSE und MAE beieinander liegen, desto gleichmässiger sind die Abweichungen über das Jahr verteilt.

## Datenquelle

Die Daten stammen aus dem SIA 4028 Klimadatensatz von MeteoSchweiz:

- **Referenzperiode 2023**: Stundenwerte basierend auf Beobachtungen
- **Zukunftsperiode 2060**: Stundenwerte unter Szenario RCP8.5
- **DRY**: Datensatz mit durchschnittlichen Monaten (Design Reference Year)
- **1-in-10 Warmsummer**: Datensatz mit statistisch warmem Sommer

Quelle: MeteoSchweiz (Hrsg.) 2025: Bereitstellung der Klimadaten für Bauphysik, Energie- und Gebäudetechnik (SIA 4028), Bundesamt für Meteorologie und Klimatologie MeteoSchweiz, BAFU, BFE, SIA, Zürich.

Lizenz der Daten: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Weitere Dokumentation zu den Open Data von MeteoSchweiz: [opendatadocs.meteoswiss.ch](https://opendatadocs.meteoswiss.ch/de/)

## Installation und Start

### Voraussetzungen

- Ein moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Python 3 (für den lokalen Webserver) oder ein beliebiger HTTP-Server

### Schnellstart

```bash
# In das Projektverzeichnis wechseln
cd "SIA 4028"

# Lokalen Webserver starten
python3 -m http.server 8080

# Im Browser öffnen
open http://localhost:8080
```

### Alternative: Node.js

```bash
npx serve -l 8080
```

### Alternative: VS Code

Die Extension "Live Server" installieren und `index.html` öffnen.

## Projektstruktur

```
SIA 4028/
├── index.html              Hauptseite der Applikation
├── css/
│   └── styles.css          Styling (MeteoSchweiz-inspiriert)
├── js/
│   ├── config.js           Stations- und Parameterkonfiguration
│   ├── data-loader.js      CSV-Laden und -Parsing
│   ├── charts.js           Plotly-Diagrammkonfigurationen
│   └── app.js              Hauptlogik der Applikation
├── data/                   Klimadaten und Messdaten (CSV-Dateien)
│   ├── KLO/                Zürich / Kloten (SIA 4028)
│   ├── REH/                Zürich / Affoltern (SIA 4028)
│   ├── SMA/                Zürich / Fluntern (SIA 4028)
│   ├── ZUESTA/             Zürich Stadt (SIA 4028)
│   └── WALCHE/             Aussentemperaturmessung Standort Walche (15-min-Werte)
├── docs/                   Hintergrunddokumente und Referenzen
├── README.md
└── CHANGELOG.md
```

## Datenformat

### SIA 4028 Klimadaten (Stationen KLO, REH, SMA, ZUESTA)

| Datei | Beschreibung |
|-------|-------------|
| `XXX_2023_DRY.csv` | Aktuelles Klima, durchschnittliche Monate |
| `XXX_2023_1in10-warmsummer.csv` | Aktuelles Klima, warmer Sommer |
| `XXX_2060_RCP85_DRY.csv` | Zukünftiges Klima (RCP8.5), durchschnittliche Monate |
| `XXX_2060_RCP85_1in10-warmsummer.csv` | Zukünftiges Klima (RCP8.5), warmer Sommer |

Delimiter: `,` — Zeitstempel in Spalten `time.yy`, `time.mm`, `time.dd`, `time.hh`

### Messdaten Walche-Gebäude

| Datei | Beschreibung |
|-------|-------------|
| `Walche_MES01-Istwert_15m-2025.csv` | Aussentemperatur Walche (°C), 15-Min-Intervalle, ab Feb. 2025 |
| `Walche_MES01-Istwert_15m-2026-Jan-Jun.csv` | Aussentemperatur Walche (°C), 15-Min-Intervalle, Jan–Jun 2026 |

Delimiter: `;` — Datum im Format `DD.MM.YYYY HH:MM:SS`, Kopfzeilen werden automatisch übersprungen.

### Messdaten SMA Fluntern (MeteoSchweiz)

| Datei | Beschreibung |
|-------|-------------|
| `SMA_clean_15m_2025.csv` | Aussentemperatur SMA (°C), 15-Min-Intervalle, 2025 |
| `SMA_clean_15m-2026-Jan-Jun.csv` | Aussentemperatur SMA (°C), 15-Min-Intervalle, Jan–Jun 2026 |

Delimiter: `;` — gleiches Format wie Walche-Messdaten. Wird im Messvergleich automatisch verwendet, wenn die Station SMA ausgewählt ist.

> **Normierung auf 2024**: Alle Messdaten (Walche, SMA) und SIA 4028 Klimadaten werden auf das Jahr 2024 normiert, damit sie auf derselben Zeitachse verglichen werden können. Die Messwerte stammen aus 2025–2026; die Normierung ist rein eine Darstellungsmassnahme für die X-Achse.

### Verfügbare Parameter

**In beiden Perioden (2023 & 2060):**
Lufttemperatur, Relative Feuchtigkeit, Windgeschwindigkeit, Windrichtung, Bewölkung, Globalstrahlung, Diffuse Strahlung, Direktstrahlung

**Nur in 2023:**
Dampfdruck, Taupunkt, Mischungsverhältnis, Feuchttemperatur, Enthalpie, Niederschlag, Luftdruck, Vertikale Strahlungen (N/E/S/W), Langwellige Einstrahlung, Bodenalbedo, Bodenemissivität

## Technologie

- **[Plotly.js](https://plotly.com/javascript/)** — Interaktive wissenschaftliche Diagramme
- **[PapaParse](https://www.papaparse.com/)** — CSV-Parsing im Browser
- **Reines HTML/CSS/JavaScript** — Kein Build-Step, keine Abhängigkeiten zu installieren

## Weiterführende Links

- [MeteoSchweiz Klimadaten SIA 4028](https://www.meteoschweiz.admin.ch/service-und-publikationen/service/wetter-und-klimaprodukte/klimadaten-fuer-bauphysikalische-energetische-und-gebaeudetechnische-berechnungen-sia-4028.html)
- [MeteoSchweiz Applikation Baunormen](https://www.meteoschweiz.admin.ch/service-und-publikationen/applikationen/ext/climate-baunormen.html)
- [MeteoSchweiz Open Data Dokumentation](https://opendatadocs.meteoswiss.ch/de/)
- [Espazium: Neue Klimadaten SIA](https://www.espazium.ch/de/aktuelles/neue-klimadaten-sia)
