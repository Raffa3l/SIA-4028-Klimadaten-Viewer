const CHART_COLORS = {
  dry2023:  'rgb(27, 79, 114)',
  warm2023: 'rgb(46, 134, 193)',
  dry2060:  'rgb(192, 57, 43)',
  warm2060: 'rgb(231, 76, 60)',

  dry2023_fill:  'rgba(27, 79, 114, 0.08)',
  warm2023_fill: 'rgba(46, 134, 193, 0.08)',
  dry2060_fill:  'rgba(192, 57, 43, 0.08)',
  warm2060_fill: 'rgba(231, 76, 60, 0.08)',
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
      const key = ts.substring(0, keyLen);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(values[i]);
    });

    const x = [];
    const y = [];
    for (const [key, vals] of groups) {
      x.push(key + suffix);
      const sum = vals.reduce((a, b) => a + (b ?? 0), 0);
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

  async renderTimeseries(containerId, stationData, paramKey, activeScenarios, aggregation) {
    const paramInfo =
      CONFIG.parameterMapping[paramKey] || CONFIG.parametersOnly2023[paramKey];
    if (!paramInfo) return;

    const stationKey = document.getElementById('station-select')?.value;
    const stationName = CONFIG.stations[stationKey]?.name || stationKey;
    const title = `${paramInfo.label} — ${stationName}`;

    const traces = this.createTimeseriesTraces(stationData, paramKey, activeScenarios, aggregation);
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
      const m = row['time.mm'] - 1;
      sums[m] += (values[i] ?? 0);
      counts[m]++;
    });
    return sums.map((s, i) => counts[i] > 0 ? (useSum ? s : s / counts[i]) : 0);
  }

  async renderComparisonChart(containerId, stationData, paramKey, activeScenarios) {
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
