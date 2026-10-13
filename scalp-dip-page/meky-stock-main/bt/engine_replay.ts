import * as fs from "node:fs";
import {
  MW_PARAMS,
  lastNOfficialSessions,
  isOfficialSessionDay,
  screenSymbolCandidate,
} from "@/lib/scalp-dip/momentum-weekly.server";

const rows = JSON.parse(fs.readFileSync("C:/Users/Mekawey/AppData/Local/Temp/opencode/candles.json", "utf8"));
const halal: string[] = fs.readFileSync("D:/meky-stock-main/meky-stock-main/halal-symbols.txt", "utf8")
  .split(/\r?\n/).map((l) => l.trim().toUpperCase()).filter(Boolean);
const px = new Map<string, Map<string, any>>();
for (const r of rows) {
  if (!px.has(r.symbol)) px.set(r.symbol, new Map());
  px.get(r.symbol)!.set(r.date, r);
}
// entry Sundays Apr 26 - Sep 27 2026
const sundays: string[] = [];
{
  const d = new Date("2026-04-26T00:00:00Z");
  const end = new Date("2026-09-27T00:00:00Z");
  while (d <= end) {
    if (d.getUTCDay() === 0) sundays.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
}
const sessSet = new Set<string>();
for (const [, m] of px) for (const dt of m.keys()) sessSet.add(dt);
// official sessions that actually have data (documented A7 basis)
const allOff: string[] = [];
{
  const d = new Date("2026-03-25T00:00:00Z");
  const end = new Date("2026-10-04T00:00:00Z");
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    if (isOfficialSessionDay(iso) && sessSet.has(iso)) allOff.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}
const sess = allOff;
// empirical sessions (>=176 rows) built inline
const counts = new Map<string, number>();
for (const [, m] of px) for (const dt of m.keys()) counts.set(dt, (counts.get(dt) || 0) + 1);

function crosses(d: string): boolean { return d >= "2026-09-13" && d <= "2026-09-20"; }

const out: any[] = [];
for (const sun of sundays) {
  const prior = sess.filter((x) => x < sun);
  if (!prior.length) continue;
  const sig = prior[prior.length - 1];
  const nxt = sess.filter((x) => x >= sun);
  if (!nxt.length) continue;
  const ed = nxt[0];
  const esun = new Date(ed + "T00:00:00Z");
  esun.setUTCDate(esun.getUTCDate() + (7 - ((esun.getUTCDay() + 1) % 7)));
  const ext = sess.filter((x) => x >= esun.toISOString().slice(0, 10));
  if (!ext.length) continue;
  const xd = ext[0];
  if (crosses(sig) || crosses(ed) || crosses(xd)) { out.push({ sun, sig, ed, xd, skip: "sep17" }); continue; }
  const back = sess.filter((x) => x <= sig).slice(-26);
  if (back.some(crosses)) { out.push({ sun, sig, ed, xd, skip: "sep17-window" }); continue; }
  const momSess = lastNOfficialSessions(sig, 6);
  const liqSess = lastNOfficialSessions(sig, 20);
  const cands: Array<{ s: string; mom: number; v20: number; lastc: number }> = [];
  for (const s of halal) {
    const m = px.get(s);
    if (!m) continue;
    const byDay = new Map<string, { close: number; volume: number }>();
    for (const [dt, r] of m) byDay.set(dt, { close: r.c, volume: r.v });
    const r = screenSymbolCandidate(s, byDay, momSess, liqSess);
    if (!r.cand) continue;
    cands.push({ s, mom: r.cand.mom5, v20: r.cand.v20_money, lastc: r.cand.last_close });
  }
  cands.sort((a, b) => b.v20 - a.v20);
  const picks = cands.slice(0, 100).filter((c) => c.mom >= 0.08 && c.mom <= 0.45).sort((a, b) => b.mom - a.mom).slice(0, 5);
  const wk: any[] = [];
  let tot = 0;
  for (const p of picks) {
    const ro = px.get(p.s)?.get(ed);
    const rx = px.get(p.s)?.get(xd);
    const o = ro?.o || 0, xo = rx?.o || 0;
    if (!(o > 0 && xo > 0)) { wk.push({ s: p.s, st: "NO-DATA" }); continue; }
    const gap = o / p.lastc - 1;
    if (gap < -0.03 || gap > 0.02) { wk.push({ s: p.s, st: "GAP-SKIP" }); continue; }
    const r = xo / o - 1 - 0.0005;
    tot += r * 20000;
    wk.push({ s: p.s, st: "ok", r: +r.toFixed(5) });
  }
  out.push({ sun, sig, ed, xd, picks: wk, weekly: +(tot / 100000).toFixed(5) });
}
fs.writeFileSync("C:/Users/Mekawey/AppData/Local/Temp/opencode/engine_replay.json", JSON.stringify(out));
console.log("WEEKS=" + out.length + " done");
