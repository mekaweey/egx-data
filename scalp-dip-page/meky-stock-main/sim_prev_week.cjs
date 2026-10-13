// LAST WEEK SIMULATION from the DB (entry Sun 2026-09-13, exit Sun 2026-09-20)
// Signal = last completed session before entry = Thu 2026-09-10.
// Exact deployed rules: halal-only, N5 (top-5 by mom5), band [8%,45%],
// liquidity v20>=200k, price>=0.5, entry-open gap [-3%,+2%]. No cheating:
// signal windows end 10/9 (before entry), entry/exit = real exchange opens.
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const SLOT = 20000;
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });

(async () => {
  const { rows } = await p.query(
    "SELECT symbol, date::text AS date, open, close, volume FROM daily_candles WHERE date BETWEEN '2026-07-20' AND '2026-09-20' ORDER BY symbol, date"
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

  const SIG = '2026-09-10', ENTRY = '2026-09-13', EXIT = '2026-09-20';
  const cands = [];
  const rej = [];
  for (const [sym, g] of px) {
    const si = g.findIndex(r => r.date === SIG);
    if (si < 0) continue;
    const ei = g.findIndex(r => r.date === ENTRY);
    if (ei < 0) { rej.push({ sym, why: 'no Sunday session' }); continue; }
    if (si < 20) { rej.push({ sym, why: 'short history' }); continue; }
    const close = g[si].c;
    if (close < 0.5) { rej.push({ sym, why: 'price < 0.5' }); continue; }
    let sv = 0.0;
    for (let j = si - 19; j <= si; j++) sv += g[j].m;
    const v20 = sv / 20.0;
    if (v20 < 200000) { rej.push({ sym, why: `liquidity ${Math.round(v20 / 1000)}k` }); continue; }
    const mom = close / g[si - 5].c - 1.0;
    if (mom < 0.08) { rej.push({ sym, mom, why: `mom ${(100 * mom).toFixed(1)}% < 8%` }); continue; }
    if (mom > 0.45) { rej.push({ sym, mom, why: `mom ${(100 * mom).toFixed(1)}% > 45%` }); continue; }
    const gap = g[ei].o / close - 1.0;
    if (gap < -0.03 || gap > 0.02) { rej.push({ sym, mom, why: `gap ${(100 * gap).toFixed(1)}%` }); continue; }
    const xi = g.findIndex(r => r.date === EXIT);
    if (xi < 0) { rej.push({ sym, why: 'no exit session' }); continue; }
    cands.push({ sym, mom, gap, entry: g[ei].o, exit: g[xi].o,
      path: g.slice(ei, xi + 1).map(r => ({ d: r.date, c: r.c })) });
  }
  cands.sort((a, b) => b.mom - a.mom);

  console.log('=== LAST WEEK SIMULATION (deployed config, DB prices) ===');
  console.log('signal Thu 2026-09-10 | entry Sun 2026-09-13 open | exit Sun 2026-09-20 open | slot ' + SLOT);
  console.log(`candidates passing filters: ${cands.length}`);
  const picks = cands.slice(0, 5);
  let totCost = 0, totNow = 0;
  for (let i = 0; i < picks.length; i++) {
    const c = picks[i];
    const shares = Math.floor(SLOT / c.entry);
    const netRet = c.exit / c.entry - 1 - 0.0005;
    const egp = netRet * SLOT;
    totCost += SLOT; totNow += SLOT * (1 + netRet);
    const path = c.path.map(r => { const pc = 100 * (r.c / c.entry - 1); return `${r.d.slice(5)} ${pc >= 0 ? '+' : ''}${pc.toFixed(1)}%`; }).join(' -> ');
    console.log(`${i + 1}) ${c.sym} | mom ${100 * c.mom >= 0 ? '+' : ''}${(100 * c.mom).toFixed(1)}% | gap ${100 * c.gap >= 0 ? '+' : ''}${(100 * c.gap).toFixed(2)}% | entry ${c.entry.toFixed(2)} | path: ${path} | WEEK ${netRet >= 0 ? '+' : ''}${(100 * netRet).toFixed(2)}% = ${egp >= 0 ? '+' : ''}${Math.round(egp)} EGP`);
  }
  if (picks.length) {
    const portRet = picks.reduce((a, c) => a + (c.exit / c.entry - 1 - 0.0005), 0) / picks.length;
    console.log('');
    console.log(`WEEK PORTFOLIO (5 x ${SLOT}): ${portRet >= 0 ? '+' : ''}${(100 * portRet).toFixed(2)}% = ${portRet >= 0 ? '+' : ''}${Math.round(100000 * portRet)} EGP on 100k`);
  } else {
    console.log('no picks');
  }
  console.log('');
  console.log('=== rejected (top by mom) ===');
  rej.sort((a, b) => (b.mom || -9) - (a.mom || -9));
  for (const r of rej.slice(0, 8)) console.log(`${r.sym}: ${r.why}`);
  await p.end();
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
