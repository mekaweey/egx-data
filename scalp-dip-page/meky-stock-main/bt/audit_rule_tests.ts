import * as fs from "node:fs";
import {
  MW_PARAMS,
  REGIME_DEF,
  REGIME_MIN_SYMBOLS,
  MARKET_HOLE_COVERAGE,
  ALERT_MAX_FAILURES,
  cairoDayOfRow,
  isOfficialSessionDay,
  calendarStatus,
  lastNOfficialSessions,
  isSignalWindow,
  holdingTouchesUnknown,
  screenSymbolCandidate,
  computeExitFromCalendar,
  formatTelegramPreviewLine,
  selectExitPrice,
  checkMarketWide,
  computeWeeklyBench,
  computeWeeklyBenchOO,
  cumProduct,
  alertSendState,
} from "@/lib/scalp-dip/momentum-weekly.server";
import { assertHalalSet } from "@/lib/scalp-dip/halal-list.server";
import { validateScannerSnapshot, validateScannerPayload } from "@/lib/scalp-dip/market-sync.server";
import { sendTelegram } from "@/lib/scalp-dip/telegram.server";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name + " " + extra); }
}

const fix = JSON.parse(fs.readFileSync("C:/Users/Mekawey/AppData/Local/Temp/opencode/oct1_fixture.json", "utf8"));
const syms: Record<string, Array<{ date: string; close: number; volume: number }>> = fix.symbols;

// official sessions ending at the 1-Oct signal (Cairo; Sep-17 hole excluded by construction)
const momSess = ["2026-09-24", "2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01"];
const liqSess = ["2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-13", "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01"];
check("sessions-shape", momSess.length === 6 && liqSess.length === 20, "");
check("sessions-helper-mom", JSON.stringify(lastNOfficialSessions("2026-10-01", 6)) === JSON.stringify(momSess), JSON.stringify(lastNOfficialSessions("2026-10-01", 6)));
check("sessions-helper-liq", JSON.stringify(lastNOfficialSessions("2026-10-01", 20)) === JSON.stringify(liqSess), "");

// (a) frozen 1-Oct snapshot over the 97-file universe -> exactly {UEFM}
function screenAll() {
  const screened: Array<{ s: string; mom: number; v20: number; lastc: number }> = [];
  const reasons: Record<string, string> = {};
  for (const s of Object.keys(syms)) {
    const byDay = new Map(syms[s].map((r) => [r.date, { close: r.close, volume: r.volume }]));
    const r = screenSymbolCandidate(s, byDay, momSess, liqSess);
    if (!r.cand) { reasons[s] = r.reason; continue; }
    screened.push({ s, mom: r.cand.mom5, v20: r.cand.v20_money, lastc: r.cand.last_close });
  }
  screened.sort((a, b) => b.v20 - a.v20);
  const inband = screened.slice(0, 100).filter((c) => c.mom >= MW_PARAMS.MOM_MIN && c.mom <= MW_PARAMS.MOM_MAX).sort((a, b) => b.mom - a.mom);
  return { selected: inband.slice(0, 5).map((c) => c.s), reasons };
}
const r1 = screenAll();
check("a:frozen-oct1-selects-exactly-UEFM", JSON.stringify(r1.selected) === JSON.stringify(["UEFM"]), JSON.stringify(r1.selected));
check("a:AIFI-reason-momentum-band", r1.reasons["AIFI"] === "momentum-band", r1.reasons["AIFI"]);
check("a:GPIM-reason-liquidity-short", (r1.reasons["GPIM"] || "").startsWith("liquidity-short"), r1.reasons["GPIM"]);
check("a:MMAT-reason-liquidity-short", (r1.reasons["MMAT"] || "").startsWith("liquidity-short"), r1.reasons["MMAT"]);
check("a:NCCW-reason-momentum-band", r1.reasons["NCCW"] === "momentum-band", r1.reasons["NCCW"]);

// (b) determinism: run twice -> identical sets (DB-level uniqueness is shipped
// as an unapplied migration + existing idempotent persist path)
const r2 = screenAll();
check("b:rescreen-deterministic", JSON.stringify(r2.selected) === JSON.stringify(r1.selected) && JSON.stringify(Object.keys(r2.reasons).sort()) === JSON.stringify(Object.keys(r1.reasons).sort()), "");

