// FULL-HISTORY LEDGER — the EXACT deployed config over ALL of daily.csv
// =====================================================================
// Purpose: answer "is 77-80% weekly win rate real or sample-flattered?"
// Config (identical to FINAL_LEDGER_v1 / deployed system):
//   halal-only, mom5 8-45%, liquidity v20>=200k EGP, price>=0.5,
//   gap [-3%,+2%], N5 by mom5, entry Sunday open, exit next Sunday open,
//   cost 0.05% RT, skip week if <3 picks. Equal 1/5 per position.
// Data: user's daily.csv (221 symbols, varying depth 2013->2026-09-09).
// Survivorship caveat: file = today's listed symbols only (delisted excluded)
// -> historical win rates are mildly OPTIMISTIC. Disclosed everywhere.
// ASCII ONLY.
const fs = require('fs');

const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const COST = 0.0005;
const MIN_WEEK = '2020-01-01'; // need enough liquid symbols; earlier years too thin

const lines = fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/daily.csv', 'utf8').split('\n').filter(l => l.trim());
const sym = new Map();
for (const l of lines.slice(1)) {
  const p = l.split(',');
  const di = parseInt(p[1], 10); if (!isFinite(di)) continue;
  const d = new Date(di * 86400000).toISOString().slice(0, 10);
  const o = parseFloat(p[2]), h = parseFloat(p[3]), lo = parseFloat(p[4]), c = parseFloat(p[5]), v = parseFloat(p[6]), money = parseFloat(p[7]);
  if (!isFinite(o) || !isFinite(c) || o <= 0 || c <= 0) continue;
  if (!sym.has(p[0])) sym.set(p[0], []);
  sym.get(p[0]).push([d, o, h, lo, c, isFinite(v) ? v : 0, isFinite(money) ? money : c * v]);
}
for (const [s, arr] of sym) arr.sort((a, b) => a[0].localeCompare(b[0]));

function weekSunday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dow = d.getUTCDay();
  const back = (dow === 5 || dow === 6) ? dow - 7 : dow;
  return new Date(d.getTime() - back * 86400000).toISOString().slice(0, 10);
}

// per symbol: week -> {firstOpen, lastClose, lastMoney20, lastClosePrev}
const weekly = new Map(); // week -> array of candidate records
const sessionsByWeek = new Map(); // week -> set of dates (to find the entry session per symbol)
for (const [s, arr] of sym) {
  if (!HALAL.has(s)) continue;
  for (let i = 0; i < arr.length; i++) {
    const [d, o, h, lo, c] = arr[i];
    const w = weekSunday(d);
    if (!weekly.has(w)) weekly.set(w, []);
    const rec = weekly.get(w);
    let r = rec.find(x => x.sym === s);
    if (!r) { r = { sym: s, firstOpen: null, firstDate: d, lastClose: null, lastDate: d, closes: [] }; rec.push(r); }
    if (r.firstOpen === null) { r.firstOpen = o; r.firstDate = d; }
    r.lastClose = c; r.lastDate = d;
    r.closes.push(c);
    // v20 money at this date
    if (i >= 19) {
      let m = 0;
      for (let k = i - 19; k <= i; k++) m += arr[k][6];
      r.lastMoney20 = m / 20;
      r.lastIdx = i;
    }
  }
}
// rebuild per-symbol arrays for mom5 lookup
const closesBySym = new Map();
for (const [s, arr] of sym) closesBySym.set(s, arr.map(x => x[4]));
const datesBySym = new Map();
for (const [s, arr] of sym) datesBySym.set(s, arr.map(x => x[0]));

