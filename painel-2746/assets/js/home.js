(async function () {
  const res = await fetch('data/manifest.json');
  const m = await res.json();

  const fmt = (n) => n.toLocaleString('pt-BR');
  const period = document.getElementById('r-period');
  const records = document.getElementById('r-records');
  const vars = document.getElementById('r-vars');

  const start = m.ti.min.slice(0, 10).split('-').reverse().join('/');
  const end = m.ti.max.slice(0, 10).split('-').reverse().join('/');
  period.textContent = `${start} – ${end}`;
  records.textContent = fmt(m.ti.count + m.tm.count);
  vars.textContent = `${m.ti.columns.length + m.tm.columns.length} canais · 2 tabelas`;

  const tiCountEl = document.getElementById('ti-count');
  const tmCountEl = document.getElementById('tm-count');
  const tiVarsEl = document.getElementById('ti-vars');
  const tmVarsEl = document.getElementById('tm-vars');

  if (tiCountEl) tiCountEl.textContent = fmt(m.ti.count) + ' registros';
  if (tmCountEl) tmCountEl.textContent = fmt(m.tm.count) + ' registros';
  if (tiVarsEl) tiVarsEl.textContent = m.ti.columns.join(' · ');
  if (tmVarsEl) tmVarsEl.textContent = m.tm.columns.join(' · ');
})();
