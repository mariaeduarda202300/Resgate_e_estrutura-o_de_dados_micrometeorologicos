/**
 * db.js — camada de "banco de dados" local do painel 2746.
 *
 * Os dados brutos (TI/TM) ficam pré-processados em JSON diário em /data.
 * Este módulo carrega esses arquivos sob demanda, guarda tudo num
 * IndexedDB indexado por timestamp, e responde consultas por
 * (tabela, variável, intervalo de datas) sem precisar reler o JSON
 * de novo depois da primeira visita.
 */

const DB_NAME = '2746-station-db';
const DB_VERSION = 1;
const STORES = ['ti', 'tm'];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 't' });
          store.createIndex('by_t', 't');
        }
      });
      if (!db.objectStoreNames.contains('loaded_days')) {
        db.createObjectStore('loaded_days', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function isDayLoaded(table, date) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loaded_days', 'readonly');
    const req = tx.objectStore('loaded_days').get(`${table}:${date}`);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
}

async function markDayLoaded(table, date) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loaded_days', 'readwrite');
    tx.objectStore('loaded_days').put({ id: `${table}:${date}`, table, date });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Insere um dia inteiro (formato colunar) na object store, em lote. */
async function insertDay(table, columns, dayJson) {
  const db = await openDB();
  const n = dayJson.t.length;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    for (let i = 0; i < n; i++) {
      const row = { t: dayJson.t[i] };
      for (const c of columns) row[c] = dayJson[c][i];
      store.put(row);
    }
    tx.oncomplete = () => resolve(n);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Garante que os dias necessários para [startMs, endMs] estejam no
 * IndexedDB, buscando os JSONs faltantes em /data/<table>/<date>.json.
 * onProgress(msg) reporta o andamento pro status bar da UI.
 */
async function ensureRange(table, columns, manifestFiles, startMs, endMs, onProgress) {
  const needed = manifestFiles.filter((f) => {
    const dayStart = new Date(f.date + 'T00:00:00Z').getTime();
    const dayEnd = dayStart + 86400000;
    return dayEnd >= startMs && dayStart <= endMs;
  });

  for (const f of needed) {
    const already = await isDayLoaded(table, f.date);
    if (already) {
      onProgress && onProgress(`${f.date} já em cache local`);
      continue;
    }
    onProgress && onProgress(`baixando ${table}/${f.date}.json (${f.count.toLocaleString('pt-BR')} registros)`);
    const res = await fetch(`data/${table}/${f.file}`);
    if (!res.ok) throw new Error(`falha ao buscar ${f.file}`);
    const json = await res.json();
    await insertDay(table, columns, json);
    await markDayLoaded(table, f.date);
  }
}

/** Consulta t + valor de uma variável dentro de [startMs, endMs], em ordem. */
async function queryRange(table, variable, startMs, endMs) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(table, 'readonly');
    const idx = tx.objectStore(table).index('by_t');
    const range = IDBKeyRange.bound(startMs, endMs);
    const out = [];
    const req = idx.openCursor(range);
    req.onsuccess = (ev) => {
      const cursor = ev.target.result;
      if (cursor) {
        out.push([cursor.value.t, cursor.value[variable]]);
        cursor.continue();
      } else {
        resolve(out);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Downsampling LTTB (Largest Triangle Three Buckets) — preserva a forma
 * visual da série reduzindo o número de pontos plotados no ApexCharts.
 */
function lttb(data, threshold) {
  const n = data.length;
  if (threshold >= n || threshold <= 2) return data;

  const sampled = [data[0]];
  const bucketSize = (n - 2) / (threshold - 2);
  let a = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);

    const avgRangeStart = Math.floor(i * bucketSize) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, n);
    let avgX = 0, avgY = 0;
    const avgLen = avgRangeEnd - avgRangeStart;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j][0];
      avgY += data[j][1];
    }
    avgX /= avgLen || 1;
    avgY /= avgLen || 1;

    const pointAX = data[a][0], pointAY = data[a][1];
    let maxArea = -1, maxAreaIdx = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (pointAX - avgX) * (data[j][1] - pointAY) -
        (pointAX - data[j][0]) * (avgY - pointAY)
      ) * 0.5;
      if (area > maxArea) { maxArea = area; maxAreaIdx = j; }
    }
    sampled.push(data[maxAreaIdx]);
    a = maxAreaIdx;
  }
  sampled.push(data[n - 1]);
  return sampled;
}

window.StationDB = { ensureRange, queryRange, lttb, openDB };
