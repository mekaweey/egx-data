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
const BIN_EDGES = [30, 40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
let cached = null;
const TTL_MS = 5 * 60 * 1e3;
async function loadIsotonicCalibration() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const { data } = await supabaseAdmin.from("recommendations").select("confidence, outcome, realized_pct").neq("outcome", "pending").order("created_at", { ascending: false }).limit(1e3);
  const rows = (data ?? []).filter(
    (r) => typeof r.confidence === "number" && r.outcome != null
  );
  if (rows.length < 200) {
    const { data: bt } = await supabaseAdmin.from("backtest_trades").select("confidence, pnl_pct, exit_reason").not("exit_reason", "is", null).order("created_at", { ascending: false }).limit(2e3);
    for (const r of bt ?? []) {
      if (typeof r.confidence !== "number") continue;
      const realized = Number(r.pnl_pct ?? 0);
      rows.push({
        confidence: r.confidence,
        outcome: realized > 0 ? "target_hit" : "stop_hit",
        realized_pct: realized
      });
    }
  }
  const bins = [];
  for (let i = 0; i < BIN_EDGES.length - 1; i++) {
    const low = BIN_EDGES[i];
    const high = BIN_EDGES[i + 1];
    const inBin = rows.filter((r) => r.confidence >= low && r.confidence < high);
    const wins = inBin.filter(
      (r) => r.outcome === "target_hit" || typeof r.realized_pct === "number" && Number(r.realized_pct) > 0
    ).length;
    const n = inBin.length;
    bins.push({ low, high, n, wins, accuracy: n > 0 ? wins / n * 100 : (low + high) / 2 });
  }
  for (let i = 1; i < bins.length; i++) {
    if (bins[i].n >= 5 && bins[i - 1].n >= 5 && bins[i].accuracy < bins[i - 1].accuracy) {
      const totalN = bins[i].n + bins[i - 1].n;
      const merged = (bins[i].accuracy * bins[i].n + bins[i - 1].accuracy * bins[i - 1].n) / totalN;
      bins[i].accuracy = merged;
      bins[i - 1].accuracy = merged;
    }
  }
  const totalSamples = rows.length;
  const map = {
    fitted: totalSamples >= 50,
    sampleSize: totalSamples,
    bins
  };
  cached = { value: map, at: Date.now() };
  return map;
}
function applyIsotonic(raw, map) {
  if (!map.fitted) return raw;
  const r = Math.max(30, Math.min(95, raw));
  const bin = map.bins.find((b) => r >= b.low && r < b.high) ?? map.bins[map.bins.length - 1];
  if (bin.n < 5) return r;
  const calibrated = bin.accuracy * 0.6 + r * 0.4;
  let out = Math.round(calibrated);
  if (out < r) {
    out = Math.max(r - 3, out);
  }
  return Math.max(30, Math.min(95, out));
}
export {
  applyIsotonic,
  loadIsotonicCalibration
};
