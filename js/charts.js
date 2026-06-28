// Colors for measured data traces — indexed by position in the ordered (source, year) pair list
const MEASUREMENT_YEAR_COLORS = ['#1a1a2e', '#64748b', '#6d28d9', '#a78bfa', '#0369a1', '#38bdf8'];

const CHART_COLORS = {
  dry2023:  'rgb(27, 79, 114)',
  warm2023: 'rgb(46, 134, 193)',
  dry2060:  'rgb(192, 57, 43)',
  warm2060: 'rgb(230, 126, 34)',

  dry2023_fill:  'rgba(27, 79, 114, 0.08)',
  warm2023_fill: 'rgba(46, 134, 193, 0.08)',
  dry2060_fill:  'rgba(192, 57, 43, 0.08)',
  warm2060_fill: 'rgba(230, 126, 34, 0.08)',
};

const SCENARIO_LABELS = {
  dry2023:  '2023 DRY',
  warm2023: '2023 1-in-10',
  dry2060:  '2060 RCP8.5 DRY',
  warm2060: '2060 RCP8.5 1-in-10',
};

const BASE_AXIS = {
  gridcolor: '#e0e0e0',
  gridwidth: 1,
  zeroline: false,
};

const METEO_LAYOUT = {
  font: { family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', size: 13 },
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  margin: { t: 60, r: 30, b: 60, l: 70 },
  hovermode: 'x unified',
  legend: {
    orientation: 'h',
    yanchor: 'bottom',
    y: 1.02,
    xanchor: 'left',
    x: 0,
    font: { size: 12 },
  },
  xaxis: {
    ...BASE_AXIS,
    tickformat: '%b',
    dtick: 'M1',
    ticklabelmode: 'period',
  },
  yaxis: {
    ...BASE_AXIS,
    zeroline: true,
    zerolinecolor: '#999',
    zerolinewidth: 1,
  },
};

class ChartManager {
  constructor(loader) {
    this.loader = loader;
  }

  createTimeseriesTraces(stationData, paramKey, activeScenarios, aggregation) {
    const traces = [];

    for (const scenario of activeScenarios) {
      const data = stationData[scenario];
      if (!data) continue;

      const is2060 = scenario.includes('2060');
      const timestamps = this.loader.buildTimestamps(data);
      const values = this.loader.getParameterValues(data, paramKey, is2060);
      if (!values) continue;

      if (aggregation === 'hourly') {
        traces.push({
          x: timestamps,
          y: values,
          type: 'scattergl',
          mode: 'lines',
          name: SCENARIO_LABELS[scenario],
          line: { color: CHART_COLORS[scenario], width: 1 },
          hovertemplate: '%{y:.1f}<extra></extra>',
        });
      } else {
        const { x: aggX, y: aggY } = this.aggregateData(timestamps, values, aggregation, paramKey);
        const trace = {
          x: aggX,
          y: aggY,
          type: 'scatter',
          mode: aggregation === 'monthly' ? 'lines+markers' : 'lines',
          name: SCENARIO_LABELS[scenario],
          line: { color: CHART_COLORS[scenario], width: 2 },
          hovertemplate: '%{y:.1f}<extra></extra>',
        };
        if (aggregation === 'monthly') trace.marker = { size: 6 };
        traces.push(trace);
      }
    }

    return traces;
  }

  shouldSum(paramKey) {
    const info = CONFIG.parameterMapping[paramKey] || CONFIG.parametersOnly2023[paramKey];
    return info?.aggregation === 'sum';
  }

  aggregateData(timestamps, values, mode, paramKey) {
    const useSum = this.shouldSum(paramKey);
    if (mode === 'daily') return this.groupedAggregate(timestamps, values, 10, 'T12:00', useSum);
    if (mode === 'monthly') return this.groupedAggregate(timestamps, values, 7, '-15T12:00', useSum);
    return { x: timestamps, y: values };
  }

  groupedAggregate(timestamps, values, keyLen, suffix, useSum) {
    const groups = new Map();
    timestamps.forEach((ts, i) => {
      if (values[i] == null) return;
      const key = ts.substring(0, keyLen);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(values[i]);
    });

    const x = [];
    const y = [];
    for (const [key, vals] of groups) {
      if (vals.length === 0) continue;
      x.push(key + suffix);
      const sum = vals.reduce((a, b) => a + b, 0);
      y.push(useSum ? sum : sum / vals.length);
    }
    return { x, y };
  }

  buildLayout(paramInfo, title) {
    return {
      ...METEO_LAYOUT,
      title: {
        text: title,
        font: { size: 16, weight: 'bold' },
        x: 0.01,
        xanchor: 'left',
      },
      yaxis: {
        ...METEO_LAYOUT.yaxis,
        title: { text: `${paramInfo.label} (${paramInfo.unit})`, standoff: 10 },
      },
    };
  }

  _monthlyMeansFromHourly(hourlyData) {
    const byMonth = new Map();
    for (const { month, value } of hourlyData) {
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month).push(value);
    }
    const months = [...byMonth.keys()].sort((a, b) => a - b);
    return {
      dates: months.map((m) => `2024-${String(m).padStart(2, '0')}-15T12:00`),
      means: months.map((m) => {
        const v = byMonth.get(m);
        return v.reduce((a, b) => a + b, 0) / v.length;
      }),
    };
  }

  _allMeasPairs(measData) {
    const pairs = [];
    const seen = new Set();
    const globalKeys = new Set(CONFIG.globalMeasurements.map((gm) => gm.key));

    // Global sources in CONFIG order, then by year
    for (const gm of CONFIG.globalMeasurements) {
      const years = [...new Set(measData.filter((e) => e.source === gm.key).map((e) => e.year))].sort();
      for (const year of years) {
        const key = `${gm.key}||${year}`;
        if (!seen.has(key)) { pairs.push({ key, sourceLabel: gm.label, year, source: gm.key }); seen.add(key); }
      }
    }

    // Station-specific sources after global, sorted
    const stationKeys = [...new Set(
      measData.filter((e) => !globalKeys.has(e.source)).map((e) => `${e.source}||${e.year}`)
    )].sort();
    for (const k of stationKeys) {
      if (!seen.has(k)) {
        const [src, yearStr] = k.split('||');
        const entry = measData.find((e) => e.source === src);
        pairs.push({ key: k, sourceLabel: entry?.sourceLabel || src, year: parseInt(yearStr), source: src });
        seen.add(k);
      }
    }

    return pairs.map((p, idx) => ({ ...p, colorIdx: idx }));
  }

  _measurementTraces(measData, aggregation, activeKeys = null) {
    const pairs = this._allMeasPairs(measData);
    const traces = [];

    for (const pair of pairs) {
      if (activeKeys && !activeKeys.includes(pair.key)) continue;

      const color = MEASUREMENT_YEAR_COLORS[pair.colorIdx % MEASUREMENT_YEAR_COLORS.length];
      const pairData = measData.filter((e) => e.source === pair.source && e.year === pair.year);

      let x, y;
      if (aggregation === 'hourly') {
        x = pairData.map((e) => e.timestamp);
        y = pairData.map((e) => e.value);
      } else if (aggregation === 'daily') {
        const d = this._dailyMeansFromHourly(pairData);
        x = d.dates; y = d.means;
      } else {
        const d = this._monthlyMeansFromHourly(pairData);
        x = d.dates; y = d.means;
      }

      const trace = {
        x, y,
        type: aggregation === 'hourly' ? 'scattergl' : 'scatter',
        mode: aggregation === 'monthly' ? 'lines+markers' : 'lines',
        name: `${pair.sourceLabel} ${pair.year}`,
        line: { color, width: aggregation === 'hourly' ? 1 : 2, dash: 'dot' },
        hovertemplate: '%{y:.1f} °C<extra></extra>',
      };
      if (aggregation === 'monthly') trace.marker = { size: 6, color };
      traces.push(trace);
    }

    return traces;
  }

  async renderTimeseries(containerId, stationData, paramKey, activeScenarios, aggregation, measData = null, activeKeys = null) {
    const paramInfo =
      CONFIG.parameterMapping[paramKey] || CONFIG.parametersOnly2023[paramKey];
    if (!paramInfo) return;

    const stationKey = document.getElementById('station-select')?.value;
    const stationName = CONFIG.stations[stationKey]?.name || stationKey;
    const title = `${paramInfo.label} — ${stationName}`;

    const traces = this.createTimeseriesTraces(stationData, paramKey, activeScenarios, aggregation);

    // Append measured data traces (temperature only)
    if (measData && paramKey === 'temp') {
      traces.push(...this._measurementTraces(measData, aggregation, activeKeys));
    }

    const layout = this.buildLayout(paramInfo, title);

    await Plotly.newPlot(containerId, traces, layout, {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    });
  }

  monthlyMeans(data, values, paramKey) {
    const useSum = this.shouldSum(paramKey);
    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    data.forEach((row, i) => {
      if (values[i] == null) return;
      const m = row['time.mm'] - 1;
      sums[m] += values[i];
      counts[m]++;
    });
    return sums.map((s, i) => counts[i] > 0 ? (useSum ? s : s / counts[i]) : 0);
  }

  async renderComparisonChart(containerId, stationData, paramKey, activeScenarios, measData = null, activeKeys = null) {
    const paramInfo = CONFIG.parameterMapping[paramKey];
    if (!paramInfo) return;

    const stationKey = document.getElementById('station-select')?.value;
    const stationName = CONFIG.stations[stationKey]?.name || stationKey;

    const traces = [];
    for (const scenario of activeScenarios) {
      const data = stationData[scenario];
      if (!data) continue;

      const is2060 = scenario.includes('2060');
      const values = this.loader.getParameterValues(data, paramKey, is2060);
      if (!values) continue;

      traces.push({
        x: CONFIG.months,
        y: this.monthlyMeans(data, values, paramKey),
        type: 'bar',
        name: SCENARIO_LABELS[scenario],
        marker: { color: CHART_COLORS[scenario] },
        hovertemplate: '%{y:.1f}<extra></extra>',
      });
    }

    // Add measurement bars for temperature
    if (paramKey === 'temp' && measData) {
      const pairs = this._allMeasPairs(measData);
      for (const pair of pairs) {
        if (activeKeys && !activeKeys.includes(pair.key)) continue;
        const color = MEASUREMENT_YEAR_COLORS[pair.colorIdx % MEASUREMENT_YEAR_COLORS.length];
        const pairData = measData.filter((e) => e.source === pair.source && e.year === pair.year);
        const { dates, means } = this._monthlyMeansFromHourly(pairData);
        const yValues = new Array(12).fill(null);
        dates.forEach((d, i) => { yValues[parseInt(d.substring(5, 7)) - 1] = means[i]; });
        traces.push({
          x: CONFIG.months,
          y: yValues,
          type: 'bar',
          name: `${pair.sourceLabel} ${pair.year}`,
          marker: { color },
          hovertemplate: '%{y:.1f}<extra></extra>',
        });
      }
    }

    const layout = {
      ...METEO_LAYOUT,
      title: {
        text: `Monatlicher Vergleich: ${paramInfo.label} — ${stationName}`,
        font: { size: 16, weight: 'bold' },
        x: 0.01,
        xanchor: 'left',
      },
      barmode: 'group',
      xaxis: { ...BASE_AXIS },
      yaxis: {
        ...METEO_LAYOUT.yaxis,
        title: { text: `${paramInfo.label} (${paramInfo.unit})`, standoff: 10 },
      },
    };

    await Plotly.newPlot(containerId, traces, layout, {
      responsive: true,
      displaylogo: false,
    });
  }

  async renderDifferenceChart(containerId, stationData, paramKey, activeScenarios) {
    const paramInfo = CONFIG.parameterMapping[paramKey];
    if (!paramInfo) return;

    const stationKey = document.getElementById('station-select')?.value;
    const stationName = CONFIG.stations[stationKey]?.name || stationKey;

    const traces = [];

    for (const scenarioType of ['DRY', '1in10']) {
      const key2023 = scenarioType === 'DRY' ? 'dry2023' : 'warm2023';
      const key2060 = scenarioType === 'DRY' ? 'dry2060' : 'warm2060';

      if (!activeScenarios.includes(key2023) || !activeScenarios.includes(key2060)) continue;

      const data2023 = stationData[key2023];
      const data2060 = stationData[key2060];
      if (!data2023 || !data2060) continue;

      const vals2023 = this.loader.getParameterValues(data2023, paramKey, false);
      const vals2060 = this.loader.getParameterValues(data2060, paramKey, true);
      if (!vals2023 || !vals2060) continue;

      const mean2023 = this.monthlyMeans(data2023, vals2023, paramKey);
      const mean2060 = this.monthlyMeans(data2060, vals2060, paramKey);
      const diff = mean2060.map((v, i) => v - mean2023[i]);
      const color = scenarioType === 'DRY' ? CHART_COLORS.dry2060 : CHART_COLORS.warm2060;

      traces.push({
        x: CONFIG.months,
        y: diff,
        type: 'bar',
        name: `Δ ${CONFIG.scenarios[scenarioType].label}`,
        marker: { color: diff.map((d) => (d >= 0 ? color : 'rgb(46, 134, 193)')) },
        hovertemplate: '%{y:+.2f}<extra></extra>',
      });
    }

    const layout = {
      ...METEO_LAYOUT,
      title: {
        text: `Änderung 2060 vs. 2023: ${paramInfo.label} — ${stationName}`,
        font: { size: 16, weight: 'bold' },
        x: 0.01,
        xanchor: 'left',
      },
      barmode: 'group',
      xaxis: { ...BASE_AXIS },
      yaxis: {
        ...METEO_LAYOUT.yaxis,
        title: { text: `Δ ${paramInfo.label} (${paramInfo.unit})`, standoff: 10 },
      },
    };

    await Plotly.newPlot(containerId, traces, layout, {
      responsive: true,
      displaylogo: false,
    });
  }

  _dailyMeansFromHourly(hourlyData) {
    const byDate = new Map();
    for (const { date, value } of hourlyData) {
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push(value);
    }
    const dates = [...byDate.keys()].sort();
    return {
      dates,
      means: dates.map((d) => {
        const v = byDate.get(d);
        return v.reduce((a, b) => a + b, 0) / v.length;
      }),
    };
  }

  _dailyMeansFromClimate(data, paramKey, is2060, filterMonths) {
    const timestamps = this.loader.buildTimestamps(data);
    const values = this.loader.getParameterValues(data, paramKey, is2060);
    if (!values) return null;

    const byDate = new Map();
    timestamps.forEach((ts, i) => {
      const month = parseInt(ts.slice(5, 7));
      if (!filterMonths || filterMonths.has(month)) {
        const date = ts.slice(0, 10);
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date).push(values[i]);
      }
    });

    const dates = [...byDate.keys()].sort();
    return {
      dates,
      means: dates.map((d) => {
        const v = byDate.get(d);
        return v.reduce((a, b) => a + b, 0) / v.length;
      }),
    };
  }

  _rmse(walcheDates, walcheMeans, climateDates, climateMeans) {
    const climateMap = new Map(climateDates.map((d, i) => [d, climateMeans[i]]));
    const sq = walcheDates
      .map((d, i) => {
        const c = climateMap.get(d);
        return c !== undefined ? (walcheMeans[i] - c) ** 2 : null;
      })
      .filter((v) => v !== null);
    return sq.length > 0 ? Math.sqrt(sq.reduce((a, b) => a + b, 0) / sq.length) : NaN;
  }

  _mae(walcheDates, walcheMeans, climateDates, climateMeans) {
    const climateMap = new Map(climateDates.map((d, i) => [d, climateMeans[i]]));
    const abs = walcheDates
      .map((d, i) => {
        const c = climateMap.get(d);
        return c !== undefined ? Math.abs(walcheMeans[i] - c) : null;
      })
      .filter((v) => v !== null);
    return abs.length > 0 ? abs.reduce((a, b) => a + b, 0) / abs.length : NaN;
  }

  async renderWalcheOverlay(containerId, measData, stationData, activeKeys = null) {
    const stationKey = document.getElementById('station-select')?.value;
    const stationName = CONFIG.stations[stationKey]?.name || stationKey;

    // Filter months to those covered by any active measurement source
    const activeMeasData = activeKeys && activeKeys.length > 0
      ? measData.filter((e) => activeKeys.includes(`${e.source}||${e.year}`))
      : measData;
    const measMonths = activeMeasData.length > 0 ? new Set(activeMeasData.map((r) => r.month)) : null;

    const traces = [];

    for (const [scenario, label] of Object.entries(SCENARIO_LABELS)) {
      const data = stationData[scenario];
      if (!data) continue;
      const is2060 = scenario.includes('2060');
      const daily = this._dailyMeansFromClimate(data, 'temp', is2060, measMonths);
      if (!daily) continue;

      traces.push({
        x: daily.dates,
        y: daily.means,
        type: 'scatter',
        mode: 'lines',
        name: label,
        line: { color: CHART_COLORS[scenario], width: 1.5 },
        opacity: 0.85,
        hovertemplate: '%{y:.1f} °C<extra></extra>',
      });
    }

    // One measured trace per (source, year) pair
    traces.push(...this._measurementTraces(measData, 'daily', activeKeys));

    const layout = {
      ...METEO_LAYOUT,
      title: {
        text: `Lufttemperatur Tagesmittel: Messwerte vs. Klimadaten ${stationName}`,
        font: { size: 16, weight: 'bold' },
        x: 0.01,
        xanchor: 'left',
      },
      xaxis: {
        ...METEO_LAYOUT.xaxis,
        title: { text: 'Datum (Messwerte 2025–2026, normiert auf 2024 zur Achsenausrichtung)' },
      },
      yaxis: {
        ...METEO_LAYOUT.yaxis,
        title: { text: 'Lufttemperatur (°C)', standoff: 10 },
        dtick: 10,
      },
    };

    await Plotly.newPlot(containerId, traces, layout, {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    });
  }

  async renderWalcheRMSE(containerId, measData, stationData, activeKeys = null) {
    const stationKey = document.getElementById('station-select')?.value;
    const stationName = CONFIG.stations[stationKey]?.name || stationKey;

    const pairs = this._allMeasPairs(measData);
    const markerSymbols = ['circle', 'diamond', 'square', 'cross', 'triangle-up'];
    const traces = [];

    pairs.forEach((pair) => {
      if (activeKeys && !activeKeys.includes(pair.key)) return;
      const pairData = measData.filter((e) => e.source === pair.source && e.year === pair.year);
      const pairMonths = new Set(pairData.map((r) => r.month));
      const pairDaily = this._dailyMeansFromHourly(pairData);
      const measColor = MEASUREMENT_YEAR_COLORS[pair.colorIdx % MEASUREMENT_YEAR_COLORS.length];
      const traceName = `${pair.sourceLabel} ${pair.year}`;

      const labels = [];
      const rmseVals = [];
      const maeVals = [];
      const barColors = [];

      for (const scenario of Object.keys(SCENARIO_LABELS)) {
        const data = stationData[scenario];
        if (!data) continue;
        const is2060 = scenario.includes('2060');
        const daily = this._dailyMeansFromClimate(data, 'temp', is2060, pairMonths);
        if (!daily) continue;

        labels.push(SCENARIO_LABELS[scenario]);
        rmseVals.push(this._rmse(pairDaily.dates, pairDaily.means, daily.dates, daily.means));
        maeVals.push(this._mae(pairDaily.dates, pairDaily.means, daily.dates, daily.means));
        barColors.push(CHART_COLORS[scenario]);
      }

      traces.push({
        x: labels,
        y: rmseVals,
        type: 'bar',
        name: `RMSE ${traceName}`,
        marker: { color: barColors },
        text: rmseVals.map((v) => (Number.isFinite(v) ? `${v.toFixed(2)} °C` : '')),
        textposition: 'outside',
        hovertemplate: `RMSE ${traceName}: %{y:.2f} °C<extra></extra>`,
      });

      traces.push({
        x: labels,
        y: maeVals,
        type: 'scatter',
        mode: 'markers',
        name: `MAE ${traceName}`,
        marker: { color: measColor, size: 11, symbol: markerSymbols[pair.colorIdx % markerSymbols.length] },
        hovertemplate: `MAE ${traceName}: %{y:.2f} °C<extra></extra>`,
      });
    });

    const allVals = traces.flatMap((t) => t.y).filter(Number.isFinite);
    const rawMax = allVals.length > 0 ? Math.max(...allVals) : 5;
    const safeMax = rawMax > 0 ? rawMax : 5;

    const layout = {
      ...METEO_LAYOUT,
      title: {
        text: `Abweichung von den Messwerten — ${stationName} (Tagesmittel)`,
        font: { size: 16, weight: 'bold' },
        x: 0.01,
        xanchor: 'left',
      },
      hovermode: 'x',
      barmode: 'group',
      xaxis: { ...BASE_AXIS },
      yaxis: {
        ...METEO_LAYOUT.yaxis,
        title: { text: 'Abweichung (°C)', standoff: 10 },
        range: [0, safeMax * 1.25],
      },
    };

    await Plotly.newPlot(containerId, traces, layout, {
      responsive: true,
      displaylogo: false,
    });
  }

  async renderHeatmap(containerId, data, paramKey, is2060, scenarioLabel) {
    const values = this.loader.getParameterValues(data, paramKey, is2060);
    if (!values) return;

    const paramInfo =
      CONFIG.parameterMapping[paramKey] || CONFIG.parametersOnly2023[paramKey];
    const stationKey = document.getElementById('station-select')?.value;
    const stationName = CONFIG.stations[stationKey]?.name || stationKey;

    const grid = Array.from({ length: 24 }, () => new Array(366).fill(null));
    const dayLabels = [];

    let dayIndex = -1;
    let lastDay = '';
    data.forEach((row, i) => {
      const day = `${row['time.mm']}/${row['time.dd']}`;
      if (day !== lastDay) {
        lastDay = day;
        dayIndex++;
        const mm = String(row['time.mm']).padStart(2, '0');
        const dd = String(row['time.dd']).padStart(2, '0');
        dayLabels.push(`2024-${mm}-${dd}`);
      }
      const hour = row['time.hh'];
      if (dayIndex < 366 && hour < 24) {
        grid[hour][dayIndex] = values[i];
      }
    });

    const trace = {
      z: grid,
      x: dayLabels,
      type: 'heatmap',
      colorscale: paramKey === 'temp' || paramKey === 'tre200h0'
        ? [[0, '#2166ac'], [0.25, '#67a9cf'], [0.5, '#f7f7f7'], [0.75, '#ef8a62'], [1, '#b2182b']]
        : 'Viridis',
      colorbar: {
        title: { text: paramInfo.unit, side: 'right' },
        thickness: 15,
      },
      hovertemplate: 'Tag: %{x}<br>Stunde: %{y}h<br>Wert: %{z:.1f}<extra></extra>',
    };

    const layout = {
      ...METEO_LAYOUT,
      title: {
        text: `${paramInfo.label} — ${scenarioLabel} — ${stationName}`,
        font: { size: 16, weight: 'bold' },
        x: 0.01,
        xanchor: 'left',
      },
      xaxis: {
        ...METEO_LAYOUT.xaxis,
        title: { text: 'Tag des Jahres' },
      },
      yaxis: {
        ...METEO_LAYOUT.yaxis,
        title: { text: 'Stunde' },
        dtick: 3,
      },
    };

    await Plotly.newPlot(containerId, [trace], layout, {
      responsive: true,
      displaylogo: false,
    });
  }
}
