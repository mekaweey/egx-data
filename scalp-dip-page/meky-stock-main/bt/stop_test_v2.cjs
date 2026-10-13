// STOP-LOSS TEST v2 — FIXED: firstDate now stored in weekly records
// Tests: BASELINE (hold to Sunday) vs per-position stops (-10%, -7%) vs portfolio week-stop (-2%)
// On 10y ydf halal data. ASCII ONLY.
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
    if (idx < 5) continue;
    const cl = g[idx][2], c5 = g[idx - 5][2];
    if (!c5 || c5 <= 0) continue;
    const mom5 = cl / c5 - 1;
    if (mom5 < 0.08 || mom5 > 0.45) continue;
    const cur = (weekly.get(wk) || []).find(x => x.sym === pr.sym);
    if (!cur || cur.firstOpen === null || !cur.firstDate) continue;
    const gap = cur.firstOpen / cl - 1;
    if (gap < -0.03 || gap > 0.02) continue;
    const nr = nextW.find(x => x.sym === pr.sym);
    if (!nr || nr.firstOpen === null) continue;
    const iEntry = g.findIndex(x => x[0] === cur.firstDate);
    const path = [];
    if (iEntry >= 0) {
      for (let k = iEntry; k < g.length && g[k][0] < nr.firstDate; k++) path.push(g[k]);
    }
    if (!path.length) continue;
    cands.push({ sym: pr.sym, mom5, ret: nr.firstOpen / cur.firstOpen - 1 - COST, entry: cur.firstOpen, path });
  }
  cands.sort((a, b) => b.mom5 - a.mom5);
  const picks = cands.slice(0, 5);
  if (picks.length < 3) continue;
  rows.push({ week: wk, picks });
}
console.log('weeks with candidates:', rows.length);
function summarize(weeksArr, label) {
  let wins = 0, losses = 0, gw = 0, gl = 0, eq = 1, peak = 1, mdd = 0, streak = 0, mx = 0, worst = 0;
  let breaches2 = 0;
  for (const r of weeksArr) {
    if (r.ret < -0.02) breaches2++;
    if (r.ret > 0.0005) { wins++; gw += r.ret; } else if (r.ret < -0.0005) { losses++; gl += r.ret; }
    eq *= (1 + r.ret); peak = Math.max(peak, eq); mdd = Math.max(mdd, 1 - eq / peak);
    if (r.ret < -0.0005) { streak++; mx = Math.max(mx, streak); } else streak = 0;
    worst = Math.min(worst, r.ret);
  }
  console.log(label + ': ' + weeksArr.length + 'w | wr ' + (100 * wins / Math.max(1, wins + losses)).toFixed(0) + '% | grossWin +' + (gw * 100).toFixed(0) + '% | grossLoss ' + (gl * 100).toFixed(0) + '% | NET +' + ((eq - 1) * 100).toFixed(0) + '% | maxDD ' + (mdd * 100).toFixed(1) + '% | maxStreak ' + mx + ' | worstWeek ' + (worst * 100).toFixed(1) + '% | weeks<-2%: ' + breaches2);
}
// BASELINE
const base = rows.map(r => ({ week: r.week, ret: r.picks.reduce((a, c) => a + c.ret, 0) / r.picks.length }));
summarize(base, 'BASELINE (hold to Sunday)');
// S1: per-position stop -10%
const s1 = rows.map(r => {
  const rets = r.picks.map(c => {
    for (let i = 0; i < c.path.length; i++) {
      if (c.path[i][2] <= c.entry * 0.90) {
        const nx = c.path[i + 1];
        return (nx ? nx[1] : c.path[i][2]) / c.entry - 1 - COST;
      }
    }
    return c.ret;
  });
  return { week: r.week, ret: rets.reduce((a, b) => a + b, 0) / rets.length };
});
summarize(s1, 'S1: per-position stop -10% (exit next open)');
// S2: per-position stop -7%
const s2 = rows.map(r => {
  const rets = r.picks.map(c => {
    for (let i = 0; i < c.path.length; i++) {
      if (c.path[i][2] <= c.entry * 0.93) {
        const nx = c.path[i + 1];
        return (nx ? nx[1] : c.path[i][2]) / c.entry - 1 - COST;
      }
    }
    return c.ret;
  });
  return { week: r.week, ret: rets.reduce((a, b) => a + b, 0) / rets.length };
});
summarize(s2, 'S2: per-position stop -7% (exit next open)');
// S3: portfolio week-stop -2%
const s3 = rows.map(r => {
  const n = r.picks.length;
  const days = Math.max(...r.picks.map(c => c.path.length));
  let exited = false;
  const finalRets = r.picks.map(c => c.ret);
  for (let d = 0; d < days && !exited; d++) {
    let port = 0;
    for (const c of r.picks) {
      const px = d < c.path.length ? c.path[d][2] : c.path[c.path.length - 1][2];
      port += px / c.entry - 1;
    }
    port /= n;
    if (port <= -0.02) {
      exited = true;
      for (let i = 0; i < r.picks.length; i++) {
        const c = r.picks[i];
        const exitDay = d + 1;
        const px = exitDay < c.path.length ? c.path[exitDay][1] : c.path[c.path.length - 1][2];
        finalRets[i] = px / c.entry - 1 - COST;
      }
    }
  }
  return { week: r.week, ret: finalRets.reduce((a, b) => a + b, 0) / finalRets.length };
});
summarize(s3, 'S3: portfolio week-stop -2% (exit ALL next open)');
