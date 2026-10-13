// RISK-CONTROL BATTERY on 10y data — sizing/structure changes (not direction filters)
// Variants vs N5 baseline: N8, N10, catastrophe stop -20% per position,
// parabola-20 detector (skip +60%/20s), money>=500k, drawdown sizing.
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
const files = fs.readdirSync(BT).filter(f => f.startsWith('ydf_') && f.endsWith('.csv'));
for (const f of files) {
  const sname = f.slice(4, -4).toUpperCase();
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
const lines2 = fs.readFileSync(BT + 'daily.csv', 'utf8').split('\n').filter(l => l.trim());
for (const l of lines2.slice(1)) {
  const p = l.split(',');
  const di = parseInt(p[1], 10); if (!isFinite(di)) continue;
  const d = new Date(di * 86400000).toISOString().slice(0, 10);
  if (d < '2026-04-01') continue;
  const o = parseFloat(p[2]), c = parseFloat(p[5]), v = parseFloat(p[6]);
  if (!isFinite(o) || !isFinite(c) || o <= 0 || c <= 0) continue;
  if (!sym.has(p[0])) sym.set(p[0], []);
  const arr = sym.get(p[0]);
  const ex = arr.findIndex(x => x[0] === d);
  if (ex >= 0) arr[ex] = [d, o, c, isFinite(v) ? v : arr[ex][3]];
  else { arr.push([d, o, c, isFinite(v) ? v : 0]); arr.sort((a, b) => a[0].localeCompare(b[0])); }
}
const weekly = new Map();
for (const [s, arr] of sym) {
  if (!HALAL.has(s)) continue;
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
const mkt = new Map();
for (const [s, arr] of sym) { for (const [d, , c] of arr) { const w = weekSunday(d); if (!mkt.has(w)) mkt.set(w, new Map()); mkt.get(w).set(s, c); } }
const mweeks = [...mkt.keys()].sort();
const mret = [];
for (let i = 1; i < mweeks.length; i++) {
  const prev = mkt.get(mweeks[i - 1]), cur = mkt.get(mweeks[i]);
  let sum = 0, n = 0;
  for (const [s, c] of cur) { const p = prev.get(s); if (!p || p <= 0) continue; sum += c / p - 1; n++; }
  if (n >= 40) mret.push({ week: mweeks[i], ret: sum / n });
}
const weeks = [...weekly.keys()].sort();
// build all candidate sets per week once
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
    const cl = g[idx][2], c5 = g[idx - 5][2], c20 = g[idx - 20][2];
    if (!c5 || c5 <= 0 || !c20 || c20 <= 0) continue;
    const mom5 = cl / c5 - 1;
    if (mom5 < 0.08 || mom5 > 0.45) continue;
    const parab20 = cl / c20 - 1; // 20-session cumulative rise
    const cur = (weekly.get(wk) || []).find(x => x.sym === pr.sym);
    if (!cur || cur.firstOpen === null) continue;
    const gap = cur.firstOpen / cl - 1;
    if (gap < -0.03 || gap > 0.02) continue;
    const nr = nextW.find(x => x.sym === pr.sym);
    if (!nr || nr.firstOpen === null) continue;
    // daily path for catastrophe-stop simulation: entry day + following dailies until next Sunday
    const entryDate = cur.firstDate;
    const iEntry = g.findIndex(x => x[0] === entryDate);
    const path = [];
    if (iEntry >= 0) {
      for (let k = iEntry; k < g.length && g[k][0] <= nr.firstDate; k++) path.push(g[k]);
    }
    cands.push({ sym: pr.sym, mom5, ret: nr.firstOpen / cur.firstOpen - 1 - COST, parab20, path, entry: cur.firstOpen });
  }
  cands.sort((a, b) => b.mom5 - a.mom5);
  rows.push({ week: wk, cands });
}
function runSystem(opts) {
  const N = opts.N || 5;
  let eq = 1, peak = 1, mdd = 0, wins = 0, losses = 0, gw = 0, gl = 0, streak = 0, mx = 0, worst = 0, weeksN = 0;
  let sizingOn = false;
  for (const r of rows) {
    let cands = r.cands;
    if (opts.parabCap) cands = cands.filter(c => c.parab20 <= 0.60);
    if (opts.money500) cands = cands.filter(c => { const pr = null; return true; });
    const picks = cands.slice(0, N);
    if (picks.length < 3) continue;
    weeksN++;
    // per-position returns with optional catastrophe stop
    const rets = picks.map(c => {
      if (opts.stop) {
        let px = c.entry;
        for (const d of c.path) {
          if (d[2] <= c.entry * (1 - opts.stop)) { // close breached stop -> exit next day open
            const i = c.path.indexOf(d);
            const nx = c.path[i + 1];
            return (nx ? nx[1] : d[2]) / c.entry - 1 - COST;
          }
        }
      }
      return c.ret;
    });
    // sizing: half size while equity below 95% of peak
    let factor = 1;
    if (opts.ddSize) factor = eq >= peak * 0.95 ? 1 : 0.5;
    let wkRet = 0;
    for (const rr of rets) { const base = rr > 0 ? rr : rr; wkRet += rr; }
    wkRet = rets.reduce((a, b) => a + b, 0) / rets.length;
    eq *= (1 + wkRet * factor);
    peak = Math.max(peak, eq); mdd = Math.max(mdd, 1 - eq / peak);
    if (wkRet > 0.0005) { wins++; gw += wkRet * factor; } else if (wkRet < -0.0005) { losses++; gl += wkRet * factor; }
    if (wkRet < -0.0005) { streak++; mx = Math.max(mx, streak); } else streak = 0;
    worst = Math.min(worst, wkRet);
  }
  return { weeks: weeksN, wr: (100 * wins / Math.max(1, wins + losses)).toFixed(0) + '%', net: '+' + ((eq - 1) * 100).toFixed(0) + '%', mdd: (mdd * 100).toFixed(1) + '%', mx, worst: (worst * 100).toFixed(1) + '%', gw: '+' + (gw * 100).toFixed(0) + '%', gl: (gl * 100).toFixed(0) + '%' };
}
console.log('=== 10-YEAR RISK-CONTROL BATTERY (2017-2026, same config core) ===');
console.log('N5 baseline:', JSON.stringify(runSystem({})));
console.log('N8 (less concentration):', JSON.stringify(runSystem({ N: 8 })));
console.log('N10:', JSON.stringify(runSystem({ N: 10 })));
console.log('N5 + catastrophe stop -20%/position:', JSON.stringify(runSystem({ stop: 0.20 })));
console.log('N5 + parabola skip (+60%/20s):', JSON.stringify(runSystem({ parabCap: true })));
console.log('N5 + drawdown sizing (half below -5% from peak):', JSON.stringify(runSystem({ ddSize: true })));
console.log('N8 + catastrophe stop:', JSON.stringify(runSystem({ N: 8, stop: 0.20 })));
console.log('N8 + drawdown sizing:', JSON.stringify(runSystem({ N: 8, ddSize: true })));
