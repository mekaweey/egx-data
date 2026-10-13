'use strict';
const fs = require("fs");
const path = require("path");
const ROOT = "D:/meky-stock-main/meky-stock-main";
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { Pool } = require("pg");
const p = new Pool({ connectionString: env.DATABASE_URL });
const q = async (s) => (await p.query(s)).rows;
(async () => {
  console.log("live_ticks last 5:", JSON.stringify(await q("SELECT ts,symbol,source FROM live_ticks ORDER BY ts DESC LIMIT 5")));
  console.log("ticks by hour today:", JSON.stringify(await q("SELECT to_char(date_trunc('hour', ts AT TIME ZONE 'Africa/Cairo'),'HH24:00') h, count(*) c FROM live_ticks WHERE ts >= now() - interval '8 hours' GROUP BY 1 ORDER BY 1")));
  console.log("snapshots last 20h:", JSON.stringify(await q("SELECT count(*) c, max(captured_at) mx FROM marketwatch_snapshots WHERE captured_at >= now() - interval '20 hours'")));
  console.log("signals today:", JSON.stringify(await q("SELECT count(*) c FROM scalp_dip_signals WHERE scan_date = CURRENT_DATE")));
  console.log("open trades:", JSON.stringify(await q("SELECT symbol, trade_date, entry_price, sl_price FROM paper_trades WHERE strategy='scalp-dip' AND status='open' ORDER BY trade_date")));
  await p.end();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
