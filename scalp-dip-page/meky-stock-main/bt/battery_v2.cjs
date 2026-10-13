// BATTERY v2: reduce the AVERAGE losing week while keeping total profit
// Variants (10y ydf data, same core config): vol-targeting sizing,
// money floor 500k/1M, price floor 2 EGP, N3, post-loss skip.
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
const sym = new Map();
for (const f of fs.readdirSync(BT).filter(f => f.startsWith('ydf_') && f.endsWith('.csv'))) {
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
const weekly = new Map();
for (const [s, arr] of sym) {
  for (let i = 0; i < arr.length; i++) {
    const [d, o, c] = arr[i];
    const w = weekSunday(d);
    if (!weekly.has(w)) weekly.set(w, []);
    const rec = weekly.get(w);
    let r = rec.find(x => x.sym === s);
    if (!r) { r = { sym: s, firstOpen: null, firstDate: null, lastClose: null, lastDate: d, lastMoney20: null }; rec.push(r); }
    if (r.firstOpen === null) { r.firstOpen = o; r.firstDate = d; }
    r.lastClose = c; r.lastDate = d;
    if (i >= 19) { let m = 0; for (let k = i - 19; k <= i; k++) m += arr[k][3]; r.lastMoney20 = m / 20; }
  }
}
const weeks = [...weekly.keys()].sort();
const rows = [];
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
    let idx = -1;
    for (let k = g.length - 1; k >= 0; k--) { if (g[k][0] === pr.lastDate) { idx = k; break; } }
    if (idx < 25) continue;
    const cl = g[idx][2], c5 = g[idx - 5][2];
    if (!c5 || c5 <= 0) continue;
    const mom5 = cl / c5 - 1;
    if (mom5 < 0.08 || mom5 > 0.45) continue;
    // 20-session daily-return std of this pick (for vol targeting)
    const rets20 = [];
    for (let k = idx - 19; k <= idx; k++) rets20.push(g[k][2] / g[k - 1][2] - 1);
    const mu = rets20.reduce((a, b) => a + b, 0) / rets20.length;
    const vol20 = Math.sqrt(rets20.reduce((acc, r) => acc + (r - mu) * (r - mu), 0) / (rets20.length - 1));
    const cur = (weekly.get(wk) || []).find(x => x.sym === pr.sym);
    if (!cur || cur.firstOpen === null || !cur.firstDate) continue;
    const gap = cur.firstOpen / cl - 1;
    if (gap < -0.03 || gap > 0.02) continue;
    const nr = nextW.find(x => x.sym === pr.sym);
    if (!nr || nr.firstOpen === null) continue;
    const iEntry = g.findIndex(x => x[0] === cur.firstDate);
    const path = [];
    if (iEntry >= 0) for (let k = iEntry; k < g.length && g[k][0] < nr.firstDate; k++) path.push(g[k]);
    if (!path.length) continue;
    cands.push({ sym: pr.sym, mom5, ret: nr.firstOpen / cur.firstOpen - 1 - COST, vol20, money20: pr.lastMoney20, price: pr.lastClose });
  }
  cands.sort((a, b) => b.mom5 - a.mom5);
  rows.push({ week: wk, cands });
}
function evalSystem(opts) {
  let wins = 0, losses = 0, gw = 0, gl = 0, eq = 1, peak = 1, mdd = 0, streak = 0, mx = 0, worst = 0;
  const lossWeeks = [];
  let weeks = 0;
  let prevLoss = false;
  for (const r of rows) {
    let cands = r.cands;
    if (opts.money500) cands = cands.filter(c => c.money20 >= 500000);
    if (opts.money1m) cands = cands.filter(c => c.money20 >= 1000000);
    if (opts.price2) cands = cands.filter(c => c.price >= 2);
    if (opts.postLossSkip && prevLoss) { prevLoss = false; continue; }
    const N = opts.N || 5;
    let picks = cands.slice(0, N);
    if (picks.length < 3) { prevLoss = false; continue; }
    weeks++;
    // vol targeting: size factor per pick = targetVol / pick vol20, capped [0.25, 1.25]
    let wkRet;
    if (opts.volTarget) {
      const avgVol = picks.reduce((a, c) => a + c.vol20, 0) / picks.length;
      const factor = Math.max(0.25, Math.min(1.25, opts.targetVol / Math.max(avgVol, 0.0001)));
      wkRet = picks.reduce((a, c) => a + c.ret * (opts.targetVol / Math.max(c.vol20, 0.0001)), 0) / picks.length;
      wkRet = Math.max(wkRet, -0.25); // sanity
    } else {
      wkRet = picks.reduce((a, c) => a + c.ret, 0) / picks.length;
    }
    if (wkRet > 0.0005) { wins++; gw += wkRet; } else if (wkRet < -0.0005) { losses++; gl += wkRet; lossWeeks.push(wkRet); }
    eq *= (1 + wkRet); peak = Math.max(peak, eq); mdd = Math.max(mdd, 1 - eq / peak);
    if (wkRet < -0.0005) { streak++; mx = Math.max(mx, streak); } else streak = 0;
    worst = Math.min(worst, wkRet);
    prevLoss = wkRet < -0.0005;
  }
  const avgLoss = lossWeeks.length ? (lossWeeks.reduce((a, b) => a + b, 0) / lossWeeks.length * 100).toFixed(2) + '%' : '—';
  const medLoss = lossWeeks.length ? (lossWeeks.slice().sort((a, b) => a - b)[Math.floor(lossWeeks.length / 2)] * 100).toFixed(2) + '%' : '—';
  return { weeks, wr: (100 * wins / Math.max(1, wins + losses)).toFixed(0) + '%', gW: '+' + (gw * 100).toFixed(0) + '%', gL: (gl * 100).toFixed(0) + '%', net: '+' + ((eq - 1) * 100).toFixed(0) + '%', mdd: (mdd * 100).toFixed(1) + '%', avgLoss, medLoss, worst: (worst * 100).toFixed(1) + '%', streak: mx };
}
console.log('=== BATTERY v2 (10y) — reduce the AVERAGE losing week, keep the profit ===');
console.log('metric order: weeks | win% | grossWin | grossLoss | NET | maxDD | AVG losing week | MEDIAN losing week | worst week | maxStreak');
console.log('BASELINE N5:', JSON.stringify(evalSystem({})));
console.log('VOL-TARGET sizing:', JSON.stringify(evalSystem({ volTarget: true, targetVol: 0.025 })));
console.log('MONEY>=500k:', JSON.stringify(evalSystem({ money500: true })));
console.log('MONEY>=1M:', JSON.stringify(evalSystem({ money1m: true })));
console.log('PRICE>=2 EGP:', JSON.stringify(evalSystem({ price2: true })));
console.log('N3:', JSON.stringify(evalSystem({ N: 3 })));
console.log('POST-LOSS SKIP (skip week after a loss):', JSON.stringify(evalSystem({ postLossSkip: true })));
console.log('VOL-TARGET + MONEY>=500k:', JSON.stringify(evalSystem({ volTarget: true, targetVol: 0.025, money500: true })));
