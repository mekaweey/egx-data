// THE DEFINITIVE COMPARISON: TradingView bridge vs Thunder extension — full session day
// 1) Coverage per source  2) Price agreement at matched moments  3) TV LAG in seconds
// ASCII ONLY.
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const { Pool } = require('pg');
const pool = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  // load thunder marketwatch snapshots (session day, Cairo)
  const { rows: mw } = await pool.query(`
    SELECT symbol, last_price::float p, captured_at AT TIME ZONE 'Africa/Cairo' tc
    FROM marketwatch_snapshots
    WHERE captured_at AT TIME ZONE 'Africa/Cairo' >= CURRENT_DATE
      AND EXTRACT(hour FROM captured_at AT TIME ZONE 'Africa/Cairo') BETWEEN 10 AND 14
      AND last_price > 0 ORDER BY captured_at`);
  // load thunder ticks too (sparse)
  const { rows: tk } = await pool.query(`
    SELECT symbol, price::float p, ts AT TIME ZONE 'Africa/Cairo' tc
    FROM live_ticks
    WHERE ts AT TIME ZONE 'Africa/Cairo' >= CURRENT_DATE
      AND EXTRACT(hour FROM ts AT TIME ZONE 'Africa/Cairo') BETWEEN 10 AND 14 ORDER BY ts`);
  // load TV bridge ticks (5s cadence)
  const { rows: tv } = await pool.query(`
    SELECT symbol, price::float p, ts AT TIME ZONE 'Africa/Cairo' tc
    FROM tv_ticks
    WHERE ts AT TIME ZONE 'Africa/Cairo' >= CURRENT_DATE
      AND EXTRACT(hour FROM ts AT TIME ZONE 'Africa/Cairo') BETWEEN 10 AND 14 ORDER BY ts`);
  console.log(`session rows: thunder-mw ${mw.length} | thunder-ticks ${tk.length} | TV ${tv.length}`);
  // index tv per symbol (sorted arrays)
  const tvBy = new Map();
  for (const r of tv) {
    if (!tvBy.has(r.symbol)) tvBy.set(r.symbol, []);
    tvBy.get(r.symbol).push([r.tc.getTime(), r.p]);
  }
  const mwSyms = new Set(mw.map(r => r.symbol));
  const tvSyms = new Set(tv.map(r => r.symbol));
  const both = [...mwSyms].filter(s => tvSyms.has(s));
  console.log('coverage: thunder-mw symbols:', mwSyms.size, '| TV symbols:', tvSyms.size, '| both:', both.length);
  // thunder mw cadence: snapshots per symbol
  const perSym = new Map();
  for (const r of mw) perSym.set(r.symbol, (perSym.get(r.symbol) || 0) + 1);
  const cad = [...perSym.values()].sort((a, b) => a - b);
  console.log('thunder mw cadence: per-symbol snapshots median', cad[Math.floor(cad.length / 2)], '| max', cad[cad.length - 1], '(over ~4.5h session)');
  // price agreement + LAG
  const lags = [], diffs = [];
  let noMatch = 0;
  for (const r of mw) {
    const arr = tvBy.get(r.symbol);
    if (!arr) continue;
    const T = r.tc.getTime(), P = r.p;
    // 1) price agreement: nearest TV price within ±6s
    let best = null, bestGap = Infinity;
    for (let i = arr.length - 1; i >= 0; i--) {
      const gap = Math.abs(arr[i][0] - T);
      if (gap <= 6000 && (best === null || gap < bestGap)) { best = arr[i][1]; bestGap = gap; }
      if (arr[i][0] < T - 6000) break;
    }
    if (best !== null) diffs.push(Math.abs(P - best) / P * 100);
    // 2) LAG: the latest tv tick at-or-before T with the same price
    let lagTs = null;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i][0] > T) continue;
      if (Math.abs(arr[i][1] - P) / P <= 0.001) { lagTs = arr[i][0]; }
      break; // only look at the contiguous run ending at T... simplify: newest tick <= T
    }
    // more robust: find the newest tv tick <= T whose price equals P (search back up to 15 min)
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i][0] > T) continue;
      if (T - arr[i][0] > 15 * 60000) break;
      if (Math.abs(arr[i][1] - P) / P <= 0.001) { lagTs = arr[i][0]; break; }
    }
    if (lagTs !== null) lags.push((T - lagTs) / 1000);
    else noMatch++;
  }
  console.log('');
  console.log('=== PRICE AGREEMENT (thunder vs TV within ±6s) ===');
  console.log('pairs:', diffs.length, '| avg |diff|:', (diffs.reduce((a, b) => a + b, 0) / Math.max(1, diffs.length)).toFixed(3) + '%', '| p90:', (diffs.slice().sort((a, b) => a - b)[Math.floor(diffs.length * 0.9)] || 0).toFixed(3) + '%');
  console.log('');
  console.log('=== TV LAG vs THUNDER (the decisive number) ===');
  console.log('matched pairs:', lags.length, '| unmatched (price not in TV window):', noMatch);
  if (lags.length) {
    const s = lags.slice().sort((a, b) => a - b);
    const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    console.log(`lag median: ${q(0.5).toFixed(0)}s | p75: ${q(0.75).toFixed(0)}s | p90: ${q(0.9).toFixed(0)}s | max: ${s[s.length - 1].toFixed(0)}s`);
    console.log(`lag <= 10s: ${(100 * lags.filter(x => x <= 10).length / lags.length).toFixed(0)}% | <= 30s: ${(100 * lags.filter(x => x <= 30).length / lags.length).toFixed(0)}% | <= 60s: ${(100 * lags.filter(x => x <= 60).length / lags.length).toFixed(0)}%`);
  }
  // per-symbol top examples
  const byS = new Map();
  for (let i = 0; i < mw.length; i++) {
    const r = mw[i];
    const arr = tvBy.get(r.symbol);
    if (!arr) continue;
    const T = r.tc.getTime(), P = r.p;
    for (let k = arr.length - 1; k >= 0; k--) {
      if (arr[k][0] > T) continue;
      if (T - arr[k][0] > 15 * 60000) break;
      if (Math.abs(arr[k][1] - P) / P <= 0.001) {
        if (!byS.has(r.symbol)) byS.set(r.symbol, []);
        byS.get(r.symbol).push((T - arr[k][0]) / 1000);
        break;
      }
    }
  }
  const top = [...byS.entries()].filter(([, v]) => v.length >= 10).map(([s, v]) => ({ s, med: v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)], n: v.length })).sort((a, b) => a.med - b.med);
  console.log('');
  console.log('=== per-symbol median lag (fastest 8, n>=10) ===');
  for (const d of top.slice(0, 8)) console.log(`  ${d.s}: median ${d.med.toFixed(0)}s (n=${d.n})`);
  await pool.end();
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
