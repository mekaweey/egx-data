// TEST: crash-week mean-reversion overlay + combined system vs baseline
// ASCII ONLY.
const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/daily.csv', 'utf8').split('\n').filter(l => l.trim());
function weekSunday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dow = d.getUTCDay();
  const back = (dow === 5 || dow === 6) ? dow - 7 : dow;
  return new Date(d.getTime() - back * 86400000).toISOString().slice(0, 10);
}
const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
const COST = 0.0005, MIN_WEEK = '2025-01-01';
const sym = new Map();
for (const l of lines.slice(1)) {
  const p = l.split(',');
  const di = parseInt(p[1], 10); if (!isFinite(di)) continue;
  const d = new Date(di * 86400000).toISOString().slice(0, 10);
  const o = parseFloat(p[2]), c = parseFloat(p[5]), money = parseFloat(p[7]);
  if (!isFinite(o) || !isFinite(c) || o <= 0 || c <= 0) continue;
  if (!sym.has(p[0])) sym.set(p[0], []);
  sym.get(p[0]).push([d, o, c, isFinite(money) ? money : c * parseFloat(p[6])]);
}
for (const [s, arr] of sym) arr.sort((a, b) => a[0].localeCompare(b[0]));
const weekly = new Map();
for (const [s, arr] of sym) {
  if (!HALAL.has(s)) continue;
  for (let i = 0; i < arr.length; i++) {
    const [d, o, c, money] = arr[i];
    const w = weekSunday(d);
    if (!weekly.has(w)) weekly.set(w, []);
    const rec = weekly.get(w);
    let r = rec.find(x => x.sym === s);
    if (!r) { r = { sym: s, firstOpen: null, lastClose: null, lastDate: d, lastMoney20: null, weekRet: null }; rec.push(r); }
    if (r.firstOpen === null) r.firstOpen = o;
    const prevC = i > 0 ? arr[i - 1][2] : null;
    r.weekRet = prevC ? c / prevC - 1 : 0;
    r.lastClose = c; r.lastDate = d;
    if (i >= 19) { let m = 0; for (let k = i - 19; k <= i; k++) m += arr[k][3]; r.lastMoney20 = m / 20; }
  }
}
const mkt = new Map();
const symAll = new Map();
for (const l of lines.slice(1)) {
  const p = l.split(',');
  const di = parseInt(p[1], 10); if (!isFinite(di)) continue;
  const d = new Date(di * 86400000).toISOString().slice(0, 10);
  const c = parseFloat(p[5]); if (!isFinite(c) || c <= 0) continue;
  if (!symAll.has(p[0])) symAll.set(p[0], []);
  symAll.get(p[0]).push([d, c]);
}
for (const [s, arr] of symAll) { arr.sort(); for (const [d, c] of arr) { const w = weekSunday(d); if (!mkt.has(w)) mkt.set(w, new Map()); mkt.get(w).set(s, c); } }
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
  if (wk < MIN_WEEK) continue;
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
const mainRows = rows.filter(r => r.picks.length >= 3 && r.ma4 !== null && r.ma4 >= 0);
const mainWeeks = mainRows.map(r => ({ week: r.week, ret: sumPicks(r.picks) })).filter(r => r.ret !== null);
const closed = rows.filter(r => !(r.picks.length >= 3 && r.ma4 !== null && r.ma4 >= 0));
function overlayTest(crashThreshold) {
  const out = [];
  for (const r of closed) {
    if (r.mretPrev === null || r.mretPrev > crashThreshold) continue;
    const wi = weeks.indexOf(r.week);
    const prevW = weekly.get(weeks[wi - 1]);
    const nextW = weekly.get(weeks[wi + 1]);
    const cands = [];
    for (const pr of prevW) {
      if (pr.lastClose === null || !pr.lastMoney20 || pr.lastMoney20 < 200000) continue;
      if (pr.lastClose < 0.5) continue;
      if (pr.weekRet === null || pr.weekRet >= 0) continue;
      const cur = (weekly.get(r.week) || []).find(x => x.sym === pr.sym);
      if (!cur || cur.firstOpen === null) continue;
      const nr = nextW.find(x => x.sym === pr.sym);
      if (!nr || nr.firstOpen === null) continue;
      cands.push({ sym: pr.sym, drop: pr.weekRet, ret: nr.firstOpen / cur.firstOpen - 1 - COST });
    }
    cands.sort((a, b) => a.drop - b.drop);
    const picks = cands.slice(0, 5);
    if (picks.length < 3) continue;
    out.push({ week: r.week, ret: picks.reduce((a, c) => a + c.ret, 0) / picks.length, names: picks.map(p => p.sym).join('+') });
  }
  return out;
}
function summarize(weeksArr, label) {
  if (!weeksArr.length) { console.log(label + ': no weeks'); return { net: 0 }; }
  let wins = 0, losses = 0, gw = 0, gl = 0, eq = 1, peak = 1, mdd = 0, worst = 0;
  for (const r of weeksArr) {
    if (r.ret > 0) { wins++; gw += r.ret; } else { losses++; gl += r.ret; }
    eq *= (1 + r.ret); peak = Math.max(peak, eq); mdd = Math.max(mdd, 1 - eq / peak); worst = Math.min(worst, r.ret);
  }
  console.log(label + ': ' + weeksArr.length + ' weeks | wins ' + wins + ' losses ' + losses + ' | grossWin +' + (gw * 100).toFixed(0) + '% grossLoss ' + (gl * 100).toFixed(0) + '% | net +' + ((eq - 1) * 100).toFixed(0) + '% | mdd ' + (mdd * 100).toFixed(1) + '% | worst ' + (worst * 100).toFixed(1) + '%');
  console.log('   weeks: ' + weeksArr.map(r => r.week.slice(5) + ' ' + (r.ret * 100).toFixed(1) + '%').join(' | '));
  return { net: eq - 1 };
}
console.log('=== MAIN (momentum N5 + MA4 gate) ===');
const m = summarize(mainWeeks, 'MAIN');
console.log('');
console.log('=== OVERLAY: crash-week mean-reversion (biggest losers N5) ===');
for (const th of [-0.03, -0.05]) {
  const ov = overlayTest(th);
  summarize(ov, 'crash<=' + (th * 100).toFixed(0) + '%');
}
const ov3 = overlayTest(-0.03);
const ovMap = new Map(ov3.map(r => [r.week, r.ret]));
const mainMap = new Map(mainWeeks.map(r => [r.week, r.ret]));
const allW = new Set([...mainMap.keys(), ...ovMap.keys()]);
const combined = [];
for (const w of allW) {
  if (mainMap.has(w)) combined.push({ week: w, ret: mainMap.get(w) });
  else if (ovMap.has(w)) combined.push({ week: w, ret: ovMap.get(w) });
}
combined.sort((a, b) => a.week.localeCompare(b.week));
console.log('');
console.log('=== COMBINED (main MA4 + crash overlay) ===');
const c = summarize(combined, 'COMBINED');
console.log('');
console.log('SUMMARY: no-filter baseline +57% | MAIN-only +' + (m.net * 100).toFixed(0) + '% | COMBINED +' + (c.net * 100).toFixed(0) + '%');
