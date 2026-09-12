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

  document.getElementById('ti-count').textContent = fmt(m.ti.count) + ' registros';
  document.getElementById('tm-count').textContent = fmt(m.tm.count) + ' registros';
  document.getElementById('ti-vars').textContent = m.ti.columns.join(' · ');
  document.getElementById('tm-vars').textContent = m.tm.columns.join(' · ');
})();
