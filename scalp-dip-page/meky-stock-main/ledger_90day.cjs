// THE DEFINITIVE 90-DAY LEDGER (no cheating):
// deployed config exactly as live: halal-only, N5 (top-5 by mom5 in band),
// liquidity v20>=200k, price>=0.5, Sunday-open gap [-3%,+2%], W4 OFF,
// causal protections (sigma8 scale + crash-cut), entry Sunday open,
// exit next Sunday open, cost 0.05% RT. Prices = YOUR database
// daily_candles (scanner prints). Current open week marked at Tue close.
// Window: entry weeks from 2026-04-20 (the standard honest window).
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
  // week starts: gap >= 2 days
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

  // bench weekly returns (causal, for protections)
  const bench = [];
  for (let k = 0; k < weekStarts.length - 1; k++) {
    let sum = 0, n = 0;
    for (const [, g] of px) {
      const a = g.find(r => r.date === weekStarts[k]);
      const b = g.find(r => r.date === weekStarts[k + 1]);
      if (a && b && a.o > 0 && b.o > 0) { sum += b.o / a.o - 1; n++; }
    }
    bench.push(n ? sum / n : 0);
  }
  const weekPos = new Map(weekStarts.map((d, i) => [d, i]));

  const results = [];
  let cum = 100000;
  const lastWS = weekStarts[weekStarts.length - 1]; // the current OPEN week
  for (let k = 0; k < weekStarts.length; k++) {
    const ws = weekStarts[k];
    const isOpenWeek = (ws === lastWS && ws >= WINDOW_START);
    if (ws < WINDOW_START) continue;
    // causal protections from bench BEFORE this week
    let scale = 1.0;
    const bi = weekPos.get(ws);
    const prior = bench.slice(Math.max(0, bi - 8), bi);
    if (prior.length >= 8) {
      const mu = prior.reduce((a, r) => a + r, 0) / 8;
      const sd = Math.sqrt(prior.reduce((a, r) => a + (r - mu) * (r - mu), 0) / 7);
      if (sd > 0.06) scale = 0.06 / sd;
    }
    if (bi >= 2 && bench[bi - 1] + bench[bi - 2] <= -0.08) scale *= 0.5;
    const slot = Math.round(20000 * scale);

    const cands = [];
    for (const [sym, g] of px) {
      const i = idxOf(sym, ws);
      if (i < 21) continue;
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
      let xi;
      if (isOpenWeek) {
        xi = g.length - 1;           // mark at the latest synced close
      } else {
        xi = idxOf(sym, weekStarts[k + 1]);
        if (xi < 0) continue;
      }
      const net = (isOpenWeek ? g[xi].c : g[xi].o) / g[i].o - 1 - COST; // open week marks at latest CLOSE
      cands.push({ sym, mom, net, entry: g[i].o, exit: g[xi].o, i, xi });
    }
    cands.sort((a, b) => b.mom - a.mom);
    const picks = cands.slice(0, 5);

    let ret = null; let detail = [];
    for (const c of picks) {
      let r;
      if (isOpenWeek) {
        // mark at Tuesday close (last synced candle)
        const g = px.get(c.sym);
        let last = g[g.length - 1];
        r = last.c / c.entry - 1 - COST;
        detail.push(`${c.sym} ${c.entry.toFixed(2)}->${last.c.toFixed(2)} ${r >= 0 ? '+' : ''}${(100 * r).toFixed(1)}%`);
      } else {
        r = c.net;
        detail.push(`${c.sym} ${100 * r >= 0 ? '+' : ''}${(100 * r).toFixed(1)}%`);
      }
    }
    if (picks.length >= 3) {
      ret = picks.reduce((a, c) => a + c.net, 0) / picks.length;
    }
    const egp = ret != null ? Math.round(cum * ret) : 0;
    if (ret != null) cum *= (1 + ret);
    results.push({ ws, picks: picks.length, ret, egp, isOpenWeek, detail, scale });
  }

  console.log('=== THE 90-DAY REAL LEDGER (deployed N5 config, your DB prices) ===');
  console.log('window: entry weeks >= 2026-04-20 | halal N5 | protections causal | cost 0.05%');
  console.log('');
  let wins = 0, losses = 0, flat = 0;
  for (const r of results) {
    const lbl = r.isOpenWeek ? '(OPEN - marked ' + TODAY + ' close)' : '';
    if (r.ret == null) { console.log(`${r.ws}: no trade`); continue; }
    if (r.ret > 0.0005) wins++; else if (r.ret < -0.0005) losses++; else flat++;
    console.log(`${r.ws}: ${r.ret >= 0 ? '+' : ''}${(100 * r.ret).toFixed(2)}% = ${r.egp >= 0 ? '+' : ''}${r.egp.toLocaleString()} EGP${lbl} [${r.detail.join(', ')}]`);
  }
  const closed = results.filter(r => r.ret != null && !r.isOpenWeek);
  const wWins = closed.filter(r => r.ret > 0.0005).length;
  const wLoss = closed.filter(r => r.ret < -0.0005).length;
  let eq = 100000; let sumEgp = 0;
  for (const r of closed) { sumEgp += r.egp; eq *= (1 + r.ret); }
  const geoClosed = eq / 100000 - 1;
  console.log('');
  console.log(`closed weeks: ${closed.length} | winners ${wWins} | losers ${wLoss} | win rate ${(100 * wWins / closed.length).toFixed(0)}%`);
  const geoWk = Math.pow(1 + geoClosed, 1 / closed.length) - 1;
  console.log(`geometric average PER WEEK: ${100 * geoWk >= 0 ? '+' : ''}${(100 * geoWk).toFixed(2)}% = ${geoWk >= 0 ? '+' : ''}${Math.round(100000 * geoWk).toLocaleString()} EGP/wk`);
  console.log(`sum of weekly EGP (arithmetic): ${sumEgp >= 0 ? '+' : ''}${Math.round(sumEgp).toLocaleString()} EGP`);
  console.log(`COMPOUNDED TOTAL on 100k over the window: ${eq >= 0 ? '+' : ''}${Math.round(eq - 100000).toLocaleString()} EGP (final ${Math.round(eq).toLocaleString()})`);
  await p.end();
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
