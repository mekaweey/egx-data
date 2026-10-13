// CRASH-WEEK WINNERS STUDY (25 years) — who rises when the market crashes?
// Uses the verified join (mret-index previous week). ASCII ONLY.
const fs = require('fs');
const master = JSON.parse(fs.readFileSync('bt/wild_master.json', 'utf8'));
function weekSunday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dow = d.getUTCDay();
  const back = (dow === 5 || dow === 6) ? dow - 7 : dow;
  return new Date(d.getTime() - back * 86400000).toISOString().slice(0, 10);
}
const mkt = new Map();
const symWeek = new Map();
for (const [s, arr] of Object.entries(master)) {
  for (let i = 0; i < arr.length; i++) {
    const w = weekSunday(arr[i][0]);
    if (!mkt.has(w)) mkt.set(w, new Map());
    mkt.get(w).set(s, arr[i][4]);
    if (!symWeek.has(s)) symWeek.set(s, new Map());
    symWeek.get(s).set(w, arr[i][4]);
  }
}
const mweeks = [...mkt.keys()].sort();
const mret = [];
for (let i = 1; i < mweeks.length; i++) {
  const prev = mkt.get(mweeks[i - 1]), cur = mkt.get(mweeks[i]);
  let sum = 0, n = 0;
  for (const [s, c] of cur) { const p = prev.get(s); if (p === undefined || p <= 0) continue; sum += c / p - 1; n++; }
  if (n >= 30) mret.push({ week: mweeks[i], ret: sum / n });
}
const crashWeeks = mret.filter(m => m.ret <= -0.035);
console.log('crash weeks (<=-3.5%):', crashWeeks.length, 'of', mret.length);
const stats = new Map();
for (let i = 0; i < mret.length; i++) {
  if (mret[i].ret > -0.035) continue;
  const prevWeek = i > 0 ? mret[i - 1].week : null;
  if (!prevWeek) continue;
  for (const [s, wkmap] of symWeek) {
    const c = wkmap.get(mret[i].week);
    const p = wkmap.get(prevWeek);
    if (c === undefined || p === undefined || p <= 0) continue;
    const r = c / p - 1;
    if (!stats.has(s)) stats.set(s, { n: 0, up: 0, sum: 0 });
    const st = stats.get(s);
    st.n++; st.sum += r; if (r > 0) st.up++;
  }
}
const minN = 30;
const ranked = [...stats.entries()]
  .map(([s, st]) => ({ s, n: st.n, hit: st.up / st.n, avg: st.sum / st.n }))
  .filter(x => x.n >= minN)
  .sort((a, b) => (b.hit * 100 + b.avg * 10) - (a.hit * 100 + a.avg * 10));
console.log('symbols with >=30 crash observations:', ranked.length);
console.log('');
console.log('=== TOP 15: persistent crash-week relative winners ===');
for (const d of ranked.slice(0, 15)) console.log(`  ${d.s}: hit ${Math.round(d.hit * 100)}% of ${d.n} crashes | avg ${d.avg >= 0 ? '+' : ''}${(d.avg * 100).toFixed(2)}%`);
console.log('');
const positive = ranked.filter(d => d.avg > 0 && d.hit >= 0.5);
console.log('symbols positive-on-average with >=50% hit:', positive.length);
console.log('');
console.log('=== BOTTOM 5 (worst in crashes) ===');
for (const d of ranked.slice(-5)) console.log(`  ${d.s}: hit ${Math.round(d.hit * 100)}% | avg ${(d.avg * 100).toFixed(2)}%`);
