class App {
  constructor() {
    this.loader = new DataLoader(CONFIG.dataDir);
    this.charts = new ChartManager(this.loader);
    this.currentStationData = null;
    this.currentStation = null;
    this.availableParams = null;
    this.walcheData = null;
    this.stationMeasurementData = null;
    this._loadId = 0;
  }

  async init() {
    this.showLoading(true);
    try {
      await this.populateStations();
      this.bindEvents();
      const firstStation = document.getElementById('station-select').value;
      // Load Walche data before station so it's available on the first updateCharts call
      this.walcheData = await this.loader.loadWalcheData().catch(() => null);
      if (firstStation) await this.loadStation(firstStation);
    } catch (err) {
      this.showError('Fehler beim Laden der App: ' + err.message);
    }
    this.showLoading(false);
  }

  async populateStations() {
    const select = document.getElementById('station-select');
    const available = await this.loader.detectAvailableStations();

    if (available.length === 0) {
      this.showError(
        'Keine Stationsdaten gefunden. Bitte stellen Sie sicher, dass die CSV-Dateien im Verzeichnis "data/" vorhanden sind.'
      );
      return;
    }

    select.innerHTML = '';
    for (const key of available) {
      const station = CONFIG.stations[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${station.name} (${key})`;
      select.appendChild(opt);
    }
  }

  bindEvents() {
    document.getElementById('station-select').addEventListener('change', () => {
      this.loadStation(document.getElementById('station-select').value);
    });

    document.getElementById('param-select').addEventListener('change', () => {
      this.updateCharts();
    });

    document.getElementById('aggregation-select').addEventListener('change', () => {
      const agg = document.getElementById('aggregation-select').value;
      const vmSelect = document.getElementById('view-mode');
      const vm = vmSelect.value;
      // Reset incompatible view modes to avoid empty page
      if ((vm === 'comparison' || vm === 'difference') && agg !== 'monthly') {
        vmSelect.value = 'all';
      } else if (vm === 'heatmap' && agg !== 'hourly') {
        vmSelect.value = 'all';
      }
      this.updateCharts();
    });

    document.getElementById('view-mode').addEventListener('change', () => {
      const vm = document.getElementById('view-mode').value;
      const aggSelect = document.getElementById('aggregation-select');
      if ((vm === 'comparison' || vm === 'difference') && aggSelect.value !== 'monthly') {
        aggSelect.value = 'monthly';
      } else if (vm === 'heatmap' && aggSelect.value !== 'hourly') {
        aggSelect.value = 'hourly';
      }
      this.updateCharts();
    });

    document.querySelectorAll('.scenario-toggle').forEach((cb) => {
      cb.addEventListener('change', () => this.updateCharts());
    });
  }

  buildMeasurementCheckboxes() {
    const measData = this.stationMeasurementData || this.walcheData;
    const container = document.getElementById('measurement-checkboxes');
    container.innerHTML = '';

    if (!measData || !this.currentStation) return;

    const years = [...new Set(measData.map((e) => e.year))].sort();
    const measLabel = CONFIG.stations[this.currentStation]?.measurementLabel || 'Messung Walche';

    years.forEach((year, idx) => {
      const color = MEASUREMENT_YEAR_COLORS[idx % MEASUREMENT_YEAR_COLORS.length];
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" class="measurement-year-toggle" value="${year}" checked>
        <span class="color-dot" style="background: ${color}"></span>
        ${measLabel} ${year}
      `;
      container.appendChild(label);
    });

    container.querySelectorAll('.measurement-year-toggle').forEach((cb) => {
      cb.addEventListener('change', () => this.updateCharts());
    });
  }

  getActiveYears() {
    return [...document.querySelectorAll('.measurement-year-toggle:checked')].map((cb) =>
      parseInt(cb.value)
    );
  }

