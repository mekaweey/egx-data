/**
 * EGX AI-SUPERVISOR — adaptive monitoring brain (v2, CLEAN single-declaration version)
 * Tier1 = existing watchdog/minute-runner (deterministic, second-level)
 * Tier2 = this script (judgment, window-adaptive)
 * Tier3 = AI escalation via cron reading supervisor_state.json
 */
'use strict';
const fs = require("fs");
const path = require("path");
const http = require("http");
const ROOT = path.join(__dirname, "..");

const env = {};
for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { Pool } = require("pg");

function cairoNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}

async function httpGet(url, ms = 8000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: ms }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("timeout", () => { req.destroy(); resolve({ error: "timeout" }); });
    req.on("error", (e) => resolve({ error: e.message }));
  });
}

(async () => {
  const now = cairoNow();
  const hm = now.getHours() * 60 + now.getMinutes();
  const isWeekend = now.getDay() === 5 || now.getDay() === 6;
  const preOpen = hm >= 8 * 60 + 30 && hm < 9 * 60 + 55;
  const inEntry = hm >= 9 * 60 + 55 && hm <= 10 * 60 + 30;
  const inSession = hm >= 10 * 60 && hm <= 14 * 60 + 30;
  const inEOD = hm >= 14 * 60 + 15 && hm <= 14 * 60 + 50;

  const critical = [];
  const warns = [];
  const oks = [];

  const home = await httpGet("http://localhost:8090/");
  if (home.status === 200) oks.push("الموقع شغال");
  else critical.push(`الموقع واقف! (status ${home.status || home.error})`);

  const p = new Pool({ connectionString: env.DATABASE_URL });
  try {
    const flow = await p.query(`
      SELECT max(captured_at) snap_last FROM marketwatch_snapshots`);
    const snapLast = flow.rows[0].snap_last;
    const snapAgeMin = snapLast ? (Date.now() - new Date(snapLast).getTime()) / 60000 : null;

    if (inSession || inEOD || inEntry) {
      if (snapAgeMin === null) critical.push("مفيش أي snapshots النهارده والسوق مفتوح!");
      else if (snapAgeMin > 10 && hm < 14 * 60 + 35) critical.push(`البيانات اللحظية واقفة من ${snapAgeMin.toFixed(0)} دقيقة!`);
      else if (snapAgeMin > 5) warns.push(`البيانات متأخرة ${snapAgeMin.toFixed(0)} دقيقة`);
      else oks.push(`البيانات لحظية (آخر لقطة قبل ${snapAgeMin.toFixed(0)} دقيقة)`);
    } else {
      oks.push(`خارج الجلسة — آخر لقطة ${snapLast ? new Date(snapLast).toLocaleString("ar-EG") : "none"}`);
    }

    const pos = await p.query(`
      SELECT symbol, entry_price, sl_price FROM paper_trades
      WHERE strategy='scalp-dip' AND status='open'`);
    let oldSL = 0;
    for (const r of pos.rows) {
      const slPct = (Number(r.sl_price) / Number(r.entry_price) - 1) * 100;
      if (Math.abs(slPct + 8) < 0.5) oldSL++;
    }
    if (oldSL > 0 && pos.rows.length > 0) {
      if (oldSL === pos.rows.length) warns.push(`كل المراكز (${oldSL}) لسه على SL القديم −8% — متابعة`);
      else critical.push(`${oldSL} مركز من ${pos.rows.length} على SL قديم −8% (تضارب تكوين!)`);
    } else if (pos.rows.length) oks.push(`${pos.rows.length} مركز مفتوح — SL سليمة`);

    const dup = await p.query(`
      SELECT symbol, count(*) c FROM paper_trades
      WHERE strategy='scalp-dip' AND status='open' GROUP BY 1 HAVING count(*) > 1`);
    if (dup.rows.length) critical.push(`صفقات مكررة: ${dup.rows.map((r) => r.symbol + "x" + r.c).join(", ")}`);
    else oks.push("مفيش صفقات مكررة");

    if ((inEntry || (hm > 10 * 60 + 15 && hm < 14 * 60)) && !isWeekend) {
      const sig = await p.query("SELECT count(*) c FROM scalp_dip_signals WHERE scan_date = CURRENT_DATE");
      if (Number(sig.rows[0].c) === 0) {
        if (hm > 10 * 60 + 30) critical.push("عدت 10:30 ومفيش إشارات النهارده — الـ runner ما اشتغلش!");
      } else oks.push(`إشارات النهارده: ${sig.rows[0].c}`);
    }

    if (inEOD) {
      const stale = await p.query(`
        SELECT count(*) c FROM paper_trades
        WHERE strategy='scalp-dip' AND status='open' AND trade_date <= CURRENT_DATE - 5`);
      if (Number(stale.rows[0].c) > 0) critical.push(`${stale.rows[0].c} صفقة عدت 4+ أيام مفتوحة — الخروج ما اتنفذش!`);
      else oks.push("الخروج اليومي اتنفذ");
    }

    const arch = await p.query("SELECT count(*) c, max(published_at) mx FROM mubasher_news");
    const archHours = arch.rows[0].mx ? (Date.now() - new Date(arch.rows[0].mx).getTime()) / 3600000 : null;
    if (archHours !== null && archHours > 30) warns.push(`أرشيف الأخبار قديم (${archHours.toFixed(0)} ساعة)`);
    else oks.push(`أرشيف الأخبار محدث (${arch.rows[0].c} مقال)`);

    const jobs = await p.query("SELECT jobname, active FROM cron.job").catch(() => ({ rows: [] }));
    const dead = jobs.rows.filter((j) => j.active === false);
    if (dead.length) warns.push(`cron jobs متوقفة: ${dead.map((j) => j.jobname).join(", ")}`);
    else oks.push(`${jobs.rows.length} cron jobs نشطة`);

    const size = await p.query("SELECT pg_database_size(current_database()) b");
    const mb = Number(size.rows[0].b) / 1048576;
    if (mb > 470) critical.push(`الداتابيز ${mb.toFixed(0)} MB — خطر امتلاء!`);
    else if (mb > 420) warns.push(`الداتابيز ${mb.toFixed(0)} MB — قربت من الحد`);
    else oks.push(`الداتابيز ${mb.toFixed(0)} MB سليمة`);
  } catch (e) {
    critical.push(`فشل فحص الداتابيز: ${e.message}`);
  } finally {
    try { await p.end(); } catch {}
  }

  const level = critical.length ? "CRITICAL" : warns.length ? "WARN" : "OK";
  const verdict = { level, time: now.toISOString(), window: preOpen ? "pre-open" : inEntry ? "entry" : inEOD ? "eod" : inSession ? "session" : "off", critical, warns, oks };
  fs.writeFileSync(path.join(ROOT, "supervisor_state.json"), JSON.stringify(verdict, null, 1));
  fs.appendFileSync(path.join(ROOT, "supervisor_history.jsonl"), JSON.stringify(verdict) + "\n");

  const winName = preOpen ? "قبل الافتتاح" : inEntry ? "نافذة الدخول" : inEOD ? "نافذة الخروج" : inSession ? "الجلسة" : "خارج الجلسة";
  console.log(`=== المشرف الذكي — ${now.toLocaleTimeString("ar-EG")} (${winName}) ===`);
  if (critical.length) { console.log("CRITICAL:"); critical.forEach((c) => console.log("  " + c)); }
  if (warns.length) { console.log("WARN:"); warns.forEach((w) => console.log("  " + w)); }
  if (oks.length) { console.log("OK:"); oks.forEach((o) => console.log("  " + o)); }
  console.log(`VERDICT: ${level}`);
  process.exit(critical.length ? 2 : warns.length ? 1 : 0);
})().catch((e) => { console.error("SUPERVISOR FATAL:", e.message); process.exit(3); });