const weeks = [...weekly.keys()].sort();
const results = [];
for (let wi = 1; wi < weeks.length - 1; wi++) {
  const wk = weeks[wi];
  if (wk < MIN_WEEK) continue;
  const prevW = weekly.get(weeks[wi - 1]);
  const nextW = weekly.get(weeks[wi + 1]);
  const cands = [];
  for (const pr of prevW) {
    // signal: prev week's last close; momentum over 5 sessions ending there
    if (pr.lastClose === null || !pr.lastMoney20 || pr.lastMoney20 < 200000) continue;
    if (pr.lastClose < 0.5) continue;
    const g = closesBySym.get(pr.sym);
    const dd = datesBySym.get(pr.sym);
    // index of prev week's last session for this symbol
    let idx = -1;
    for (let k = dd.length - 1; k >= 0; k--) { if (dd[k] === pr.lastDate) { idx = k; break; } }
    if (idx < 5) continue;
    const cl = g[idx];
    const c5 = g[idx - 5];
    if (!c5 || c5 <= 0) continue;
    const mom5 = cl / c5 - 1;
    if (mom5 < 0.08 || mom5 > 0.45) continue;
    // this week's first open (entry)
    const cur = (weekly.get(wk) || []).find(x => x.sym === pr.sym);
    if (!cur || cur.firstOpen === null) continue;
    const gap = cur.firstOpen / cl - 1;
    if (gap < -0.03 || gap > 0.02) continue;
    // exit: next week's first open
    const nr = nextW.find(x => x.sym === pr.sym);
    if (!nr || nr.firstOpen === null) continue;
    const ret = nr.firstOpen / cur.firstOpen - 1 - COST;
    cands.push({ sym: pr.sym, mom5, ret });
  }
  cands.sort((a, b) => b.mom5 - a.mom5);
  const picks = cands.slice(0, 5);
  if (picks.length < 3) { results.push({ week: wk, ret: null, picks: picks.length }); continue; }
  const ret = picks.reduce((a, c) => a + c.ret, 0) / picks.length;
  results.push({ week: wk, ret, picks: picks.length, names: picks.map(p => p.sym).join('+') });
}

// summarize
const traded = results.filter(r => r.ret !== null);
const wins = traded.filter(r => r.ret > 0.0005), losses = traded.filter(r => r.ret < -0.0005);
console.log('weeks traded:', traded.length, '| wins:', wins.length, '| losses:', losses.length, '| win rate:', (100 * wins.length / traded.length).toFixed(1) + '%');
let eq = 1, peak = 1, mdd = 0, mddDur = 0, curDur = 0;
for (const r of traded) { eq *= (1 + r.ret); peak = Math.max(peak, eq); const dd = 1 - eq / peak; if (dd > mdd) mdd = dd; }
console.log('compounded:', ((eq - 1) * 100).toFixed(1) + '% | max drawdown:', (mdd * 100).toFixed(1) + '%');
// worst 10 weeks all-time
console.log('');
console.log('=== WORST 10 WEEKS ALL-TIME (this exact config) ===');
for (const r of [...traded].sort((a, b) => a.ret - b.ret).slice(0, 10)) console.log(`  ${r.week}: ${(r.ret * 100).toFixed(2)}% [${r.names}]`);
// per-year win rates
const byYear = new Map();
for (const r of traded) { const y = r.week.slice(0, 4); const a = byYear.get(y) || { w: 0, l: 0 }; if (r.ret > 0.0005) a.w++; else if (r.ret < -0.0005) a.l++; byYear.set(y, a); }
console.log('');
console.log('=== win rate per year ===');
for (const [y, a] of [...byYear.entries()].sort()) console.log(`  ${y}: ${a.w}W/${a.l}L = ${(100 * a.w / (a.w + a.l)).toFixed(0)}%`);
// losing streaks
let streak = 0, maxStreak = 0, streaks = [];
for (const r of traded) { if (r.ret < -0.0005) { streak++; maxStreak = Math.max(maxStreak, streak); } else { if (streak >= 2) streaks.push(streak); streak = 0; } }
if (streak >= 2) streaks.push(streak);
console.log('');
console.log('max losing streak:', maxStreak, '| streaks >=2:', JSON.stringify(streaks));
// how deep can a week get: percentiles of losing weeks
const lossWeeks = traded.filter(r => r.ret < 0).map(r => r.ret).sort((a, b) => a - b);
if (lossWeeks.length) {
  const q = p => lossWeeks[Math.min(lossWeeks.length - 1, Math.floor(p * lossWeeks.length))];
  console.log('losing weeks: median ' + (q(0.5) * 100).toFixed(2) + '% | p90 ' + (q(0.9) * 100).toFixed(2) + '% | worst ' + (q(1) * 100).toFixed(2) + '%');
}
// save full table
fs.writeFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/full_history_ledger_output.txt',
  results.map(r => `${r.week}: ${r.ret == null ? 'no-trade' : (r.ret * 100).toFixed(2) + '%'} [${r.names || ''}]`).join('\n'));
console.log('');
console.log('full table saved: bt/full_history_ledger_output.txt');
