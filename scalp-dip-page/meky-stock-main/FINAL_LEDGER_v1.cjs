// FINAL_LEDGER_v1 — the single authoritative ledger script (reviewer request)
// =====================================================================
// One run, zero manual steps. Outputs:
//   [0] run timestamp + sha256 of the engine files (code version proof)
//   [A] the FULL 21+ week ledger with per-pick entry/exit prices (BUG F applied)
//   [B] the live paper-gate decision_audit_log (20/9 -> now) - the strongest
//       possible evidence: real-time gate events, no historical data involved
//   [C] execution feasibility: entry-day traded money for every pick, 20k as
//       % of it, flags for thin cases
//   [D] corporate-action scan: any |daily move| > 20% inside holding weeks
//   [E] halal-universe staleness: last candle date per symbol
// ASCII ONLY. Run: node FINAL_LEDGER_v1.cjs
const fs = require('fs');
const crypto = require('crypto');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
const COST = 0.0005;
const WINDOW_START = '2026-04-20';
const NOW = new Date();

const sha = (f) => { try { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16); } catch (e) { return 'N/A'; } };

(async () => {
  console.log('=== FINAL_LEDGER_v1 ===');
  console.log('[0] run at: ' + NOW.toISOString() + ' (UTC) / ' + NOW.toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) + ' Cairo');
  console.log('[0] code sha256-16: momentum-weekly.server.ts=' + sha('src/lib/scalp-dip/momentum-weekly.server.ts') +
    ' | momentum-weekly-run.ts=' + sha('src/routes/api/public/hooks/momentum-weekly-run.ts') +
    ' | FINAL_LEDGER_v1.cjs=' + sha('FINAL_LEDGER_v1.cjs'));
  console.log('[0] data source: daily_candles (BUG F ghosts removed 2026-09-26; replanted from user minute file <=09-09; scanner >=09-20)');

  const { rows } = await p.query(
    "SELECT symbol, date::text AS date, open, close, volume FROM daily_candles WHERE date BETWEEN '2026-01-15' AND $1 ORDER BY symbol, date", [NOW.toISOString().slice(0, 10)]
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
  const idxOf = (sym, d) => { const g = px.get(sym); if (!g) return -1; for (let i = 0; i < g.length; i++) if (g[i].date >= d) return (g[i].date === d ? i : -1); return -1; };
  const lastWS = weekStarts[weekStarts.length - 1];

  console.log('');
  console.log('[A] === THE LEDGER (every week, BUG F applied, per-pick entry->exit prices, cost 0.05%) ===');
  let cum = 100000, wins = 0, losses = 0, closed = 0;
  const weekRets = [];
  for (let k = 0; k < weekStarts.length; k++) {
    const ws = weekStarts[k];
    if (ws < WINDOW_START) continue;
    const isOpenWeek = ws === lastWS;
    const cands = [];
    for (const [sym, g] of px) {
      const i = idxOf(sym, ws);
      if (i < 0 || i < 21) continue;
      const si = i - 1;
      const close = g[si].c;
      if (close < 0.5) continue;
      let sv = 0; for (let j = si - 19; j <= si; j++) sv += g[j].m;
      if (sv / 20.0 < 200000) continue;
      const mom = close / g[si - 5].c - 1.0;
      if (mom < 0.08 || mom > 0.45) continue;
      const gap = g[i].o / close - 1.0;
      if (gap < -0.03 || gap > 0.02) continue;
      let xi;
      if (isOpenWeek) { xi = g.length - 1; } else { xi = idxOf(sym, weekStarts[k + 1]); if (xi < 0) continue; }
      cands.push({ sym, mom, entry: g[i].o, exit: isOpenWeek ? g[xi].c : g[xi].o, i, xi, ei: i });
    }
    cands.sort((a, b) => b.mom - a.mom);
    const picks = cands.slice(0, 5);
    if (picks.length < 3) { console.log(`${ws}: no qualified batch (<3 candidates)`); continue; }
    const isOpen = isOpenWeek;
    let ret;
    const det = picks.map((c) => {
      const exitPx = isOpen ? px.get(c.sym)[c.xi].c : c.exit;
      const r = exitPx / c.entry - 1 - COST;
      if (!isOpen) { /* closed */ }
      const dayMoney = px.get(c.sym)[c.ei].m;
      c.dayMoney = dayMoney;
      return `${c.sym} ${c.entry.toFixed(2)}->${exitPx.toFixed(2)} ${r >= 0 ? '+' : ''}${(100 * r).toFixed(2)}% [dayLiq ${(dayMoney / 1e6).toFixed(1)}M]`;
    });
    ret = picks.reduce((a, c) => a + (isOpen ? px.get(c.sym)[c.xi].c / c.entry - 1 - COST : c.exit / c.entry - 1 - COST), 0) / picks.length;
    if (!isOpen) { closed++; if (ret > 0.0005) wins++; else if (ret < -0.0005) losses++; weekRets.push({ ws, ret }); }
    const egp = Math.round(cum * ret);
    console.log(`${ws}: ${ret >= 0 ? '+' : ''}${(100 * ret).toFixed(2)}% = ${egp >= 0 ? '+' : ''}${egp.toLocaleString('en-US')} EGP${isOpen ? ' (OPEN - marked latest close ' + NOW.toISOString().slice(0, 10) + ')' : ''} | ${det.join(' | ')}`);
    if (ret != null) cum *= (1 + ret);
  }
  console.log('');
  console.log(`[A] SUMMARY: closed weeks ${closed} | winners ${wins} | losers ${losses} | win rate ${(100 * wins / closed).toFixed(1)}%`);
  console.log(`[A] COMPOUNDED TOTAL on 100k: ${(cum - 100000 >= 0 ? '+' : '')}${Math.round(cum - 100000).toLocaleString('en-US')} EGP (final ${Math.round(cum).toLocaleString('en-US')})`);

  console.log('');
  console.log('[B] === LIVE PAPER-GATE AUDIT LOG (2026-09-20 -> now) - real-time events only ===');
  const { rows: audit } = await p.query("SELECT id, event_type, symbol, trigger_price, pnl_pct, created_at::text AS ts FROM decision_audit_log WHERE created_at >= '2026-09-20' ORDER BY id");
  for (const r of audit) {
    console.log(`#${r.id} ${r.ts.slice(5, 19)} UTC | ${r.event_type} | ${r.symbol || '-'} | ${r.trigger_price ? Number(r.trigger_price).toFixed(2) : '-'} | ${r.pnl_pct != null ? (100 * Number(r.pnl_pct)).toFixed(2) + '%' : '-'}`);
  }

  console.log('');
  console.log('[C] === EXECUTION FEASIBILITY: entry-day liquidity for EVERY pick in the window ===');
  const { rows: allPicks } = await p.query(
    "SELECT symbol, scan_date::text AS sd, entry_date::text AS ed, position_value, actual_buy_price FROM momentum_weekly_signals WHERE scan_date >= '2026-04-20' AND selected = true ORDER BY ed"
  );
  let thin = 0, checked = 0;
  const ratios = [];
  for (const pk of allPicks) {
    const g = px.get(String(pk.symbol).toUpperCase());
    if (!g) continue;
    const ei = g.findIndex(x => x.date === String(pk.ed).slice(0, 10));
    if (ei < 0) continue;
    const money = g[ei].m;
    const pos = Number(pk.position_value) || 0;
    if (!(money > 0)) continue;
    checked++;
    const ratio = pos / money;
    ratios.push(ratio);
    if (ratio > 0.05) { thin++; console.log(`  THIN: ${pk.symbol} entry ${pk.ed} | day money ${(money / 1e6).toFixed(2)}M | pos ${Math.round(pos)} = ${(100 * ratio).toFixed(1)}% of day`); }
  }
  ratios.sort((a, b) => a - b);
  const pct = (q) => ratios.length ? (100 * ratios[Math.min(ratios.length - 1, Math.floor(q * ratios.length))]) : 0;
  console.log(`  picks checked: ${checked} | pos/day-money ratio: p50 ${(100 * pct(0.5)).toFixed(2)}% | p90 ${(100 * pct(0.9)).toFixed(2)}% | max ${(100 * ratios[ratios.length - 1]).toFixed(2)}% | cases >5%: ${thin}`);

  console.log('');
  console.log('[D] === CORPORATE-ACTION SCAN: |daily move| > 20% inside any holding week ===');
  let caFlags = 0;
  for (const [sym, g] of px) {
    for (let i = 1; i < g.length; i++) {
      const mv = g[i].c / g[i].c - 1; // placeholder (close/close same day = 0)
    }
  }
  // real scan: consecutive-day moves for every pick's holding window
  for (const pk of allPicks) {
    const g = px.get(String(pk.symbol).toUpperCase());
    if (!g) continue;
    const ei = g.findIndex(x => x.date === String(pk.ed).slice(0, 10));
    if (ei < 0) continue;
    const xi = Math.min(g.length - 1, ei + 5);
    for (let i = ei; i <= xi && i < g.length; i++) {
      if (i === 0) continue;
      const mv = g[i].c / g[i - 1].c - 1;
      if (Math.abs(mv) > 0.20) { caFlags++; console.log(`  FLAG: ${pk.symbol} ${g[i].date} daily move ${(100 * mv).toFixed(1)}% (limit is ±20%) — possible corporate action / data spike`); break; }
    }
  }
  if (caFlags === 0) console.log('  none found in any holding week');

  console.log('');
  console.log('[E] === HALAL UNIVERSE STALENESS (last candle date per symbol) ===');
  const stale = [];
  for (const [sym, g] of px) {
    const last = g[g.length - 1].date;
    if (last < '2026-06-01') stale.push(`${sym} (last ${last})`);
  }
  console.log(`  halal symbols with candles in window: ${px.size} | stale (no candle since 2026-06-01): ${stale.length}${stale.length ? ' -> ' + stale.join(', ') : ''}`);

  await p.end();
  console.log('');
  console.log('=== FINAL_LEDGER_v1 COMPLETE ===');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
