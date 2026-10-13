// RAW EVIDENCE for the reviewer's two challenges:
// A) week 2026-08-23 exits (our exit = Sun 2026-08-30 open): dump raw candles
//    for the 5 picks from BOTH sources (DB daily_candles + user daily.csv),
//    and search where HIS exit prices (FIRE 5.23, AMES 139.00, CAED 145.01,
//    SPIN?, MOED?) appear in our data (which date/field).
// B) week 2026-05-24: sessions/candle-counts 5/20..6/7, candidate scan with
//    reject reasons, exit-session (5/31) reality check.
// ASCII ONLY. Run: node _reviewer_evidence.cjs
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });

// user file (first-minute source)
const userPx = new Map();
{
  const lines = fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/daily.csv', 'utf8').split('\n').filter(Boolean);
  for (const l of lines.slice(1)) {
    const c0 = l.split(',');
    const sym = c0[0].trim().toUpperCase();
    if (!HALAL.has(sym)) continue;
    const di = parseInt(c0[1]);
    const d = new Date(Date.UTC(1970, 0, 1) + di * 86400000).toISOString().slice(0, 10);
    const o = Number(c0[2]), h = Number(c0[3]), lw = Number(c0[4]), c = Number(c0[5]), v = Number(c0[6]);
    if (!userPx.has(sym)) userPx.set(sym, new Map());
    userPx.get(sym).set(d, { o, h, l: lw, c, v });
  }
}

(async () => {
  console.log('=== A) week 2026-08-23 (exit = Sun 2026-08-30 open) - RAW CANDLES, DB vs USER FILE ===');
  const syms = ['CAED', 'AMES', 'MOED', 'FIRE', 'SPIN'];
  const { rows } = await p.query(
    "SELECT symbol, date::text AS d, open, high, low, close, volume FROM daily_candles WHERE symbol = ANY($1) AND date BETWEEN '2026-08-22' AND '2026-09-01' ORDER BY symbol, date",
    [syms]
  );
  const db = {};
  for (const r of rows) { (db[r.symbol] = db[r.symbol] || {})[r.d] = { o: Number(r.open), h: Number(r.high), l: Number(r.low), c: Number(r.close), v: Number(r.volume) }; }
  for (const s of syms) {
    console.log(`--- ${s} ---`);
    for (let d = new Date('2026-08-23T00:00:00Z'); d <= new Date('2026-08-31T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
      const ds = d.toISOString().slice(0, 10);
      const b = (db[s] || {})[ds];
      const u = (userPx.get(s) || {}).get(ds);
      const fmt = x => x ? `o=${x.o.toFixed(2)} h=${x.h.toFixed(2)} l=${x.l.toFixed(2)} c=${x.c.toFixed(2)} v=${Math.round(x.v)}` : 'MISSING';
      const same = b && u && Math.abs(b.o - u.o) < 1e-9 && Math.abs(b.c - u.c) < 1e-9;
      console.log(`  ${ds}  DB: ${fmt(b)}  | USER: ${fmt(u)} ${same ? '' : (b && u ? '  <<< MISMATCH' : '')}`);
    }
  }
  console.log('');
  console.log('=== search: where do HIS exit prices appear in our data? (FIRE~5.23, AMES~139.00, CAED~145.01) ===');
  const hisWanted = { FIRE: 5.23, AMES: 139.00, CAED: 145.01 };
  for (const s of Object.keys(hisWanted)) {
    const g = (db[s] || {});
    for (const d of Object.keys(g)) {
      const x = g[d];
      for (const [fld, val] of [['o', x.o], ['c', x.c]]) {
        if (Math.abs(val - hisWanted[s]) / hisWanted[s] < 0.006) console.log(`  ${s} DB ${d} ${fld}=${val.toFixed(2)} ~ his ${hisWanted[s]}`);
      }
    }
    const ug = userPx.get(s);
    if (ug) for (const [d, x] of ug) {
      for (const [fld, val] of [['o', x.o], ['c', x.c]]) {
        if (Math.abs(val - hisWanted[s]) / hisWanted[s] < 0.006) console.log(`  ${s} USER ${d} ${fld}=${val.toFixed(2)} ~ his ${hisWanted[s]}`);
      }
    }
  }
  console.log('');
  console.log('=== B) week 2026-05-24: sessions and candle counts 5/17..6/7 ===');
  const { rows: cnt } = await p.query(
    "SELECT date::text AS d, count(*) AS n FROM daily_candles WHERE date BETWEEN '2026-05-17' AND '2026-06-07' GROUP BY date ORDER BY date"
  );
  for (const r of cnt) console.log(`  ${r.d}: ${r.n} symbols have candles (DB)`);
  console.log('');
  console.log('=== B2) candidate scan for week 2026-05-24 with reject reasons (DB prices) ===');
  const { rows: all } = await p.query(
    "SELECT symbol, date::text AS d, open, close, volume FROM daily_candles WHERE date BETWEEN '2026-03-01' AND '2026-06-08' ORDER BY symbol, date"
  );
  const px = new Map();
  for (const r of all) {
    const sym = String(r.symbol).toUpperCase();
    if (!HALAL.has(sym)) continue;
    const o = Number(r.open), c = Number(r.close), v = Number(r.volume) || 0;
    if (!(o > 0) || !(c > 0)) continue;
    if (!px.has(sym)) px.set(sym, []);
    px.get(sym).push({ date: r.d, o, c, m: c * v });
  }
  const sessions = [...new Set(all.map(r => r.d))].sort();
  const idxOf = (g, d) => { for (let i = 0; i < g.length; i++) if (g[i].date >= d) return (g[i].date === d ? i : -1); return -1; };
  const reasons = {};
  const pass = [];
  for (const [sym, g] of px) {
    const i = idxOf(g, '2026-05-24');
    if (i < 0) { reasons['no candle 5/24'] = (reasons['no candle 5/24'] || 0) + 1; continue; }
    if (i < 21) { reasons['short history'] = (reasons['short history'] || 0) + 1; continue; }
    const si = i - 1;
    const close = g[si].c;
    if (close < 0.5) { reasons['price<0.5'] = (reasons['price<0.5'] || 0) + 1; continue; }
    let sv = 0; for (let j = si - 19; j <= si; j++) sv += g[j].m;
    if (sv / 20 < 200000) { reasons['liquidity<200k'] = (reasons['liquidity<200k'] || 0) + 1; continue; }
    const mom = close / g[si - 5].c - 1;
    if (mom < 0.08) { reasons['mom<8%'] = (reasons['mom<8%'] || 0) + 1; continue; }
    if (mom > 0.45) { reasons['mom>45%'] = (reasons['mom>45%'] || 0) + 1; continue; }
    const gap = g[i].o / close - 1;
    if (gap < -0.03 || gap > 0.02) { reasons['gap out'] = (reasons['gap out'] || 0) + 1; continue; }
    const xi = idxOf(g, '2026-05-31');
    if (xi < 0) { reasons['no exit candle 5/31'] = (reasons['no exit candle 5/31'] || 0) + 1; continue; }
    pass.push(`${sym} mom=${(100 * mom).toFixed(1)}% gap=${(100 * gap).toFixed(1)}% entry=${g[i].o.toFixed(2)} exit5/31=${g[xi].o.toFixed(2)}`);
  }
  console.log('  reject reasons: ' + JSON.stringify(reasons));
  console.log('  PASSING: ' + (pass.length ? pass.join(' ; ') : '(none)'));
  await p.end();
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
