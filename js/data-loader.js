class DataLoader {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.cache = new Map();
    this.metadata = null;
  }

  async loadCSV(url) {
    if (this.cache.has(url)) return this.cache.get(url);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Datei nicht gefunden: ${url}`);
    const text = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          this.cache.set(url, results.data);
          resolve(results.data);
        },
        error: reject,
      });
    });
  }

  async loadMetadata(stationFolder) {
    const url = `${this.dataDir}/${stationFolder}/SIA4028_metadata_2023.csv`;
    const response = await fetch(url);
    const text = await response.text();

    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        complete: (results) => {
          const stations = results.data.filter(
            (row) => row['Station'] && row['Abbr.'] && row['Latitude']
          );
          resolve(stations);
        },
      });
    });
  }

  buildFilePath(stationKey, scenarioType) {
    const station = CONFIG.stations[stationKey];
    const folder = station.folder;

    switch (scenarioType) {
      case 'dry2023':
        return `${this.dataDir}/${folder}/${CONFIG.filePatterns.dry2023(station.abbr2023)}`;
      case 'warm2023':
        return `${this.dataDir}/${folder}/${CONFIG.filePatterns.warm2023(station.abbr2023)}`;
      case 'dry2060':
        return `${this.dataDir}/${folder}/${CONFIG.filePatterns.dry2060(station.abbr2060)}`;
      case 'warm2060':
        return `${this.dataDir}/${folder}/${CONFIG.filePatterns.warm2060(station.abbr2060)}`;
    }
  }

  async loadStationData(stationKey) {
    const scenarioTypes = ['dry2023', 'warm2023', 'dry2060', 'warm2060'];
    const result = {};

    await Promise.all(
      scenarioTypes.map(async (type) => {
        const path = this.buildFilePath(stationKey, type);
        try {
          result[type] = await this.loadCSV(path);
        } catch {
          console.warn(`Datei nicht verfügbar: ${path}`);
          result[type] = null;
        }
      })
    );

    return result;
  }

  buildTimestamps(data) {
    return data.map((row) => {
      const yy = row['time.yy'];
      const mm = String(row['time.mm']).padStart(2, '0');
      const dd = String(row['time.dd']).padStart(2, '0');
      const hh = String(row['time.hh']).padStart(2, '0');
      return `2024-${mm}-${dd}T${hh}:00`;
    });
  }

  getParameterValues(data, paramKey, is2060) {
    if (is2060) {
      const mapping = CONFIG.parameterMapping[paramKey];
      if (!mapping) return null;
      const col = mapping.col2060;
      if (data[0]?.[col] === undefined) return null;
      return data.map((row) => row[col]);
    }
    if (data[0]?.[paramKey] === undefined) return null;
    return data.map((row) => row[paramKey]);
  }

  getAvailableParameters(stationData) {
    const params = { comparable: [], only2023: [] };

    for (const [key, info] of Object.entries(CONFIG.parameterMapping)) {
      const has2023 = stationData.dry2023?.[0]?.[key] !== undefined;
      const has2060 = stationData.dry2060?.[0]?.[info.col2060] !== undefined;
      if (has2023 && has2060) {
        params.comparable.push({ key, ...info });
      }
    }

    for (const [key, info] of Object.entries(CONFIG.parametersOnly2023)) {
      const has = stationData.dry2023?.[0]?.[key] !== undefined;
      if (has) {
        params.only2023.push({ key, ...info });
      }
    }

    return params;
  }

  async loadWalcheData() {
    const url = 'data/WALCHE/Walche_MES01-Istwert_15m.csv';
    if (this.cache.has(url)) return this.cache.get(url);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Walche-Datei nicht gefunden: ${url}`);
    const text = await response.text();

    const rawRows = [];
    await new Promise((resolve) => {
      Papa.parse(text, {
        delimiter: ';',
        skipEmptyLines: true,
        complete: (results) => {
          for (const row of results.data) {
            const dateStr = (row[0] || '').replace(/"/g, '');
            const m = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):\d{2}$/);
            if (!m) continue;
            const val = parseFloat(String(row[1]).replace(',', '.'));
            if (isNaN(val)) continue;
            rawRows.push({ dd: m[1], mm: m[2], hh: m[4], val });
          }
          resolve();
        },
      });
    });

    // Aggregate 15-min intervals to hourly means, normalize year to 2024 for x-axis alignment
    const hourlyMap = new Map();
    for (const { dd, mm, hh, val } of rawRows) {
      const key = `2024-${mm}-${dd}T${hh}:00`;
      if (!hourlyMap.has(key)) hourlyMap.set(key, []);
      hourlyMap.get(key).push(val);
    }

    const hourly = Array.from(hourlyMap.entries())
      .map(([ts, vals]) => ({
        timestamp: ts,
        date: ts.slice(0, 10),
        month: parseInt(ts.slice(5, 7)),
        value: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    this.cache.set(url, hourly);
    return hourly;
  }

  async detectAvailableStations() {
    const entries = Object.entries(CONFIG.stations);
    const results = await Promise.all(
      entries.map(async ([key]) => {
        const path = this.buildFilePath(key, 'dry2023');
        try {
          const resp = await fetch(path, { method: 'HEAD' });
          return resp.ok ? key : null;
        } catch {
          return null;
        }
      })
    );
    return results.filter(Boolean);
  }
}