// (c) Oct-3-style duplicates can never become a signal
check("c:cairoDayOfRow-tz", cairoDayOfRow("2026-10-02T21:00:00.000Z") === "2026-10-03", cairoDayOfRow("2026-10-02T21:00:00.000Z"));
check("c:oct3-not-official", isOfficialSessionDay("2026-10-03") === false, "");
check("c:oct2-friday-not-official", isOfficialSessionDay("2026-10-02") === false, "");
check("c:oct1-thu-official", isOfficialSessionDay("2026-10-01") === true, "");
check("c:oct6-holiday-not-official", isOfficialSessionDay("2026-10-06") === true, "6 Oct 2026 is a NORMAL session (cabinet decree moved the holiday to Thu 8 Oct)");
check("c:oct8-holiday", isOfficialSessionDay("2026-10-08") === false && calendarStatus("2026-10-08") === "holiday", "");
check("c:oct4-sun-official", isOfficialSessionDay("2026-10-04") === true, "");

// (d) missing market-wide session -> hard-stop shape + alert text
const badDay = "2026-10-02"; // Friday
const hardStop = !isOfficialSessionDay(badDay);
check("d:friday-hard-stop", hardStop === true, "");
const alertText = `⛔ توقف صارم — تاريخ الإشارة ${badDay} ليس جلسة رسمية`;
check("d:alert-text-shape", alertText.includes("توقف صارم") && alertText.includes(badDay), "");

// (e) exit for 4-Oct entry from the calendar
const ex = computeExitFromCalendar("2026-10-04");
check("e:exit-oct11", ex.exitDate === "2026-10-11", JSON.stringify(ex));
check("e:held-sessions", JSON.stringify(ex.heldSessions) === JSON.stringify(["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"]), JSON.stringify(ex.heldSessions));
check("e:shortened-flag", ex.shortenedHold === true, "");

// (task7) telegram preview line shape
const line = formatTelegramPreviewLine({ symbol: "UEFM", mom5: 0.111, momSessions: "6/6", liqSessions: "20/20", v20: 4066433, signalClose: 509, verdict: "مقبول" });
check("t7:line-shape", line.includes("UEFM") && line.includes("6/6") && line.includes("20/20") && line.includes("4,066,433") && line.includes("509") && line.includes("مقبول"), line);

// regime def present
check("regime-def", REGIME_DEF.includes("close-to-close") && REGIME_DEF.includes("10-week"), REGIME_DEF);

