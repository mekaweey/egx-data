// 10-YEAR SCORE-RULE TEST: Sunday pre-open analyzer score vs strategy week result
// Data: ydf halal universe (60-75 syms, 2017-2026). Same formulas as market-state.ts.
// NOTE: Yahoo noise ~0.6pp avg on weekly returns -> indicative, not definitive.
// ASCII ONLY.
const fs = require('fs');
const BT = 'C:/Users/Mekawey/.zcode/workspace/default/bt/';
function weekSunday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dow = d.getUTCDay();
  const back = (dow === 5 || dow === 6) ? dow - 7 : dow;
  return new Date(d.getTime() - back * 86400000).toISOString().slice(0, 10);
}
const HALAL = new Set(fs.readFileSync(BT + 'halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const COST = 0.0005;
function mapRange(x, lo, hi) { if (!Number.isFinite(x)) return 50; const v = ((x - lo) / (hi - lo)) * 100; return Math.max(0, Math.min(100, v)); }

const sym = new Map();
const files = fs.readdirSync(BT).filter(f => f.startsWith('ydf_') && f.endsWith('.csv'));
for (const f of files) {
  const sname = f.slice(4, -4).toUpperCase();
  if (!HALAL.has(sname)) continue;
  const arr = [];
  for (const l of fs.readFileSync(BT + f, 'utf8').split('\n').filter(l => l.trim()).slice(1)) {
    const p = l.split(',');
    const d = (p[0] || '').slice(0, 10);
    const o = parseFloat(p[1]), c = parseFloat(p[4]), v = parseFloat(p[5]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !isFinite(o) || !isFinite(c) || o <= 0 || c <= 0) continue;
    arr.push([d, o, c, isFinite(v) ? v : 0]);
  }
  arr.sort((a, b) => a[0].localeCompare(b[0]));
  if (arr.length) sym.set(sname, arr);
}
// per-symbol index maps for O(1) lookups
const idxMap = new Map();
for (const [s, arr] of sym) {
  const m = new Map();
  arr.forEach((x, i) => m.set(x[0], i));
  idxMap.set(s, m);
}
// weekly records
const weekly = new Map();
for (const [s, arr] of sym) {
  for (let i = 0; i < arr.length; i++) {
    const [d, o, c] = arr[i];
    const w = weekSunday(d);
    if (!weekly.has(w)) weekly.set(w, []);
    const rec = weekly.get(w);
    let r = rec.find(x => x.sym === s);
    if (!r) { r = { sym: s, firstOpen: null, lastClose: null, lastDate: d, lastMoney20: null }; rec.push(r); }
    if (r.firstOpen === null) r.firstOpen = o;
    r.lastClose = c; r.lastDate = d;
    if (i >= 19) { let m = 0; for (let k = i - 19; k <= i; k++) m += arr[k][3]; r.lastMoney20 = m / 20; }
  }
}
// global session list (dates where >=30 halal syms traded)
const dayCount = new Map();
for (const [s, arr] of sym) for (const [d] of arr) dayCount.set(d, (dayCount.get(d) || 0) + 1);
const sessions = [...dayCount.entries()].filter(([, n]) => n >= 30).map(([d]) => d).sort();
const weekSessions = new Map(); // week -> sessions in that week
for (const d of sessions) { const w = weekSunday(d); if (!weekSessions.has(w)) weekSessions.set(w, []); weekSessions.get(w).push(d); }
const weeks = [...weekly.keys()].sort();

function scoreForSunday(sunday) {
  const avail = sessions.filter(d => d < sunday);
  if (avail.length < 26) return null;
  const use = avail.slice(-31);
  const agg = [];
  for (let s = 1; s < use.length; s++) {
    const d = use[s], dp = use[s - 1];
    const rets = [];
    let above = 0, maN = 0;
    for (const [t, arr] of sym) {
      const m = idxMap.get(t);
      const iC = m.get(d), iP = m.get(dp);
      if (iC == null || iP == null) continue;
      rets.push(arr[iC][2] / arr[iP][2] - 1);
      const ii = iC;
      if (ii >= 19) { let sm = 0; for (let q = ii - 19; q <= ii; q++) sm += arr[q][2]; if (arr[iC][2] > sm / 20) above++; maN++; }
    }
    if (rets.length < 30) continue;
    agg.push({ d, ret: rets.reduce((a, b) => a + b, 0) / rets.length, breadth: maN ? above / maN : 0 });
  }
  if (agg.length < 20) return null;
  const last = agg[agg.length - 1];
  const rets20 = agg.slice(-20).map(a => a.ret);
  const trend20 = agg.slice(-20).reduce((acc, a) => acc * (1 + a.ret), 1) - 1;
  const trend5 = agg.slice(-5).reduce((acc, a) => acc * (1 + a.ret), 1) - 1;
  const mu = rets20.reduce((a, b) => a + b, 0) / rets20.length;
  const vol20 = Math.sqrt(rets20.reduce((acc, r) => acc + (r - mu) * (r - mu), 0) / (rets20.length - 1));
  const comps = {
    breadth: mapRange(last.breadth, 0.30, 0.70),
    trend20: mapRange(trend20, -0.08, 0.08),
    prevday: mapRange(last.ret, -0.02, 0.02),
    trend5: mapRange(trend5, -0.04, 0.04),
    volreg: mapRange(-vol20, -0.035, -0.008),
  };
  const W = { breadth: 25, trend20: 25, prevday: 15, trend5: 15, volreg: 10 };
  let score = 0, wsum = 0;
  for (const k of Object.keys(W)) { score += comps[k] * W[k]; wsum += W[k]; }
  return score / wsum;
}

// strategy weekly result per week (same config on ydf data)
const weekResult = new Map();
for (let wi = 1; wi < weeks.length - 1; wi++) {
  const wk = weeks[wi];
  if (wk < '2017-01-01') continue;
  const prevW = weekly.get(weeks[wi - 1]);
  const nextW = weekly.get(weeks[wi + 1]);
  const cands = [];
  for (const pr of prevW) {
    if (pr.lastClose === null || !pr.lastMoney20 || pr.lastMoney20 < 200000) continue;
    if (pr.lastClose < 0.5) continue;
    const g = sym.get(pr.sym); if (!g) continue;
    const m = idxMap.get(pr.sym);
    const idx = m.get(pr.lastDate);
    if (idx == null || idx < 5) continue;
    const cl = g[idx][2], c5 = g[idx - 5][2];
    if (!c5 || c5 <= 0) continue;
    const mom5 = cl / c5 - 1;
    if (mom5 < 0.08 || mom5 > 0.45) continue;
    const cur = (weekly.get(wk) || []).find(x => x.sym === pr.sym);
    if (!cur || cur.firstOpen === null) continue;
    const gap = cur.firstOpen / cl - 1;
    if (gap < -0.03 || gap > 0.02) continue;
    const nr = nextW.find(x => x.sym === pr.sym);
    if (!nr || nr.firstOpen === null) continue;
    cands.push({ sym: pr.sym, mom5, ret: nr.firstOpen / cur.firstOpen - 1 - COST });
  }
  cands.sort((a, b) => b.mom5 - a.mom5);
  const picks = cands.slice(0, 5);
  if (picks.length < 3) continue;
  weekResult.set(wk, picks.reduce((a, c) => a + c.ret, 0) / picks.length);
}

// join score (Sunday pre-open) with that week's strategy result
const out = [];
for (const wk of weekResult.keys()) {
  const sc = scoreForSunday(wk);
  if (sc === null) continue;
  out.push({ week: wk, score: sc, ret: weekResult.get(wk) * 100 });
}
out.sort((a, b) => a.week.localeCompare(b.week));
console.log('weeks with score+result:', out.length, '| span', out[0].week, '->', out[out.length - 1].week);
// correlation
const n = out.length;
const mx = out.reduce((a, r) => a + r.score, 0) / n, my = out.reduce((a, r) => a + r.ret, 0) / n;
const cov = out.reduce((a, r) => a + (r.score - mx) * (r.ret - my), 0);
const sx = Math.sqrt(out.reduce((a, r) => a + (r.score - mx) ** 2, 0));
const sy = Math.sqrt(out.reduce((a, r) => a + (r.ret - my) ** 2, 0));
console.log('correlation (score vs week return): ' + (cov / (sx * sy)).toFixed(3));
// threshold tests
for (const th of [25, 30, 35, 45]) {
  const below = out.filter(r => r.score < th);
  const l = below.filter(r => r.ret < 0), w = below.filter(r => r.ret >= 0);
  const avoided = -below.reduce((a, r) => a + r.ret, 0);
  console.log(`score < ${th}: ${below.length} weeks skipped → avoided losses: ${l.length} (sum ${(l.reduce((a, r) => a + r.ret, 0)).toFixed(1)}%) | forgone wins: ${w.length} (sum +${(w.reduce((a, r) => a + r.ret, 0)).toFixed(1)}%) | NET AVOIDED: ${avoided.toFixed(1)}%`);
  if (below.length <= 15) console.log('   skipped weeks: ' + below.map(r => r.week + ' score ' + r.score.toFixed(0) + ' result ' + r.ret.toFixed(1) + '%').join(' | '));
}
// per-period breakdown (5-year halves)
for (const [a, b] of [['2017', '2021'], ['2021', '2027']]) {
  const seg = out.filter(r => r.week >= a && r.week < b);
  if (!seg.length) continue;
  const l = seg.filter(r => r.ret < 0), w = seg.filter(r => r.ret >= 0);
  const s25 = seg.filter(r => r.score < 25);
  console.log(`period ${a}-${b}: ${seg.length} weeks | wr ${(100 * w.length / seg.length).toFixed(0)}% | net ${seg.reduce((x, r) => x + r.ret, 0).toFixed(0)}% | score<25 fired ${s25.length} (avoided ${(-s25.reduce((x, r) => x + r.ret, 0)).toFixed(1)}%, forgone +${(s25.filter(r => r.ret >= 0).reduce((x, r) => x + r.ret, 0)).toFixed(1)}%)`);
}

// cohorts: high-score Sundays vs week results (10 years, yahoo data)
console.log('');
console.log('=== COHORTS (10 years, yahoo data) ===');
function cohort10y(label, pred) {
  const c = out.filter(pred);
  if (!c.length) { console.log(label + ': none'); return; }
  const wins = c.filter(r => r.ret >= 0);
  const avg = c.reduce((a, r) => a + r.ret, 0) / c.length;
  const tot = c.reduce((a, r) => a + r.ret, 0);
  console.log(label + ': ' + c.length + ' weeks | win rate ' + (100 * wins.length / c.length).toFixed(0) + '% (' + wins.length + '/' + c.length + ') | average +' + avg.toFixed(2) + '% | total +' + tot.toFixed(0) + '%');
}
cohort10y('score > 70', r => r.score > 70);
cohort10y('score 60-70', r => r.score > 60 && r.score <= 70);
cohort10y('score > 60 (combined)', r => r.score > 60);
cohort10y('score 40-60', r => r.score >= 40 && r.score <= 60);
cohort10y('score < 40', r => r.score < 40);
for (const [a, b] of [['2017', '2020'], ['2020', '2023'], ['2023', '2027']]) {
  const seg = out.filter(r => r.week >= a && r.week < b);
  if (!seg.length) continue;
  const hi = seg.filter(r => r.score > 60);
  if (!hi.length) { console.log(a + '-' + b + ': no score>60 weeks (' + seg.length + ' weeks total)'); continue; }
  const hw = hi.filter(r => r.ret >= 0);
  const lo = seg.filter(r => r.score <= 60);
  const lw = lo.filter(r => r.ret >= 0);
  console.log(a + '-' + b + ': score>60 -> ' + hi.length + 'w, wr ' + (100 * hw.length / hi.length).toFixed(0) + '%, avg +' + (hi.reduce((x, r) => x + r.ret, 0) / hi.length).toFixed(2) + '% | score<=60 -> ' + lo.length + 'w, wr ' + (100 * lw.length / Math.max(1, lo.length)).toFixed(0) + '%, avg ' + (lo.length ? (lo.reduce((x, r) => x + r.ret, 0) / lo.length).toFixed(2) : '0') + '%');
}
