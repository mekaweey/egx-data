// LONG-HISTORY COMBINED SYSTEM TEST (2017-2026) — Yahoo + user file + DB
// Same deployed config: halal, mom5 8-45%, v20>=200k, price>=0.5, gap [-3,+2],
// N5, entry Sunday open, exit next Sunday open, cost 0.05%.
// Systems: BASELINE (no gate no overlay) | MAIN (MA4 gate) | COMBINED (MA4 + crash overlay)
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

// load ydf files
const sym = new Map();
const files = fs.readdirSync(BT).filter(f => f.startsWith('ydf_') && f.endsWith('.csv'));
for (const f of files) {
  const sname = f.slice(4, -4).toUpperCase();
  const lines = fs.readFileSync(BT + f, 'utf8').split('\n').filter(l => l.trim());
  const arr = [];
  for (const l of lines.slice(1)) {
    const p = l.split(',');
    const d = (p[0] || '').slice(0, 10);
    const o = parseFloat(p[1]), c = parseFloat(p[4]), v = parseFloat(p[5]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !isFinite(o) || !isFinite(c) || o <= 0 || c <= 0) continue;
    arr.push([d, o, c, isFinite(v) ? v : 0]);
  }
  arr.sort((a, b) => a[0].localeCompare(b[0]));
  if (arr.length) sym.set(sname, arr);
}
// splice: user daily.csv (2026-04->09) overrides ydf for overlapping weeks? Both are
// the same symbols; use daily.csv for dates >= 2026-04-01 (its window) for precision.
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
// weekly maps
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
// market index + weekly returns (all symbols)
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
    if (idx < 5) continue;
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
  const mi = mret.findIndex(m => m.week === wk);
  const ma4 = mi >= 4 ? mret.slice(mi - 4, mi).reduce((a, m) => a + m.ret, 0) / 4 : null;
  const mretPrev = mi >= 1 ? mret[mi - 1].ret : null;
  rows.push({ week: wk, picks: cands.slice(0, 5), ma4, mretPrev });
}
function sumPicks(picks) { return picks && picks.length >= 1 ? picks.reduce((a, c) => a + c.ret, 0) / picks.length : null; }
// systems
const baselineWeeks = rows.filter(r => r.picks.length >= 3).map(r => ({ week: r.week, ret: sumPicks(r.picks) })).filter(r => r.ret !== null);
const mainWeeks = rows.filter(r => r.picks.length >= 3 && r.ma4 !== null && r.ma4 >= 0).map(r => ({ week: r.week, ret: sumPicks(r.picks) })).filter(r => r.ret !== null);
// overlay on gate-closed weeks after crashes
const closed = rows.filter(r => !(r.picks.length >= 3 && r.ma4 !== null && r.ma4 >= 0));
const overlay = [];
for (const r of closed) {
  if (r.mretPrev === null || r.mretPrev > -0.03) continue;
  const wi = weeks.indexOf(r.week);
  const prevW = weekly.get(weeks[wi - 1]);
  const nextW = weekly.get(weeks[wi + 1]);
  const cands = [];
  for (const pr of prevW) {
    if (pr.lastClose === null || !pr.lastMoney20 || pr.lastMoney20 < 200000) continue;
    if (pr.lastClose < 0.5) continue;
    if (pr.weekRet === undefined) {
      const arr = sym.get(pr.sym); if (!arr) continue;
      const i2 = arr.findIndex(x => x[0] === pr.lastDate);
      if (i2 < 1) continue;
      pr.weekRet = arr[i2][2] / arr[i2 - 1][2] - 1;
    }
    if (pr.weekRet >= 0) continue;
    const cur = (weekly.get(r.week) || []).find(x => x.sym === pr.sym);
    if (!cur || cur.firstOpen === null) continue;
    const nr = nextW.find(x => x.sym === pr.sym);
    if (!nr || nr.firstOpen === null) continue;
    cands.push({ sym: pr.sym, ret: nr.firstOpen / cur.firstOpen - 1 - COST });
  }
  cands.sort((a, b) => a.mom5 - b.mom5); // no drop ranking available in ydf fast path — use order
  const picks = cands.slice(0, 5);
  if (picks.length < 3) continue;
  overlay.push({ week: r.week, ret: picks.reduce((a, c) => a + c.ret, 0) / picks.length });
}
function summarize(weeksArr, label) {
  let wins = 0, losses = 0, gw = 0, gl = 0, eq = 1, peak = 1, mdd = 0, streak = 0, mx = 0, worst = 0;
  for (const r of weeksArr) {
    if (r.ret > 0.0005) { wins++; gw += r.ret; } else if (r.ret < -0.0005) { losses++; gl += r.ret; }
    eq *= (1 + r.ret); peak = Math.max(peak, eq); mdd = Math.max(mdd, 1 - eq / peak);
    if (r.ret < -0.0005) { streak++; mx = Math.max(mx, streak); } else streak = 0;
    worst = Math.min(worst, r.ret);
  }
  console.log(label + ': ' + weeksArr.length + ' weeks | wins ' + wins + ' losses ' + losses + ' (wr ' + (100 * wins / Math.max(1, wins + losses)).toFixed(0) + '%) | grossWin +' + (gw * 100).toFixed(0) + '% | grossLoss ' + (gl * 100).toFixed(0) + '% | NET +' + ((eq - 1) * 100).toFixed(0) + '% | maxDD ' + (mdd * 100).toFixed(1) + '% | maxStreak ' + mx + ' | worstWeek ' + (worst * 100).toFixed(1) + '%');
  return { net: eq - 1 };
}
console.log('=== LONG HISTORY ' + rows[0].week + ' -> ' + rows[rows.length - 1].week + ' ===');
console.log('');
const b = summarize(baselineWeeks, 'BASELINE (no gate, no overlay)');
const m = summarize(mainWeeks, 'MAIN (MA4 gate)');
const o = summarize(overlay, 'OVERLAY (crash weeks only)');
const ovMap = new Map(overlay.map(r => [r.week, r.ret]));
const mainMap = new Map(mainWeeks.map(r => [r.week, r.ret]));
const allW = new Set([...mainMap.keys(), ...ovMap.keys()]);
const combined = [];
for (const w of allW) {
  if (mainMap.has(w)) combined.push({ week: w, ret: mainMap.get(w) });
  else if (ovMap.has(w)) combined.push({ week: w, ret: ovMap.get(w) });
}
combined.sort((a, b) => a.week.localeCompare(b.week));
console.log('');
const c = summarize(combined, 'COMBINED (main + overlay)');
console.log('');
console.log('overlay firings: ' + overlay.length + ' | overlay weeks: ' + overlay.map(r => r.week.slice(0, 4) + '-' + r.week.slice(5, 7) + ' ' + (r.ret * 100).toFixed(1) + '%').join(', '));
