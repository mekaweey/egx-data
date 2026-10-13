import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const lastAlertAt = /* @__PURE__ */ new Map();
const DEDUP_MS = 5 * 6e4;
async function checkL2CoverageAndAlert(symbol, opts = {}) {
  const windowSec = opts.windowSec ?? 60;
  const dry = opts.dry === true;
  try {
    const since = new Date(Date.now() - windowSec * 1e3).toISOString();
    const { count } = await supabaseAdmin.from("orderbook_snapshots").select("id", { count: "exact", head: true }).eq("symbol", symbol).gte("ts", since);
    const n = count ?? 0;
    if (n > 0) {
      return { symbol, snapshots_last_60s: n, alerted: false, reason: "covered" };
    }
    const now = Date.now();
    const last = lastAlertAt.get(symbol) ?? 0;
    if (now - last < DEDUP_MS) {
      return { symbol, snapshots_last_60s: 0, alerted: false, reason: "dedup", dedup_hit: true };
    }
    if (!dry) {
      lastAlertAt.set(symbol, now);
      try {
        const { sendTelegram } = await import("./telegram.server-D6g8flro.mjs").then((n2) => n2.t);
        await sendTelegram(
          `<b>🚨 افتح L2 على <code>${symbol}</code> دلوقتي</b>

فيه إشارة scalp لسه فتحت على السهم ده، بس مفيش L2 snapshot في آخر ${windowSec} ثانية.
افتح تاب Thunder على <b>${symbol}</b> فورًا عشان الصفقات الجاية تتفتح بأمان.`
        );
      } catch {
      }
    }
    return { symbol, snapshots_last_60s: 0, alerted: !dry, reason: "no_recent_snapshot" };
  } catch (e) {
    return { symbol, snapshots_last_60s: 0, alerted: false, reason: `error:${e.message?.slice(0, 80)}` };
  }
}
export {
  checkL2CoverageAndAlert
};
