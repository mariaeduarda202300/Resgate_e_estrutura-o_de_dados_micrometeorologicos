(async function () {
  const statusEl = document.getElementById('status');
  const chartEl = document.getElementById('chart');
  const varSelect = document.getElementById('variable');
  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');
  const applyBtn = document.getElementById('apply');
  const toggleBtns = document.querySelectorAll('.table-toggle button');
  const summaryEl = document.getElementById('summary');

  let manifest = null;
  let currentTable = 'tm';
  let chart = null;

  function setStatus(msg, kind) {
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
    statusEl.innerHTML = kind === 'idle' || kind === 'error'
      ? `<span class="dot"></span>${msg}`
      : `<span class="dot"></span>${msg}`;
  }

  function fmtDate(ms) {
    return new Date(ms).toISOString().slice(0, 10);
  }

  function populateVariables() {
    const meta = manifest[currentTable];
    varSelect.innerHTML = '';
    meta.columns.forEach((c) => {
      const label = manifest.labels[c] ? manifest.labels[c].label : c;
      const unit = manifest.labels[c] && manifest.labels[c].unit ? ` (${manifest.labels[c].unit})` : '';
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = label + unit;
      varSelect.appendChild(opt);
    });
  }

  function boundsForTable() {
    const meta = manifest[currentTable];
    return {
      min: new Date(meta.min.replace(' ', 'T') + 'Z').getTime(),
      max: new Date(meta.max.replace(' ', 'T') + 'Z').getTime(),
    };
  }

  function applyTableToUI() {
    const { min, max } = boundsForTable();
    fromInput.min = fmtDate(min);
    fromInput.max = fmtDate(max);
    toInput.min = fmtDate(min);
    toInput.max = fmtDate(max);
    if (!fromInput.value) fromInput.value = fmtDate(min);
    if (!toInput.value) toInput.value = fmtDate(max);
    populateVariables();
  }

  toggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTable = btn.dataset.table;
      fromInput.value = '';
      toInput.value = '';
      applyTableToUI();
      loadAndRender();
    });
  });

  function renderChart(seriesName, unit, points, rangeStart, rangeEnd) {
    const data = points.map(([t, v]) => [t, v]);
    const options = {
      chart: {
        type: 'line',
        height: 420,
        background: 'transparent',
        foreColor: '#6b6f9a',
        toolbar: { autoSelected: 'zoom' },
        zoom: { enabled: true },
        animations: { enabled: false },
      },
      theme: { mode: 'light' },
      series: [{ name: seriesName, data }],
      stroke: { width: 2.2, curve: 'smooth' },
      colors: [currentTable === 'ti' ? '#8ec7ff' : '#a78bfa'],
      grid: { borderColor: 'rgba(44,47,87,0.08)', strokeDashArray: 4 },
      xaxis: {
        type: 'datetime',
        min: rangeStart,
        max: rangeEnd,
        labels: { style: { fontFamily: 'Nunito Sans', fontSize: '11px', colors: '#6b6f9a' } },
      },
      yaxis: {
        title: { text: unit || '', style: { fontFamily: 'Nunito Sans', fontSize: '11px', color: '#9a9dc2' } },
        labels: { style: { fontFamily: 'Nunito Sans', fontSize: '11px', colors: '#6b6f9a' } },
      },
      tooltip: { x: { format: 'dd MMM yyyy HH:mm:ss' } },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      annotations: {
        xaxis: [
          {
            x: rangeStart,
            borderColor: '#4f7cff',
            strokeDashArray: 4,
            label: {
              text: 'Início',
              borderColor: '#4f7cff',
              style: { color: '#fff', background: '#4f7cff', fontFamily: 'Nunito Sans' },
            },
          },
          {
            x: rangeEnd,
            borderColor: '#a78bfa',
            strokeDashArray: 4,
            label: {
              text: 'Fim',
              borderColor: '#a78bfa',
              style: { color: '#fff', background: '#a78bfa', fontFamily: 'Nunito Sans' },
            },
          },
        ],
      },
      noData: {
        text: 'Nenhum registro no intervalo selecionado',
        align: 'center',
        verticalAlign: 'middle',
        style: { color: '#6b6f9a', fontFamily: 'Nunito Sans', fontSize: '14px' },
      },
    };

    if (chart) {
      chart.updateOptions(options, true, true);
    } else {
      chart = new ApexCharts(chartEl, options);
      chart.render();
    }
  }

  function renderSummary(points, unit) {
    if (!points.length) {
      summaryEl.innerHTML = '';
      return;
    }
    const values = points.map((p) => p[1]).filter((v) => Number.isFinite(v));
    if (!values.length) {
      summaryEl.innerHTML = '';
      return;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const accent = currentTable === 'ti' ? 'amber' : 'teal';
    summaryEl.innerHTML = `
      <div><span class="k">PONTOS</span><span class="v">${points.length.toLocaleString('pt-BR')}</span></div>
      <div><span class="k">MÍNIMO</span><span class="v ${accent}">${min.toFixed(2)}${unit}</span></div>
      <div><span class="k">MÁXIMO</span><span class="v ${accent}">${max.toFixed(2)}${unit}</span></div>
      <div><span class="k">MÉDIA</span><span class="v ${accent}">${avg.toFixed(2)}${unit}</span></div>
    `;
  }

  async function loadAndRender() {
    try {
      const meta = manifest[currentTable];
      const variable = varSelect.value || meta.columns[0];
      const label = manifest.labels[variable] ? manifest.labels[variable].label : variable;
      const unit = manifest.labels[variable] ? manifest.labels[variable].unit : '';

      const startMs = new Date((fromInput.value || fmtDate(boundsForTable().min)) + 'T00:00:00Z').getTime();
      const endMs = new Date((toInput.value || fmtDate(boundsForTable().max)) + 'T23:59:59Z').getTime();

      if (startMs > endMs) {
        setStatus('data inicial não pode ser depois da data final', 'error');
        return;
      }

      setStatus('preparando consulta local…');
      await window.StationDB.ensureRange(currentTable, meta.columns, meta.files, startMs, endMs, (msg) => setStatus(msg));

      setStatus('consultando IndexedDB…');
      const rows = await window.StationDB.queryRange(currentTable, variable, startMs, endMs);

      const MAX_POINTS = 4000;
      const plotted = rows.length > MAX_POINTS ? window.StationDB.lttb(rows, MAX_POINTS) : rows;

      renderChart(label, unit, plotted, startMs, endMs);
      renderSummary(rows, unit ? ` ${unit}` : '');

      const note = rows.length > MAX_POINTS
        ? ` · exibindo ${plotted.length.toLocaleString('pt-BR')} pontos (reamostrados de ${rows.length.toLocaleString('pt-BR')})`
        : '';
      setStatus(`${rows.length.toLocaleString('pt-BR')} registros no intervalo${note}`, 'idle');
    } catch (err) {
      console.error(err);
      setStatus('erro ao carregar dados — veja o console', 'error');
    }
  }

  applyBtn.addEventListener('click', loadAndRender);
  varSelect.addEventListener('change', loadAndRender);

  // boot
  setStatus('carregando manifesto…');
  const res = await fetch('data/manifest.json');
  manifest = await res.json();
  applyTableToUI();
  await loadAndRender();
})();
