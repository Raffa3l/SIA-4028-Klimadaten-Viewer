const CONFIG = {
  dataDir: 'data',

  stations: {
    ZUESTA: {
      name: 'Zürich Stadt',
      abbr2023: 'ZUESTA',
      abbr2060: 'NABZUE',
      folder: 'ZUESTA',
    },
    KLO: {
      name: 'Zürich / Kloten',
      abbr2023: 'KLO',
      abbr2060: 'KLO',
      folder: 'KLO',
    },
    REH: {
      name: 'Zürich / Affoltern',
      abbr2023: 'REH',
      abbr2060: 'REH',
      folder: 'REH',
    },
    SMA: {
      name: 'Zürich / Fluntern',
      abbr2023: 'SMA',
      abbr2060: 'SMA',
      folder: 'SMA',
    },
  },

  scenarios: {
    DRY: { label: 'DRY (Durchschnittliche Monate)', color2023: '#1b4f72', color2060: '#c0392b' },
    '1in10': { label: '1-in-10 (Warmer Sommer)', color2023: '#2e86c1', color2060: '#e67e22' },
  },

  parameterMapping: {
    temp:       { col2060: 'tre200h0', label: 'Lufttemperatur',                    unit: '°C',    group: 'Temperatur' },
    relhum:     { col2060: 'ure200h0', label: 'Relative Feuchtigkeit',             unit: '%',     group: 'Feuchte' },
    windmean:   { col2060: 'fkl010h0', label: 'Windgeschwindigkeit (Mittel)',       unit: 'm/s',   group: 'Wind' },
    windmax:    { col2060: 'fkl010h1', label: 'Windgeschwindigkeit (Böenspitze)',   unit: 'm/s',   group: 'Wind' },
    winddir:    { col2060: 'dkl010h0', label: 'Windrichtung',                      unit: '°',     group: 'Wind' },
    cloudcov:   { col2060: 'skycover', label: 'Bewölkung',                         unit: '%',     group: 'Bewölkung' },
    'rad.global': { col2060: 'gls',       label: 'Globalstrahlung horizontal',     unit: 'W/m²',  group: 'Strahlung' },
    'rad.diffus': { col2060: 'str.diffus', label: 'Diffuse Strahlung horizontal',  unit: 'W/m²',  group: 'Strahlung' },
    'rad.direct': { col2060: 'str.direkt', label: 'Direktstrahlung normal (Beam)', unit: 'W/m²',  group: 'Strahlung' },
  },

  parametersOnly2023: {
    vappres:     { label: 'Dampfdruck',                           unit: 'hPa',   group: 'Feuchte' },
    dewpt:       { label: 'Taupunkt',                             unit: '°C',    group: 'Feuchte' },
    mixratio:    { label: 'Mischungsverhältnis',                  unit: 'g/kg',  group: 'Feuchte' },
    wetbulb:     { label: 'Feuchttemperatur',                     unit: '°C',    group: 'Temperatur' },
    enthalpy:    { label: 'Enthalpie',                            unit: 'kJ/kg', group: 'Temperatur' },
    precip:      { label: 'Niederschlag',                         unit: 'mm',    group: 'Niederschlag', aggregation: 'sum' },
    airpres:     { label: 'Luftdruck',                            unit: 'hPa',   group: 'Druck' },
    'rad.vert.N': { label: 'Globalstrahlung vertikal Nord',       unit: 'W/m²',  group: 'Strahlung' },
    'rad.vert.E': { label: 'Globalstrahlung vertikal Ost',        unit: 'W/m²',  group: 'Strahlung' },
    'rad.vert.S': { label: 'Globalstrahlung vertikal Süd',        unit: 'W/m²',  group: 'Strahlung' },
    'rad.vert.W': { label: 'Globalstrahlung vertikal West',       unit: 'W/m²',  group: 'Strahlung' },
    'ir.horiz':   { label: 'Langwellige Einstrahlung horizontal', unit: 'W/m²',  group: 'Strahlung' },
    albedo:      { label: 'Bodenalbedo',                          unit: '%',     group: 'Oberfläche' },
    emissivity:  { label: 'Bodenemissivität',                     unit: '%',     group: 'Oberfläche' },
  },

  filePatterns: {
    dry2023:    (abbr) => `${abbr}_2023_DRY.csv`,
    warm2023:   (abbr) => `${abbr}_2023_1in10-warmsummer.csv`,
    dry2060:    (abbr) => `${abbr}_2060_RCP85_DRY.csv`,
    warm2060:   (abbr) => `${abbr}_2060_RCP85_1in10-warmsummer.csv`,
  },

  months: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ],
};
