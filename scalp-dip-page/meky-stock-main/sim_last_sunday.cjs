// REAL SIMULATION: Sunday 2026-09-20, 10:00 Cairo - the exact N5 signals the
// CURRENT deployed config would have produced, and their P&L through
// Tuesday 2026-09-22 close (today's synced candle).
// NO CHEATING rules:
//  - prices from YOUR database daily_candles (TradingView scanner prints,
//    not Yahoo), halal universe from halal-symbols.txt
//  - exact deployed rules: halal-only, N5, mom5 ending Thu 17/9 in [8%,45%],
//    liquidity v20 >= 200k, price >= 0.5, Sunday-open gap in [-3%,+2%],
//    W4 filters OFF (current), protections computed causally
//  - every rejected candidate shows WHY
//  - cross-check vs what the live paper gate actually bought (DB rows)
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });

const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const SLOT = 20000; // N5 slot

(async () => {
  // 1) load halal symbols' candles Aug 15 .. Sep 22 from the DB
  const { rows } = await p.query(
    "SELECT symbol, date::text AS date, open, high, low, close, volume FROM daily_candles WHERE date BETWEEN '2026-07-01' AND '2026-09-30' ORDER BY symbol, date"
  );
  const px = new Map(); // sym -> [{date,o,c,m}]
  for (const r of rows) {
    const sym = String(r.symbol).toUpperCase();
    if (!HALAL.has(sym)) continue;
    const o = Number(r.open), c = Number(r.close), v = Number(r.volume) || 0;
    if (!(o > 0) || !(c > 0)) continue;
    if (!px.has(sym)) px.set(sym, []);
    px.get(sym).push({ date: String(r.date).slice(0, 10), o, c, m: c * v });
  }

  // 2) candidate scan with signal session = 2026-09-17, entry = 2026-09-20 open
  const SIG = '2026-09-16', ENTRY = '2026-09-20'; // Thu 17 had NO session (holiday) - last completed = Wed 16
  const cands = [];
  let skipped = { noSunday: 0, thin: 0, short: 0, momLow: 0, momHigh: 0, gapOut: 0, price: 0 };
  for (const [sym, g] of px) {
    const si = g.findIndex(r => r.date === SIG);
    if (si < 0) continue;
    const ei = g.findIndex(r => r.date === ENTRY);
    if (ei < 0) { skipped.noSunday++; continue; }   // did not trade Sunday
    if (si < 20) { skipped.short++; continue; }     // not enough history
    const close = g[si].c;
    if (close < 0.5) { skipped.price++; continue; }
    let sv = 0.0;
    for (let j = si - 19; j <= si; j++) sv += g[j].m;
    const v20 = sv / 20.0;
    if (v20 < 200000) { skipped.thin++; continue; }
    const mom = close / g[si - 5].c - 1.0;
    if (mom < 0.08) { skipped.momLow++; continue; }
    if (mom > 0.45) { skipped.momHigh++; continue; }
    const gap = g[ei].o / close - 1.0;
    if (gap < -0.03 || gap > 0.02) { skipped.gapOut++; continue; }
    cands.push({ sym, mom, gap, v20, entry: g[ei].o, latest: g[g.length - 1].c, latestDate: g[g.length - 1].date, mon: (g[ei + 1] || {}).c ?? null });
  }
  cands.sort((a, b) => b.mom - a.mom);

  // 3) protections: halal-universe weekly bench, sigma8 + crash-cut (causal)
  const allDates = [...new Set(rows.map(r => String(r.date).slice(0, 10)))].filter(d => {
    const dow = new Date(d + 'T00:00:00Z').getUTCDay();
    return dow >= 0 && dow <= 4;
  }).sort();
  const weekStarts = [];
  for (let i = 0; i < allDates.length; i++) {
    const dow = new Date(allDates[i] + 'T00:00:00Z').getUTCDay();
    const prev = i > 0 ? new Date(allDates[i - 1] + 'T00:00:00Z').getUTCDay() : 6;
    if (dow < prev) weekStarts.push(allDates[i]);
  }
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
  let protectionScale = 1.0, sd8 = null, crash = false;
  const last8 = bench.slice(-8);
  if (last8.length >= 8) {
    const mu = last8.reduce((a, r) => a + r, 0) / 8;
    sd8 = Math.sqrt(last8.reduce((a, r) => a + (r - mu) * (r - mu), 0) / 7);
    if (sd8 > 0.06) protectionScale = 0.06 / sd8;
  }
  if (bench.length >= 2 && bench[bench.length - 1] + bench[bench.length - 2] <= -0.08) { crash = true; protectionScale *= 0.5; }
  const slot = Math.round(SLOT * protectionScale);

  // 4) N5 picks and P&L through Tuesday close
  const picks = cands.slice(0, 5);
  console.log('=== SIMULATION: Sunday 2026-09-20, 10:00 Cairo (current deployed config: N5 halal, W4 off, protections on) ===');
  console.log(`signal session: Wed 2026-09-16 (Thu 17 = market closed) | entry: Sun 2026-09-20 open | mark: Tue 2026-09-22 close`);
  console.log(`protections: sigma8=${sd8 ? (100 * sd8).toFixed(2) + '%' : 'n/a'} -> scale x${protectionScale.toFixed(2)}${crash ? ' (crash-cut applied)' : ''} | slot = ${slot} EGP`);
  console.log(`candidates passing all filters: ${cands.length} | rejected: ` + JSON.stringify(skipped));
  console.log('');
  console.log('--- THE 5 PICKS (exactly what would appear) ---');
  let totalCost = 0, totalNow = 0;
  for (let i = 0; i < picks.length; i++) {
    const c = picks[i];
    const shares = Math.floor(slot / c.entry);
    const cost = shares * c.entry;
    const nowTue = shares * c.latest;
    const pnlTue = nowTue - cost;
    const retTue = c.latest / c.entry - 1;
    const retMon = (c.mon != null && c.entry > 0) ? (c.mon / c.entry - 1) : 0;
    totalCost += cost; totalNow += nowTue;
    console.log(`${i + 1}) ${c.sym} | mom5 ${100 * c.mom >= 0 ? '+' : ''}${(100 * c.mom).toFixed(1)}% | gap ${100 * c.gap >= 0 ? '+' : ''}${(100 * c.gap).toFixed(2)}% | entry ${c.entry.toFixed(2)} -> ${c.latestDate.slice(5)} ${c.latest.toFixed(2)} | ${100 * retTue >= 0 ? '+' : ''}${(100 * retTue).toFixed(2)}% = ${pnlTue >= 0 ? '+' : ''}${Math.round(pnlTue)} EGP (slot ${slot})`);
  }
  const totalRet = totalNow / totalCost - 1;
  console.log('');
  console.log(`PORTFOLIO: deployed ${Math.round(totalCost)} EGP -> now ${Math.round(totalNow)} EGP | ${totalRet >= 0 ? '+' : ''}${(100 * totalRet).toFixed(2)}% = ${totalNow - totalCost >= 0 ? '+' : ''}${Math.round(totalNow - totalCost)} EGP (mark-to-market Tuesday close; exit due Sunday 2026-09-27 open)`);

  // 5) cross-check: what the live paper gate actually bought (DB)
  const { rows: live } = await p.query(
    "SELECT symbol, scan_date, entry_price, bought, sold FROM scalp_dip_signals WHERE scan_date IN ('2026-09-16','2026-09-17') ORDER BY gap_pct LIMIT 20"
  );
  console.log('');
  console.log('=== CROSS-CHECK: what the live paper gate recorded for this week (scan_date 2026-09-17) ===');
  for (const r of live) {
    console.log(`${r.symbol} | bought=${r.bought} sold=${r.sold} | entry ${Number(r.entry_price).toFixed(2)}`);
  }

  // 6) rejected candidates transparency (top-8 by mom that failed)
  console.log('');
  console.log('=== REJECTED (top by mom that failed a filter) ===');
  const rej = [];
  for (const [sym, g] of px) {
    const si = g.findIndex(r => r.date === SIG);
    if (si < 0 || si < 20) continue;
    const ei = g.findIndex(r => r.date === ENTRY);
    if (ei < 0) { rej.push({ sym, mom: g[si].c / g[si - 5].c - 1, why: 'no Sunday trade' }); continue; }
    const close = g[si].c;
    const mom = close / g[si - 5].c - 1.0;
    const gap = g[ei].o / close - 1.0;
    let sv = 0.0; for (let j = si - 19; j <= si; j++) sv += g[j].m;
    const v20 = sv / 20.0;
    if (mom < 0.08) { rej.push({ sym, mom, why: `mom ${(100 * mom).toFixed(1)}% < 8%` }); continue; }
    if (mom > 0.45) { rej.push({ sym, mom, why: `mom ${(100 * mom).toFixed(1)}% > 45% (pump shield)` }); continue; }
    if (v20 < 200000) { rej.push({ sym, mom, why: `liquidity ${Math.round(v20 / 1000)}k < 200k` }); continue; }
    if (gap < -0.03 || gap > 0.02) { rej.push({ sym, mom, why: `gap ${(100 * gap).toFixed(1)}% outside [-3%,+2%]` }); continue; }
  }
  rej.sort((a, b) => b.mom - a.mom);
  for (const r of rej.slice(0, 8)) console.log(`${r.sym}: ${r.why}`);

  await p.end();
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
