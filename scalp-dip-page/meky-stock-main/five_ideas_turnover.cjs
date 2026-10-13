// I4: TURNOVER PULSE -> EGX next week (pre-registered 2026-09-25)
// weekly market money (sum close*volume, daily_candles 2016-2026 seeded era,
// caveat: Yahoo-seeded volumes) vs median of prior 8 weeks:
//   expansion (turnover > 1.15x med8) / neutral / contraction (< 0.85x)
// -> next week's equal-weight bench return (close-to-close matched panel).
// ACCEPTANCE: >= 10-point P-shift + stable halves. ASCII ONLY.
// Run: node five_ideas_turnover.cjs
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });

(async () => {
  const { rows } = await p.query("SELECT symbol, date::text AS d, close, volume FROM daily_candles WHERE date >= '2016-09-01' ORDER BY symbol, date");
  const px = new Map();
  const sessionsSet = new Set();
  for (const r of rows) {
    const sym = String(r.symbol).toUpperCase();
    const o = Number(r.close), v = Number(r.volume) || 0;
    if (!(o > 0)) continue;
    if (!px.has(sym)) px.set(sym, new Map());
    px.get(sym).set(r.d, { c: o, m: o * v });
    sessionsSet.add(r.d);
  }
  const sessions = [...sessionsSet].sort();
  const weekStarts = [];
  let prev = null;
  for (const d of sessions) {
    const dt = new Date(d + 'T00:00:00Z');
    if (prev === null || (dt - prev) >= 2 * 86400000) weekStarts.push(d);
    prev = dt;
  }
  const weeks = [];
  for (let k = 0; k < weekStarts.length - 1; k++) {
    const a = weekStarts[k], b = weekStarts[k + 1];
    let turnover = 0, rets = 0, sum = 0;
    for (const [, g] of px) {
      // last close in week a and last close in week b (matched panel)
      let ca = null, cb = null, ma = 0, mb = 0;
      for (const [d, x] of g) {
        if (d >= a && d < b) { ca = x.c; ma += x.m; }
        else if (d >= b && d < weekStarts[k + 2] || (k + 2 >= weekStarts.length && d >= b)) { cb = x.c; mb += x.m; }
      }
      if (ca !== null) turnover += ma;
      if (ca !== null && cb !== null) { sum += cb / ca - 1; rets++; }
    }
    if (rets < 30) continue;
    weeks.push({ w: a, r: sum / rets, to: turnover, year: Number(a.slice(0, 4)) });
  }
  // predictor: turnover vs median of prior 8 weeks
  for (let i = 0; i < weeks.length; i++) {
    const prior = weeks.slice(Math.max(0, i - 8), i).map(x => x.to);
    weeks[i].pulse = prior.length >= 8 ? (weeks[i].to / (median(prior))) : null;
  }
  function median(xs) { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }
  function stats(xs) { return xs.length ? { n: xs.length, mean: xs.reduce((a, b) => a + b, 0) / xs.length, pos: xs.filter(x => x > 0).length / xs.length } : null; }
  function show(label, xs) { const s = stats(xs); console.log(`  ${label}: n=${s.n} | mean ${(100 * s.mean >= 0 ? '+' : '') + (100 * s.mean).toFixed(2)}% | P(next up) ${(100 * s.pos).toFixed(0)}%`); }
  const all = weeks.map(w => w.r);
  console.log(`=== I4 TURNOVER PULSE (${weeks.length} weeks, daily_candles era) ===`);
  show('UNCONDITIONAL', all);
  show('EXPANSION >1.15x med8', weeks.filter(w => w.pulse !== null && w.pulse > 1.15).map(w => w.r));
  show('NEUTRAL', weeks.filter(w => w.pulse !== null && w.pulse >= 0.85 && w.pulse <= 1.15).map(w => w.r));
  show('CONTRACTION <0.85x med8', weeks.filter(w => w.pulse !== null && w.pulse < 0.85).map(w => w.r));
  for (const [lo, hi] of [[2016, 2020], [2021, 2026]]) {
    const xs = weeks.filter(w => w.pulse !== null && w.pulse > 1.15 && lo <= w.year && w.year <= hi).map(w => w.r);
    const ys = weeks.filter(w => w.pulse !== null && w.pulse < 0.85 && lo <= w.year && w.year <= hi).map(w => w.r);
    if (xs.length && ys.length) {
      console.log(`    ${lo}-${hi}: expansion n=${xs.length} P=${(100 * stats(xs).pos).toFixed(0)}% | contraction n=${ys.length} P=${(100 * stats(ys).pos).toFixed(0)}%`);
    }
  }
  await p.end();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
