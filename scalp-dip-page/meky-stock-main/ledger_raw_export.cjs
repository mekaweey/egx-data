// RAW LEDGER EXPORT with per-pick entry/exit PRICES (what the external
// reviewer asked for: entry date, the 5 picks, entry price, exit price,
// individual net return). Same engine as ledger_90day.cjs verbatim,
// closed weeks only. ASCII ONLY. Run: node ledger_raw_export.cjs
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
const COST = 0.0005;
const WINDOW_START = '2026-04-20';
const TODAY = new Date().toISOString().slice(0, 10); // dynamic - no stale marks

(async () => {
  const { rows } = await p.query(
    "SELECT symbol, date::text AS date, open, close, volume FROM daily_candles WHERE date BETWEEN '2026-01-15' AND $1 ORDER BY symbol, date", [TODAY]
  );
  const px = new Map();
  for (const r of rows) {
    const sym = String(r.symbol).toUpperCase();
    if (!HALAL.has(sym)) continue;
    const o = Number(r.open), c = Number(r.close), v = Number(r.volume) || 0;
    if (!(o > 0) || !(c > 0)) continue;
    if (!px.has(sym)) px.set(sym, []);
    px.get(sym).push({ date: r.date, o, c, m: c * v });
  }
  const sessions = [...new Set(rows.map(r => r.date))].sort();
  const weekStarts = [];
  let prev = null;
  for (const d of sessions) {
    const dt = new Date(d + 'T00:00:00Z');
    if (prev === null || (dt - prev) >= 2 * 86400000) weekStarts.push(d);
    prev = dt;
  }
  const idxOf = (sym, d) => {
    const g = px.get(sym);
    if (!g) return -1;
    for (let i = 0; i < g.length; i++) if (g[i].date >= d) return (g[i].date === d ? i : -1);
    return -1;
  };
  const lastWS = weekStarts[weekStarts.length - 1];
  for (let k = 0; k < weekStarts.length; k++) {
    const ws = weekStarts[k];
    if (ws < WINDOW_START) continue;
    if (ws === lastWS) continue; // closed weeks only
    const cands = [];
    for (const [sym, g] of px) {
      const i = idxOf(sym, ws);
      if (i < 0 || i < 21) continue;
      const si = i - 1;
      const close = g[si].c;
      if (close < 0.5) continue;
      let sv = 0.0;
      for (let j = si - 19; j <= si; j++) sv += g[j].m;
      if (sv / 20.0 < 200000) continue;
      const mom = close / g[si - 5].c - 1.0;
      if (mom < 0.08 || mom > 0.45) continue;
      const gap = g[i].o / close - 1.0;
      if (gap < -0.03 || gap > 0.02) continue;
      const xi = idxOf(sym, weekStarts[k + 1]);
      if (xi < 0) continue;
      cands.push({ sym, mom, entry: g[i].o, exit: g[xi].o, net: g[xi].o / g[i].o - 1 - COST });
    }
    cands.sort((a, b) => b.mom - a.mom);
    const picks = cands.slice(0, 5);
    if (picks.length < 3) { console.log(`${ws}: (fewer than 3 candidates)`); continue; }
    const ret = picks.reduce((a, c) => a + c.net, 0) / picks.length;
    const det = picks.map(c => `${c.sym} ${c.entry.toFixed(2)}->${c.exit.toFixed(2)} ${c.net >= 0 ? '+' : ''}${(100 * c.net).toFixed(2)}%`).join(' | ');
    console.log(`${ws}: week ${100 * ret >= 0 ? '+' : ''}${(100 * ret).toFixed(2)}% | ${det}`);
  }
  await p.end();
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