  async loadStation(stationKey) {
    const loadId = ++this._loadId;
    this.showLoading(true);
    this.currentStation = stationKey;

    try {
      const [data, measData] = await Promise.all([
        this.loader.loadStationData(stationKey),
        this.loader.loadStationMeasurements(stationKey).catch(() => null),
      ]);
      if (loadId !== this._loadId) return;
      this.currentStationData = data;
      this.stationMeasurementData = measData;
      this.availableParams = this.loader.getAvailableParameters(this.currentStationData);
      this.populateParameters();
      this.updateStationInfo(stationKey);
      this.buildMeasurementCheckboxes();
      await this.updateCharts();
    } catch (err) {
      if (loadId !== this._loadId) return;
      this.showError('Fehler beim Laden der Stationsdaten: ' + err.message);
    }

    this.showLoading(false);
  }

  populateParameters() {
    const select = document.getElementById('param-select');
    const currentValue = select.value;
    select.innerHTML = '';

    if (this.availableParams.comparable.length > 0) {
      const group = document.createElement('optgroup');
      group.label = 'Vergleichbar (2023 & 2060)';
      for (const p of this.availableParams.comparable) {
        const opt = document.createElement('option');
        opt.value = p.key;
        opt.textContent = `${p.label} (${p.unit})`;
        group.appendChild(opt);
      }
      select.appendChild(group);
    }

    if (this.availableParams.only2023.length > 0) {
      const group = document.createElement('optgroup');
      group.label = 'Nur 2023';
      for (const p of this.availableParams.only2023) {
        const opt = document.createElement('option');
        opt.value = p.key;
        opt.textContent = `${p.label} (${p.unit})`;
        group.appendChild(opt);
      }
      select.appendChild(group);
    }

    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
      select.value = currentValue;
    }
  }

  updateStationInfo(stationKey) {
    const station = CONFIG.stations[stationKey];
    const infoEl = document.getElementById('station-info');
    const dataStatus = [];

    for (const [key, label] of Object.entries(SCENARIO_LABELS)) {
      const available = this.currentStationData[key] !== null;
      dataStatus.push(
        `<span class="status-badge ${available ? 'available' : 'unavailable'}">${label}</span>`
      );
    }

    infoEl.innerHTML = `
      <strong>${station.name}</strong>
      <div class="data-status">${dataStatus.join(' ')}</div>
    `;
  }

  getActiveScenarios() {
    const scenarios = [];
    document.querySelectorAll('.scenario-toggle:checked').forEach((cb) => {
      scenarios.push(cb.value);
    });
    return scenarios;
  }

  async updateCharts() {
    if (!this.currentStationData) return;

    const paramKey = document.getElementById('param-select').value;
    const aggregation = document.getElementById('aggregation-select').value;
    const viewMode = document.getElementById('view-mode').value;
    const activeScenarios = this.getActiveScenarios();

    if (!paramKey) return;

    const isComparable = CONFIG.parameterMapping.hasOwnProperty(paramKey);
    const scenariosToUse = isComparable
      ? activeScenarios
      : activeScenarios.filter((s) => s.includes('2023'));

    const hasMeasurements = paramKey === 'temp' && !!(this.stationMeasurementData || this.walcheData);
    const measHeading = document.getElementById('measurements-heading');
    const measContainer = document.getElementById('measurement-checkboxes');
    if (measHeading) measHeading.style.display = hasMeasurements ? '' : 'none';
    if (measContainer) measContainer.style.display = hasMeasurements ? '' : 'none';
    const activeYears = hasMeasurements ? this.getActiveYears() : [];

    const isMonthly = aggregation === 'monthly';
    const showWalche = viewMode === 'walche';
    const showTimeseries = !showWalche && (viewMode === 'timeseries' || viewMode === 'all');
    const showComparison = !showWalche && (viewMode === 'comparison' || viewMode === 'all') && isComparable && isMonthly;
    const showDifference = !showWalche && (viewMode === 'difference' || viewMode === 'all') && isComparable && isMonthly;
    const isHourly = aggregation === 'hourly';
    const showHeatmap = !showWalche && (viewMode === 'heatmap' || viewMode === 'all') && isHourly;

    document.getElementById('chart-timeseries').style.display = showTimeseries ? 'block' : 'none';
    document.getElementById('chart-comparison').style.display = showComparison ? 'block' : 'none';
    document.getElementById('chart-difference').style.display = showDifference ? 'block' : 'none';
    document.getElementById('chart-walche-overlay').style.display = showWalche ? 'block' : 'none';
    document.getElementById('chart-walche-rmse').style.display = showWalche ? 'block' : 'none';

    const heatmapWrapper = document.getElementById('heatmap-wrapper');
    heatmapWrapper.style.display = showHeatmap ? 'block' : 'none';
    this.ensureHeatmapContainers(showHeatmap ? scenariosToUse : []);

    // Force reflow so Plotly reads correct container dimensions
    document.getElementById('chart-timeseries').offsetHeight;

    const tasks = [];

    const measData = hasMeasurements ? (this.stationMeasurementData || this.walcheData) : null;
    const measLabel = CONFIG.stations[this.currentStation]?.measurementLabel || 'Messung Walche';

    if (showTimeseries) {
      tasks.push(
        this.charts.renderTimeseries(
          'chart-timeseries',
          this.currentStationData,
          paramKey,
          scenariosToUse,
          aggregation,
          measData,
          measLabel,
          activeYears
        )
      );
    }

    if (showComparison) {
      tasks.push(
        this.charts.renderComparisonChart(
          'chart-comparison',
          this.currentStationData,
          paramKey,
          scenariosToUse,
          measData,
          measLabel,
          activeYears
        )
      );
    }

    if (showDifference) {
      tasks.push(
        this.charts.renderDifferenceChart(
          'chart-difference',
          this.currentStationData,
          paramKey,
          scenariosToUse
        )
      );
    }

    if (showHeatmap) {
      for (const scenario of scenariosToUse) {
        const data = this.currentStationData[scenario];
        if (!data) continue;
        tasks.push(
          this.charts.renderHeatmap(
            `chart-heatmap-${scenario}`,
            data,
            paramKey,
            scenario.includes('2060'),
            SCENARIO_LABELS[scenario]
          )
        );
      }
    }

    if (showWalche) {
      const walcheMeasData = this.stationMeasurementData || this.walcheData;
      const walcheMeasLabel = CONFIG.stations[this.currentStation]?.measurementLabel || 'Messung Walche';
      if (walcheMeasData) {
        tasks.push(this.charts.renderWalcheOverlay('chart-walche-overlay', walcheMeasData, walcheMeasLabel, this.currentStationData, activeYears));
        tasks.push(this.charts.renderWalcheRMSE('chart-walche-rmse', walcheMeasData, walcheMeasLabel, this.currentStationData, activeYears));
      } else {
        document.getElementById('chart-walche-overlay').style.display = 'none';
        document.getElementById('chart-walche-rmse').style.display = 'none';
        this.showError('Keine Messdaten für diese Station verfügbar.');
      }
    }

    await Promise.all(tasks);

    if (!isComparable && activeScenarios.some((s) => s.includes('2060'))) {
      document.getElementById('param-note').style.display = 'block';
      document.getElementById('param-note').textContent =
        'Hinweis: Dieser Parameter ist nur für 2023 verfügbar. 2060-Szenarien werden ausgeblendet.';
    } else {
      document.getElementById('param-note').style.display = 'none';
    }
  }

  ensureHeatmapContainers(scenarios) {
    const wrapper = document.getElementById('heatmap-wrapper');
    wrapper.innerHTML = '';
    for (const scenario of scenarios) {
      const div = document.createElement('div');
      div.id = `chart-heatmap-${scenario}`;
      div.className = 'chart-container';
      wrapper.appendChild(div);
    }
  }

  showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
  }

  showError(message) {
    const el = document.getElementById('error-message');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => (el.style.display = 'none'), 8000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
