// MARKET-STATE REPLAY: Sunday pre-open scores vs actual strategy week results
// Replicates market-state.ts formulas EXACTLY (breadth/trend20/prevday/trend5/
// volreg; opening=null pre-open -> weights renormalized /0.9).
// ASCII ONLY.
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const { Pool } = require('pg');

const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
function mapRange(x, lo, hi) { if (!Number.isFinite(x)) return 50; const v = ((x - lo) / (hi - lo)) * 100; return Math.max(0, Math.min(100, v)); }

// the strategy's weekly ledger (entry Sunday -> week return), from FINAL_LEDGER_v1 + live mark
const LEDGER = [
  ['2026-04-26', 4.76], ['2026-05-03', 6.93], ['2026-05-10', 1.21], ['2026-05-17', -4.02],
  ['2026-05-24', 0.96], ['2026-06-01', 1.96], ['2026-06-07', -0.41], ['2026-06-14', 4.21],
  ['2026-06-21', -3.89], ['2026-06-28', -3.79], ['2026-07-05', 10.75], ['2026-07-12', 14.02],
  ['2026-07-19', 5.87], ['2026-07-26', 0.45], ['2026-08-02', 3.27], ['2026-08-09', 7.02],
  ['2026-08-16', 4.59], ['2026-08-23', 0.76], ['2026-08-30', 1.29], ['2026-09-06', 0.49],
  ['2026-09-13', 4.66], ['2026-09-20', -4.72], ['2026-09-27', -14.39],
];

(async () => {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const { rows } = await pool.query(`SELECT symbol, date::text d, open::float o, close::float c FROM daily_candles WHERE date >= '2025-11-01' AND close > 0 ORDER BY symbol, date`);
  await pool.end();
  const perSym = new Map();
  const daySet = new Set();
  for (const r of rows) {
    const s = String(r.symbol).toUpperCase();
    if (!HALAL.has(s)) continue;
    if (!perSym.has(s)) perSym.set(s, []);
    perSym.get(s).push([r.d, r.o, r.c]);
    daySet.add(r.d);
  }
  for (const [s, arr] of perSym) arr.sort((a, b) => a[0].localeCompare(b[0]));
  const sessions = [...daySet].sort();

  function scoreForSunday(sunday) {
    // sessions available BEFORE the Sunday open
    const avail = sessions.filter(d => d < sunday);
    if (avail.length < 26) return null;
    const use = avail.slice(-31); // last 30 aggs need 31 sessions
    const agg = [];
    for (let s = 1; s < use.length; s++) {
      const d = use[s], dp = use[s - 1];
      const rets = [], gaps = [];
      let above = 0, maN = 0;
      for (const [t, arr] of perSym) {
        const iC = arr.find(x => x[0] === d), iP = arr.find(x => x[0] === dp);
        if (!iC || !iP) continue;
        rets.push(iC[2] / iP[2] - 1);
        gaps.push(iC[1] / iP[2] - 1);
        const ii = arr.findIndex(x => x[0] === d);
        if (ii >= 19) {
          let sm = 0;
          for (let q = ii - 19; q <= ii; q++) sm += arr[q][2];
          if (iC[2] > sm / 20) above++;
          maN++;
        }
      }
      if (rets.length < 30) continue;
      agg.push({
        d,
        ret: rets.reduce((a, b) => a + b, 0) / rets.length,
        breadth: maN ? above / maN : 0,
      });
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
    return { score: score / wsum, comps, breadth: last.breadth, trend20, prevday: last.ret };
  }

  console.log('=== Sunday pre-open replay vs actual week result ===');
  const out = [];
  for (const [sunday, retPct] of LEDGER) {
    const sc = scoreForSunday(sunday);
    if (!sc) { console.log(`  ${sunday}: score unavailable (insufficient history)`); continue; }
    out.push({ sunday, score: sc.score, ret: retPct });
    console.log(`  ${sunday}: score ${sc.score.toFixed(0)} (breadth ${(sc.breadth * 100).toFixed(0)}% t20 ${(sc.trend20 * 100).toFixed(1)}%) | week result ${retPct > 0 ? '+' : ''}${retPct}%`);
  }
  // threshold tests
  console.log('');
  console.log('=== threshold tests: skip Sundays with score < X ===');
  for (const th of [15, 25, 35, 45]) {
    const below = out.filter(r => r.score < th);
    const skippedLosses = below.filter(r => r.ret < 0).length;
    const skippedWins = below.filter(r => r.ret >= 0).length;
    const skippedSum = below.reduce((a, r) => a + r.ret, 0);
    console.log(`  score < ${th}: ${below.length} Sundays → skip ${skippedLosses} losing weeks (${below.filter(r => r.ret < 0).map(r => r.sunday.slice(5) + ' ' + r.ret + '%').join(', ') || 'none'}) but also skip ${skippedWins} winning weeks (forgone +${below.filter(r => r.ret >= 0).reduce((a, r) => a + r.ret, 0).toFixed(1)}%) | net avoided: ${skippedSum.toFixed(1)}%`);
  }
  // cohort analysis: high-score Sundays
  console.log('');
  console.log('=== COHORTS ===');
  function cohort(label, pred) {
    const c = out.filter(pred);
    if (!c.length) { console.log(label + ': none'); return; }
    const wins = c.filter(r => r.ret >= 0);
    const avg = c.reduce((a, r) => a + r.ret, 0) / c.length;
    const tot = c.reduce((a, r) => a + r.ret, 0);
    console.log(label + ': ' + c.length + ' weeks | win rate ' + (100 * wins.length / c.length).toFixed(0) + '% (' + wins.length + '/' + c.length + ') | average +' + avg.toFixed(2) + '% | total +' + tot.toFixed(1) + '%');
    console.log('   weeks: ' + c.map(r => r.sunday.slice(5) + ' score ' + r.score.toFixed(0) + ' -> ' + (r.ret > 0 ? '+' : '') + r.ret + '%').join(' | '));
  }
  cohort('score > 70', r => r.score > 70);
  cohort('score > 60', r => r.score > 60);
  cohort('score 40-60 (middle)', r => r.score >= 40 && r.score <= 60);
  cohort('score < 40 (weak)', r => r.score < 40);
  // correlation
  const n = out.length;
  const mx = out.reduce((a, r) => a + r.score, 0) / n, my = out.reduce((a, r) => a + r.ret, 0) / n;
  const cov = out.reduce((a, r) => a + (r.score - mx) * (r.ret - my), 0);
  const sx = Math.sqrt(out.reduce((a, r) => a + (r.score - mx) ** 2, 0));
  const sy = Math.sqrt(out.reduce((a, r) => a + (r.ret - my) ** 2, 0));
  console.log('');
  console.log(`correlation (score vs week return): n=${n} | corr = ${(cov / (sx * sy)).toFixed(3)}`);
})();
