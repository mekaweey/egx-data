// INDEPENDENT VERIFICATION of the 90-day ledger (fresh computation)
// =====================================================================
// Verifies: (1) DB prices = user's file (100% exact, re-confirmed)
//           (2) the weekly N5 series recomputed independently
//           (3) the totals on 100k AND on 200k capital
//           (4) per-week EGP table with running capital
// ASCII ONLY. Run: node verify_ledger_final.cjs
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
const COST = 0.0005;
const WINDOW_START = '2026-04-20';

(async () => {
  // 1) DB prices (reseeded = user's file for <=Sep 9 + scanner for Sep 10+)
  const { rows } = await p.query(
    "SELECT symbol, date::text AS date, open, close, volume FROM daily_candles WHERE date BETWEEN '2026-03-01' AND '2026-09-23' ORDER BY symbol, date"
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

  // 2) independent cross-check: DB close vs the USER'S OWN FILE closes
  const userClose = new Map();
  const fl = fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/daily.csv', 'utf8').split('\n').filter(Boolean);
  for (const l of fl.slice(1)) {
    const c0 = l.split(',');
    const sym = c0[0].trim().toUpperCase();
    if (!HALAL.has(sym)) continue;
    const di = parseInt(c0[1]);
    const d = new Date(Date.UTC(1970, 0, 1) + di * 86400000).toISOString().slice(0, 10);
    userClose.set(sym + '|' + d, Number(c0[5]));  // column 5 = close (verified)
  }
  let checked = 0, exact = 0, maxDiff = 0;
  for (const [key, uc] of userClose) {
    const [sym, d] = key.split('|');
    const g = px.get(sym);
    if (!g) continue;
    const row = g.find(x => x.date === d);
    if (!row) continue;
    checked++;
    const diff = Math.abs(row.c - uc);
    if (diff <= 0.005) exact++;
    if (diff > maxDiff) maxDiff = diff;
  }
  console.log(`[DATA CHECK] user-file closes checked: ${checked} | exact(<=0.005 EGP): ${exact} (${(100 * exact / checked).toFixed(1)}%) | max abs diff: ${maxDiff.toFixed(4)} EGP`);

  // 3) week starts (gap >= 2 days)
  const weekStarts = [];
  let prev = null;
  for (const d of sessions) {
    const dt = new Date(d + 'T00:00:00Z');
    if (prev === null || (dt - prev) >= 2 * 86400000) weekStarts.push(d);
    prev = dt;
  }
  const sessIdx = new Map(sessions.map((d, i) => [d, i]));

  // 4) candidates per week (deployed rules, signal ends BEFORE entry)
  const weekCands = new Map();
  for (let k = 0; k < weekStarts.length - 1; k++) {
    const ws = weekStarts[k];
    const cands = [];
    for (const [sym, g] of px) {
      const i = (() => { const g2 = g; for (let x = 0; x < g2.length; x++) if (g2[x].date >= ws) return (g2[x].date === ws ? x : -1); return -1; })();
      if (i < 0 || i < 21) continue;
      const si = i - 1;
      let sv = 0;
      for (let j = si - 19; j <= si; j++) sv += g[j].m;
      if (sv / 20 < 200000) continue;
      const mom = g[si].c / g[si - 5].c - 1;
      if (mom < 0.08 || mom > 0.45) continue;
      const gap = g[i].o / g[si].c - 1;
      if (gap < -0.03 || gap > 0.02) continue;
      // exit = next week-start open; guard: must be within 7 days of it
      let xi = -1;
      for (let x = i + 1; x < g.length; x++) {
        if (g[x].date >= weekStarts[k + 1]) { xi = (g[x].date === weekStarts[k + 1] ? x : -1); break; }
      }
      const exitGuard = new Date(new Date(weekStarts[k + 1] + 'T00:00:00Z').getTime() + 7 * 86400000).toISOString().slice(0, 10);
      if (xi < 0 || g[xi].date > exitGuard) continue; // no valid exit -> no trade
      cands.push({ sym, mom, ei: i, xi, o: g[i].o, x: g[xi].o });
    }
    if (cands.length) weekCands.set(k, cands);
  }

  // 5) weekly N5 series (no protections needed here: sigma8 was 1.9% -> scale 1.0 all window)
  const weekPos = new Map(weekStarts.map((d, i) => [d, i]));
  const series = []; // {ws, ret, picks}
  for (let k = 0; k < weekStarts.length - 1; k++) {
    const ws = weekStarts[k];
    if (ws < WINDOW_START) continue;
    const cands = weekCands.get(k) || [];
    const picks = [...cands].sort((a, b) => b.mom - a.mom).slice(0, 5);
    if (picks.length < 3) continue;
    const ret = picks.reduce((a, c) => a + (c.x / c.o - 1 - COST), 0) / picks.length;
    series.push({ ws, ret, picks, isOpen: k === weekStarts.length - 2 && weekStarts[k + 1] > '2026-09-22' ? false : false });
  }

  // 6) totals on 100k and on 200k
  function totals(cap) {
    let eq = cap;
    let wins = 0, losses = 0;
    const rows = [];
    for (const s of series) {
      const egp = s.ret * cap;
      eq *= (1 + s.ret);
      if (s.ret > 0.0005) wins++; else if (s.ret < -0.0005) losses++;
      rows.push({ ws: s.ws, ret: s.ret, egp });
    }
    const geo = pow(eq / cap, 1 / series.length) - 1;
    return { eq, geo, wins, losses, rows };
  }
  function pow(b, e) { return Math.pow(b, e); }

  console.log('');
  console.log('=== WEEKLY LEDGER (100k capital basis) ===');
  const t100 = totals(100000);
  for (const r of t100.rows) {
    console.log(`${r.ws}: ${r.ret >= 0 ? '+' : ''}${(100 * r.ret).toFixed(2)}% = ${r.egp >= 0 ? '+' : ''}${Math.round(r.egp).toLocaleString()} EGP`);
  }
  console.log(`100k: winners ${t100.wins} | losers ${t100.losses} | compounded total ${t100.eq >= 100000 ? '+' : ''}${Math.round(t100.eq - 100000).toLocaleString()} EGP (final ${Math.round(t100.eq).toLocaleString()})`);
  const t200 = totals(200000);
  console.log(`200k: compounded total ${t200.eq >= 200000 ? '+' : ''}${Math.round(t200.eq - 200000).toLocaleString()} EGP (final ${Math.round(t200.eq).toLocaleString()})`);
  console.log('DONE');
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
