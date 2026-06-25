# SIA 4028 Klimadaten-Viewer

Interaktive Web-Applikation zur Visualisierung der stündlichen SIA 4028 Klimadaten von MeteoSchweiz für bauphysikalische, energetische und gebäudetechnische Berechnungen.

## Funktionen

- **Stationsauswahl**: Automatische Erkennung verfügbarer Stationen aus dem Datenverzeichnis
- **Parameterauswahl**: Alle verfügbaren Klimaparameter (Temperatur, Feuchte, Wind, Strahlung, etc.)
- **Szenario-Vergleich**: Aktuelles Klima (2023) vs. zukünftiges Klima (2060 RCP8.5)
- **Zwei Varianten**: DRY (durchschnittliche Monate) und 1-in-10 (warmer Sommer)
- **Interaktive Charts**: Zoom, Pan, Hover-Tooltips, Export als PNG

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

## Datenquelle

Die Daten stammen aus dem SIA 4028 Klimadatensatz von MeteoSchweiz:

- **Referenzperiode 2023**: Stundenwerte basierend auf Beobachtungen
- **Zukunftsperiode 2060**: Stundenwerte unter Szenario RCP8.5
- **DRY**: Datensatz mit durchschnittlichen Monaten (Design Reference Year)
- **1-in-10 Warmsummer**: Datensatz mit statistisch warmem Sommer

Quelle: MeteoSchweiz (Hrsg.) 2025: Bereitstellung der Klimadaten für Bauphysik, Energie- und Gebäudetechnik (SIA 4028), Bundesamt für Meteorologie und Klimatologie MeteoSchweiz, BAFU, BFE, SIA, Zürich.

Lizenz der Daten: CC BY 4.0

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
├── Ressourcen/             Klimadaten (CSV-Dateien)
│   ├── KLO/                Zürich / Kloten
│   ├── REH/                Zürich / Affoltern
│   ├── SMA/                Zürich / Fluntern
│   └── ZUESTA/             Zürich Stadt
├── README.md
└── CHANGELOG.md
```

## Datenformat

### Dateien pro Station

| Datei | Beschreibung |
|-------|-------------|
| `XXX_2023_DRY.csv` | Aktuelles Klima, durchschnittliche Monate |
| `XXX_2023_1in10-warmsummer.csv` | Aktuelles Klima, warmer Sommer |
| `XXX_2060_RCP85_DRY.csv` | Zukünftiges Klima (RCP8.5), durchschnittliche Monate |
| `XXX_2060_RCP85_1in10-warmsummer.csv` | Zukünftiges Klima (RCP8.5), warmer Sommer |

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
- [Espazium: Neue Klimadaten SIA](https://www.espazium.ch/de/aktuelles/neue-klimadaten-sia)