// ---- CODE REVIEW BATCH (task list 1-11) ----
// 1. schedule: Thursday signal window
function cairoShifted(isoUtc: string): Date {
  return new Date(new Date(isoUtc).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
check("sched:thu-1500-signal", isSignalWindow(cairoShifted("2026-10-01T12:00:00Z")) === true, "");
check("sched:thu-1000-no", isSignalWindow(cairoShifted("2026-10-01T07:00:00Z")) === false, "");
check("sched:sun-no", isSignalWindow(cairoShifted("2026-10-04T07:30:00Z")) === false, "");
check("sched:wed-normal-no", isSignalWindow(cairoShifted("2026-09-30T12:00:00Z")) === false, "normal Wed: Thursday still ahead");
check("sched:wed-7oct-triggers", isSignalWindow(cairoShifted("2026-10-07T12:00:00Z")) === true, "Wed 7 Oct 15:00 Cairo: Thu 8 is a holiday, so Wednesday carries the signal");

// 3. exits: pure source selector matrix
check("exit:cc-wins", JSON.stringify(selectExitPrice(11.82, 11.5, 12.77)) === JSON.stringify({ price: 11.82, source: "candles-open" }), "");
check("exit:mw-fallback", JSON.stringify(selectExitPrice(0, 11.5, 12.77)) === JSON.stringify({ price: 11.5, source: "marketwatch" }), "");
check("exit:last-fallback", JSON.stringify(selectExitPrice(0, 0, 12.77)) === JSON.stringify({ price: 12.77, source: "last_close" }), "");

// 4. market-wide hole detection (26-session trailing window)
const wide26 = lastNOfficialSessions("2026-10-01", 26);
check("hole:full-ok", checkMarketWide(wide26, "2026-10-01", 97, 97).ok === true, "");
const dropOne = wide26.filter((d) => d !== "2026-09-29");
check("hole:missing-session", checkMarketWide(dropOne, "2026-10-01", 97, 97).ok === false, JSON.stringify(checkMarketWide(dropOne, "2026-10-01", 97, 97)));
check("hole:low-coverage", checkMarketWide(wide26, "2026-10-01", 50, 97).ok === false, "");

// 5. telegram retry until delivered marker (stubbed transport)
process.env.TELEGRAM_BOT_TOKEN = "test-token";
process.env.TELEGRAM_CHAT_ID = "123";
let fetchCalls = 0;
(globalThis as any).fetch = async () => {
  fetchCalls++;
  if (fetchCalls < 2) throw new Error("boom");
  return { json: async () => ({ ok: true, result: { message_id: 4242 } }) } as any;
};
const tg1 = await sendTelegram("hello", 3);
check("tg:retry-delivers", tg1.ok === true && tg1.message_id === 4242 && tg1.attempts === 2 && fetchCalls === 2, JSON.stringify(tg1));
(globalThis as any).fetch = async () => { throw new Error("down"); };
const tg2 = await sendTelegram("hello", 3);
check("tg:bounded-fail", tg2.ok === false && tg2.attempts === 3, JSON.stringify(tg2));

// 6. regime: engine close-to-close == independent recompute on the FULL
// scanner universe (fixture file lacks opens; the DB dump has them)
{
  const all = JSON.parse(fs.readFileSync("C:/Users/Mekawey/AppData/Local/Temp/opencode/candles.json", "utf8"));
  const candles = new Map<string, Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>>();
  for (const r of all as Array<{ symbol: string; date: string; o: number; h: number; l: number; c: number; v: number }>) {
    if (r.date > "2026-10-01") continue;
    if (!candles.has(r.symbol)) candles.set(r.symbol, []);
    candles.get(r.symbol)!.push({ date: r.date, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v });
  }
  const eng = computeWeeklyBench(candles);
  // independent close-to-close recompute (plain loops, no engine code)
  const byDay = new Map<string, Array<{ s: string; c: number }>>();
  for (const [s, g] of candles) for (const r of g) {
    const d = cairoDayOfRow(r.date);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push({ s, c: r.close });
  }
  const days = [...byDay.keys()].sort().filter((d) => isOfficialSessionDay(d));
  const starts: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const pd = i === 0 ? 99 : new Date(`${days[i - 1]}T00:00:00Z`).getUTCDay();
    const dd = new Date(`${days[i]}T00:00:00Z`).getUTCDay();
    if (i === 0 || dd < pd) starts.push(days[i]);
  }
  const ind: number[] = [];
  for (let k = 0; k < starts.length - 1; k++) {
    const ma = new Map(byDay.get(starts[k])!.map((x) => [x.s, x.c]));
    let sum = 0, n = 0;
    for (const x of byDay.get(starts[k + 1])!) {
      const ca = ma.get(x.s);
      if (ca === undefined) continue;
      sum += x.c / ca - 1; n++;
    }
    if (n >= REGIME_MIN_SYMBOLS) ind.push(sum / n);
  }
  check("regime:engine-matches-independent", JSON.stringify(eng.map((x) => +x.toFixed(10))) === JSON.stringify(ind.map((x) => +x.toFixed(10))), `eng=${eng.length} ind=${ind.length}`);
  // divergence monitor (task 6): CC and OO must AGREE on the ON/OFF decision
  // on real data — the test fails if the definitions diverge in decision.
  const oo = computeWeeklyBenchOO(candles);
  check("regime:oo-reference-present", Array.isArray(oo) && oo.length > 0, `len=${oo.length}`);
  const ccOn = cumProduct(eng.slice(-10)) > 1;
  const ooOn = cumProduct(oo.slice(-10)) > 1;
  check("regime:definitions-agree", ccOn === ooOn, `CC=${ccOn} OO=${ooOn}`);
}

// 7. phantom Friday row must not change mom5
{
  const uefm = (syms["UEFM"] as Array<{ date: string; close: number; volume: number }>).map((r) => ({ date: r.date, close: r.close, volume: r.volume }));
  const byDay = new Map(uefm.map((r) => [r.date, { close: r.close, volume: r.volume }]));
  const before = screenSymbolCandidate("UEFM", byDay, momSess, liqSess);
  byDay.set("2026-09-18", { close: 9999, volume: 1 }); // Friday phantom with extreme close
  const after = screenSymbolCandidate("UEFM", byDay, momSess, liqSess);
  check("phantom:friday-ignored", (before.cand?.mom5 ?? 0) === (after.cand?.mom5 ?? 0) && (before.reason === "pass" || after.reason === before.reason), JSON.stringify({ b: before.cand?.mom5, a: after.cand?.mom5 }));
}

// 8. unknown calendar days
check("cal:oct6-unknown", calendarStatus("2026-10-06") === "session", "resolved 5 Oct: normal session");
check("cal:oct8-unknown", calendarStatus("2026-10-08") === "holiday", "resolved 5 Oct: cabinet decree 2898/2026");
check("cal:oct6-not-session", isOfficialSessionDay("2026-10-06") === true, "6 Oct trades normally");
check("cal:holding-crosses-unknown", holdingTouchesUnknown("2026-10-04", "2026-10-11") === false, "unknowns resolved; Oct-8 handled as holiday via shortened hold");
check("cal:clean-week-ok", holdingTouchesUnknown("2026-09-27", "2026-10-04") === false, "");

// 10. old claims removed from weekly files
{
  const eng = fs.readFileSync("D:/meky-stock-main/meky-stock-main/src/lib/scalp-dip/momentum-weekly.server.ts", "utf8");
  check("claims:audited-present", eng.includes("AUDITED_WEEKLY_WIN_RATE") && eng.includes("0.58") && eng.includes("0.0189"), "");
  check("claims:old-gone", !eng.includes("1_033") && !eng.includes("2_000") && !eng.includes("3_300") && !eng.includes("14/18 positive weeks"), "");
  const ui = fs.readFileSync("D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx", "utf8");
  check("claims:ui-clean", !ui.includes("BACKTEST_WEEKLY_EGP") && !ui.includes("CURRENT_REGIME_WEEKLY") && ui.includes("AUDITED_WEEKLY_WIN_RATE"), "");
}

// A1: fail-closed whitelist
check("halal:ok-97", assertHalalSet({ count: 97, error: "" }).ok === true, "");
check("halal:reject-empty", assertHalalSet({ count: 0, error: "" }).ok === false, "");
check("halal:reject-unreadable", assertHalalSet({ count: 97, error: "ENOENT" }).ok === false, "");
{
  const lines = fs.readFileSync("D:/meky-stock-main/meky-stock-main/halal-symbols.txt", "utf8").split(/\r?\n/).filter((l) => l.trim());
  check("halal:file-97", lines.length === 97, `lines=${lines.length}`);
}

// A3: volume-0 filler rows never count as present
{
  const uefm = (syms["UEFM"] as Array<{ date: string; close: number; volume: number }>).map((r) => ({ date: r.date, close: r.close, volume: r.volume }));
  const byDay = new Map(uefm.map((r) => [r.date, { close: r.close, volume: r.volume }]));
  byDay.set("2026-09-29", { close: 500, volume: 0 }); // halted-day filler
  const r = screenSymbolCandidate("UEFM", byDay, momSess, liqSess);
  check("volzero:filler-rejected", r.cand === null && r.reason === "momentum-null", r.reason);
}

// A2/A4: scanner validator matrix
{
  const rows = [
    { symbol: "A", open: 10, high: 11, low: 9.5, close: 10.5, volume: 1000 },
    { symbol: "B", open: 20, high: 21, low: 19, close: 20.5, volume: 2000 },
  ];
  const prev = new Map([
    ["A", { o: 9, h: 10, l: 8.5, c: 9.5, v: 900 }],
    ["B", { o: 19, h: 20, l: 18, c: 19.5, v: 1900 }],
  ]);
  check("val:saturday", validateScannerSnapshot(rows, { dateISO: "2026-10-03", cairoMins: 700, prevCount: 2, prevBySymbol: prev }).ok === false, "");
  check("val:holiday-oct8", validateScannerSnapshot(rows, { dateISO: "2026-10-08", cairoMins: 700, prevCount: 2, prevBySymbol: prev }).ok === false, "");
  check("val:preopen", validateScannerSnapshot(rows, { dateISO: "2026-10-04", cairoMins: 600, prevCount: 2, prevBySymbol: prev }).opensValid === false, "");
  check("val:normal", (() => { const v = validateScannerSnapshot(rows, { dateISO: "2026-10-04", cairoMins: 700, prevCount: 2, prevBySymbol: prev }); return v.ok && v.opensValid; })(), "");
  const dup = rows.map((r) => ({ ...r }));
  const prevDup = new Map(rows.map((r) => [r.symbol, { o: r.open, h: r.high, l: r.low, c: r.close, v: r.volume }]));
  check("val:duplicate-day", validateScannerSnapshot(dup, { dateISO: "2026-10-04", cairoMins: 700, prevCount: 2, prevBySymbol: prevDup }).reason.startsWith("duplicate-day"), "");
  check("val:low-coverage", validateScannerSnapshot(rows.slice(0, 1), { dateISO: "2026-10-04", cairoMins: 700, prevCount: 10, prevBySymbol: prev }).reason.startsWith("low-coverage"), "");
  check("val:bad-shape", validateScannerPayload({ foo: 1 }).ok === false, "");
  check("val:empty", validateScannerPayload({ data: [] }).ok === false, "");
  check("val:drift", validateScannerPayload({ data: [{ s: 1, d: [1] }, { s: 2, d: [1] }] }).ok === false, "");
  check("val:payload-ok", validateScannerPayload({ data: [{ s: "EGX:COMI", d: ["COMI", 1, 2, 1, 1.5, 100, 1] }] }).ok === true, "");
}

// A5: 429 retry_after honored + 4096 split
(globalThis as any).fetch = async (url: any, init: any) => {
  const n = ((globalThis as any).__n = ((globalThis as any).__n || 0) + 1);
  if (n === 1) return { status: 429, json: async () => ({ parameters: { retry_after: 1 } }) } as any;
  return { status: 200, json: async () => ({ ok: true, result: { message_id: 777 } }) } as any;
};
(globalThis as any).__n = 0;
const tg3 = await sendTelegram("hi", 3);
check("tg:429-honored", tg3.ok === true && tg3.message_id === 777 && tg3.attempts === 2, JSON.stringify(tg3));
(globalThis as any).fetch = async () => ({ status: 200, json: async () => ({ ok: true, result: { message_id: 1 } }) }) as any;
let splitCalls = 0;
const origFetch = (globalThis as any).fetch;
(globalThis as any).fetch = async (...a: any[]) => { splitCalls++; return origFetch(...a); };
const tg4 = await sendTelegram("x".repeat(5000), 3);
check("tg:split-4096", tg4.ok === true && splitCalls === 2, `calls=${splitCalls}`);

// A1: cross-run alert retry with a fake clock (no DB, no sends).
// T0 persist ok + send fails -> T+30 fails -> T+60 delivered -> T+90 silent.
// Markers: failed[], deliveredAt (run index or -1).
{
  const deliveredAt = 2; // delivered on the 3rd run (T+60)
  let failed = 0;
  let delivered = false;
  let escalated = false;
  const seen: string[] = [];
  for (let run = 0; run < 4; run++) {
    const st = alertSendState({ ready: true, deliveredMarkers: delivered ? 1 : 0, failedMarkers: failed, escalationMarkers: escalated ? 1 : 0 });
    if (run < deliveredAt) {
      if (st !== "send" && st !== "retry") { check("a1:t" + run + "-retries", false, st); break; }
      failed++; // send attempted and failed
      seen.push(st);
    } else if (run === deliveredAt) {
      if (st !== "send" && st !== "retry") { check("a1:t2-delivers", false, st); break; }
      delivered = true;
      seen.push(st + "->delivered");
    } else {
      check("a1:t3-silent", st === "skip", st);
    }
  }
  check("a1:sequence", JSON.stringify(seen) === JSON.stringify(["send", "retry", "retry->delivered"]), JSON.stringify(seen));
  // escalation after N failures, once
  let f2 = 0, esc = 0;
  let states: string[] = [];
  for (let run = 0; run < ALERT_MAX_FAILURES + 2; run++) {
    const st = alertSendState({ ready: true, deliveredMarkers: 0, failedMarkers: f2, escalationMarkers: esc });
    states.push(st);
    if (st === "escalate") esc++;
    else if (st === "send" || st === "retry") f2++;
  }
  check("a1:escalate-once", states[ALERT_MAX_FAILURES] === "escalate" && states[ALERT_MAX_FAILURES + 1] === "skip", JSON.stringify(states));
  check("a1:not-ready-skips", alertSendState({ ready: false, deliveredMarkers: 0, failedMarkers: 0, escalationMarkers: 0 }) === "skip", "");
}

// 11. DATE bucketing identical across display forms
{
  const a = cairoDayOfRow("2026-10-04");
  const b = cairoDayOfRow("2026-10-03T21:00:00.000Z");
  check("date:same-cairo-day", a === b && a === "2026-10-04", `${a} vs ${b}`);
}

console.log(`RESULT pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
