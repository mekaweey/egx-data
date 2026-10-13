// B2 unit tests — session-calendar window logic (B1 design), synthetic data, no DB.
// Run: node bt/session_window_tests.cjs
// Paper-only: logic to be wired into the engine on a branch, NOT merged live.

// ---- B1 core: build an N-session window for one symbol from the OFFICIAL calendar ----
function buildWindow(rows, calendar, nSessions) {
  const cal = calendar.filter(d => !rows.some(r => r.date === d && r.phantom === true));
  const inCal = new Set(cal);
  const real = rows.filter(r => inCal.has(r.date)); // phantom rows ignored by construction
  const byDate = new Map(real.map(r => [r.date, r]));
  const want = cal.slice(-nSessions);
  if (want.length < nSessions) return { ok: false, reason: 'calendar_short' };
  for (const d of want) {
    const r = byDate.get(d);
    if (!r) return { ok: false, reason: `missing_session:${d}` };
    if (r.close == null || !(r.close > 0) || r.open == null || !(r.open > 0))
      return { ok: false, reason: `null_or_zero_price:${d}` };
  }
  return { ok: true, window: want.map(d => byDate.get(d)) };
}

// ---- B1: market-wide missing session (whole market dark) => HARD STOP, not per-symbol skip ----
function marketWideCheck(rowsBySymbol, calendar, nSessions) {
  const want = calendar.slice(-nSessions);
  for (const d of want) {
    const symbolsWith = [...rowsBySymbol.keys()].filter(s =>
      rowsBySymbol.get(s).some(r => r.date === d));
    if (symbolsWith.length === 0) return { hardStop: true, date: d };
  }
  return { hardStop: false };
}

// ---- gap filter: evaluated ONLY when the entry (Sunday) open exists ----
function gapFilter(windowCloses, entryOpen, prevClose) {
  if (entryOpen == null) return { deferred: true }; // pre-open / paper mode: not a failure
  const gap = entryOpen / prevClose - 1;
  if (gap < -0.03 || gap > 0.02) return { reject: true, gap };
  return { pass: true, gap };
}

// ---- synthetic calendar: Sun-Thu sessions; Fri/Sat exist in raw data as phantoms ----
const CAL = ['2026-09-24', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01'];
const mk = (date, close, open = close) => ({ date, close, open, volume: 1000 });

let failures = 0;
function test(name, fn) {
  try { fn(); console.log(`PASS  ${name}`); }
  catch (e) { failures++; console.log(`FAIL  ${name} :: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

test('B2a: missing session inside window is rejected', () => {
  const rows = CAL.filter(d => d !== '2026-09-28').map(d => mk(d, 10));
  const w = buildWindow(rows, CAL, 6);
  assert(!w.ok && w.reason === 'missing_session:2026-09-28', `got ${JSON.stringify(w)}`);
});

test('B2b: phantom rows (Fri/Sat) are ignored, window still builds', () => {
  const rows = CAL.map(d => mk(d, 10));
  rows.push({ date: '2026-10-02', close: 10, open: 10, volume: 0, phantom: true }); // Friday
  rows.push({ date: '2026-10-03', close: 10, open: 10, volume: 0, phantom: true }); // Saturday
  const w = buildWindow(rows, CAL, 6);
  assert(w.ok, `got ${JSON.stringify(w)}`);
  assert(w.window.length === 6 && !w.window.some(r => r.phantom), 'phantom leaked into window');
});

test('B2c: market-wide missing session => HARD STOP signal', () => {
  const rowsBySymbol = new Map();
  for (const s of ['GPIM', 'UEFM', 'MMAT']) {
    rowsBySymbol.set(s, CAL.filter(d => d !== '2026-09-30').map(d => mk(d, 10)));
  }
  const chk = marketWideCheck(rowsBySymbol, CAL, 6);
  assert(chk.hardStop && chk.date === '2026-09-30', `got ${JSON.stringify(chk)}`);
});

test('B2d: NULL/zero price inside window is rejected', () => {
  const rows = CAL.map(d => mk(d, 10));
  rows[3].close = null;
  const w1 = buildWindow(rows, CAL, 6);
  assert(!w1.ok && w1.reason.startsWith('null_or_zero_price'), `got ${JSON.stringify(w1)}`);
  rows[3].close = 0;
  const w2 = buildWindow(rows, CAL, 6);
  assert(!w2.ok, 'zero close accepted');
});

test('B2e: gap filter deferred pre-open, enforced only when Sunday open exists', () => {
  const deferred = gapFilter(null, null, 10);
  assert(deferred.deferred === true, 'pre-open gap check should defer, not fail');
  const pass = gapFilter(null, 10.1, 10);
  assert(pass.pass && Math.abs(pass.gap - 0.01) < 1e-9, `got ${JSON.stringify(pass)}`);
  const reject = gapFilter(null, 10.5, 10); // +5% open gap > +2% ceiling
  assert(reject.reject && Math.abs(reject.gap - 0.05) < 1e-9, `got ${JSON.stringify(reject)}`);
});

console.log(failures === 0 ? '\nALL B2 TESTS PASS' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
