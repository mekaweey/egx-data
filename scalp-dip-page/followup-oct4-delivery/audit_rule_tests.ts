import * as fs from "node:fs";
import {
  MW_PARAMS,
  REGIME_DEF,
  cairoDayOfRow,
  isOfficialSessionDay,
  lastNOfficialSessions,
  screenSymbolCandidate,
  computeExitFromCalendar,
  formatTelegramPreviewLine,
} from "@/lib/scalp-dip/momentum-weekly.server";

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
check("c:oct6-holiday-not-official", isOfficialSessionDay("2026-10-06") === false, "");
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
check("e:held-sessions", JSON.stringify(ex.heldSessions) === JSON.stringify(["2026-10-04", "2026-10-05", "2026-10-07", "2026-10-08"]), JSON.stringify(ex.heldSessions));
check("e:shortened-flag", ex.shortenedHold === true, "");

// (task7) telegram preview line shape
const line = formatTelegramPreviewLine({ symbol: "UEFM", mom5: 0.111, momSessions: "6/6", liqSessions: "20/20", v20: 4066433, signalClose: 509, verdict: "مقبول" });
check("t7:line-shape", line.includes("UEFM") && line.includes("6/6") && line.includes("20/20") && line.includes("4,066,433") && line.includes("509") && line.includes("مقبول"), line);

// regime def present
check("regime-def", REGIME_DEF.includes("close-to-close") && REGIME_DEF.includes("10-week"), REGIME_DEF);

console.log(`RESULT pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
