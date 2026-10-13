// PREFLIGHT CHECK — one command, every critical point for tomorrow
// Usage: node bt/preflight_tomorrow.cjs
// Prints PASS/FAIL per item. ASCII only. Read-only except nothing.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BT = __dirname;
let pass = 0, fail = 0;
const line = (ok, label, detail) => {
  console.log((ok ? "[PASS] " : "[FAIL] ") + label + (detail ? "  -- " + detail : ""));
  ok ? pass++ : fail++;
};

function cairoParts(d) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t) => p.find(x => x.type === t)?.value ?? "";
  const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dow: wdMap[g("weekday")] ?? 0, hh: parseInt(g("hour"), 10) || 0, mm: parseInt(g("minute"), 10) || 0 };
}
const c = cairoParts(new Date());
const min = c.hh * 60 + c.mm;

(async () => {
  console.log("=== PREFLIGHT @ " + new Date().toISOString() + " | Cairo " + String(c.hh).padStart(2, "0") + ":" + String(c.mm).padStart(2, "0") + " ===");

  // 0) trading day + time window
  const isTrading = [0, 1, 2, 3, 4].includes(c.dow);
  line(isTrading, "today is a trading day", "dow=" + c.dow);
  line(true, "session window 09:50-14:36 Cairo", min < 590 ? "pre-open (correct state)" : (min <= 876 ? "IN SESSION" : "after close"));

  // 1) PC bridge process + lock + armed
  let bridgePid = null;
  try {
    const out = execSync("powershell -NoProfile -Command \"(Get-CimInstance Win32_Process -Filter \\\"Name='node.exe'\\\" | Where-Object { $_.CommandLine -like '*tv_live_bridge*' }).ProcessId\"", { encoding: "utf8" });
    bridgePid = parseInt(out.trim(), 10) || null;
  } catch (e) {}
  line(!!bridgePid, "PC bridge process alive", bridgePid ? ("pid=" + bridgePid) : (min > 876 ? "none — expected after 14:36 close (re-arms 09:55)" : "none"));
  let lockPid = null;
  try { lockPid = parseInt(fs.readFileSync(path.join(BT, "tv_bridge.lock"), "utf8").trim(), 10); } catch (e) {}
  line(bridgePid && lockPid === bridgePid, "bridge lock matches process", "lock=" + lockPid);
  let armed = false;
  try { armed = fs.readFileSync(path.join(BT, "tv_bridge.log"), "utf8").includes("armed: waiting"); } catch (e) {}
  line(armed, "bridge armed line in log");

  // 2) local server + watchdog
  let srv = 0;
  try {
    const res = await fetch("http://localhost:8090/ping", { signal: AbortSignal.timeout(5000) });
    srv = res.status;
  } catch (e) {}
  line(srv === 200, "site on 8090 answers", "http=" + srv);
  let wd = false;
  try {
    const out = execSync("powershell -NoProfile -Command \"@(Get-CimInstance Win32_Process -Filter \\\"Name='node.exe'\\\" | Where-Object { $_.CommandLine -like '*watchdog*' }).Count\"", { encoding: "utf8" });
    wd = parseInt(out.trim(), 10) >= 1;
  } catch (e) {}
  line(wd, "watchdog process alive");

  // 3) scheduled tasks
  try {
    const out = execSync("schtasks /Query /FO CSV /NH", { encoding: "utf8", shell: "cmd.exe" });
    const want = ["EGX_TV_Lag", "EGX_Auto_Morning", "EGX_Auto_EOD", "EGX_Archive_Daily", "EGX_Archive_SundayOpen", "EGX_Data_Integrity"];
    for (const t of want) {
      const row = out.split("\n").find(l => l.includes(t));
      const ready = row && row.split(",").some(x => x.trim().toLowerCase().replace(/"/g, "") === "ready");
      line(!!ready, "task " + t + " Ready");
    }
  } catch (e) { line(false, "scheduled tasks query", e.message.slice(0, 60)); }

  // 4) DB reachable + tables
  try {
    const env = {};
    for (const l of fs.readFileSync(path.join(BT, "..", ".env"), "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/"/g, "");
    }
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 8000 });
    const { rows: a } = await pool.query("SELECT COUNT(*)::int n FROM information_schema.tables WHERE table_name='tv_ticks'");
    line(a[0].n === 1, "tv_ticks table exists");
    const { rows: b } = await pool.query("SELECT COUNT(*)::int n FROM live_ticks WHERE ts::date=CURRENT_DATE");
    line(true, "live_ticks readable", "ticks today: " + b[0].n);
    // supabase bridge freshness: candles for Cairo-today + cron job state
    const { rows: cd } = await pool.query("SELECT COUNT(*)::int n FROM daily_candles WHERE date = (now() AT TIME ZONE 'Africa/Cairo')::date");
    line(cd[0].n >= 200, "daily_candles fresh for Cairo-today", cd[0].n + " symbols");
    await pool.end();
  } catch (e) { line(false, "database reachable", e.message.slice(0, 60)); }

  // 5) disk space (D:)
  try {
    const out = execSync("powershell -NoProfile -Command \"[math]::Round((Get-PSDrive D).Free/1GB)\"", { encoding: "utf8" });
    line(parseInt(out.trim(), 10) > 5, "D: free disk > 5GB", out.trim() + "GB free");
  } catch (e) { line(false, "disk check", e.message.slice(0, 40)); }

  // 6) cloud: the Supabase-internal TV bridge (pg_cron 'tv-bridge', 5s)
  try {
    const env = {};
    for (const l of fs.readFileSync(path.join(BT, "..", ".env"), "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/"/g, "");
    }
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 8000 });
    const { rows } = await pool.query("SELECT schedule, active FROM cron.job WHERE jobname='tv-bridge'");
    const ok = rows.length === 1 && rows[0].active === true && rows[0].schedule === "5 seconds";
    line(ok, "supabase tv-bridge cron active (5 seconds)", rows.length ? rows[0].schedule : "missing");
    await pool.end();
  } catch (e) { line(false, "supabase cron check", e.message.slice(0, 50)); }

  console.log("=== " + pass + " PASS / " + fail + " FAIL ===");
  process.exit(fail > 0 ? 1 : 0);
})();
