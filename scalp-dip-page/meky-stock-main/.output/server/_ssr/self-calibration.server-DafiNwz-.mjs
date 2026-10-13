import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
const KEY = "auto_threshold_v1";
const DEFAULT_THRESHOLD = 70;
const FALLBACK_THRESHOLD = 55;
let cache = null;
const TTL = 10 * 60 * 1e3;
async function loadAutoThreshold() {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  const { data } = await supabaseAdmin.from("model_state").select("data").eq("key", KEY).maybeSingle();
  const v = data?.data ?? {
    gold: DEFAULT_THRESHOLD,
    silver: FALLBACK_THRESHOLD,
    fittedAt: (/* @__PURE__ */ new Date(0)).toISOString(),
    sampleSize: 0,
    bestWinRate: 0
  };
  cache = { value: v, at: Date.now() };
  return v;
}
async function recomputeAutoThreshold() {
  const { data } = await supabaseAdmin.from("recommendations").select("confidence, outcome, realized_pct").neq("outcome", "pending").in("signal", ["buy", "strong_buy"]).order("created_at", { ascending: false }).limit(500);
  const rows = (data ?? []).filter(
    (r) => typeof r.confidence === "number" && r.outcome
  );
  if (rows.length < 100) {
    const { data: bt } = await supabaseAdmin.from("backtest_trades").select("confidence, pnl_pct, signal, exit_reason").not("exit_reason", "is", null).in("signal", ["buy", "strong_buy"]).order("created_at", { ascending: false }).limit(2e3);
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
  let bestT = DEFAULT_THRESHOLD;
  let bestWr = 0;
  for (let t = 55; t <= 80; t += 1) {
    const subset = rows.filter((r) => r.confidence >= t);
    if (subset.length < 15) continue;
    const wins = subset.filter(
      (r) => r.outcome === "target_hit" || typeof r.realized_pct === "number" && Number(r.realized_pct) > 0
    ).length;
    const wr = wins / subset.length * 100;
    if (wr >= 60 && t >= bestT) {
      bestT = t;
      bestWr = wr;
    } else if (wr > bestWr) {
      bestWr = wr;
    }
  }
  const silver = Math.max(50, bestT - 10);
  const value = {
    gold: bestT,
    silver,
    fittedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sampleSize: rows.length,
    bestWinRate: +bestWr.toFixed(1)
  };
  await supabaseAdmin.from("model_state").upsert({
    key: KEY,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: value,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  cache = { value, at: Date.now() };
  return value;
}
const DEFAULT_CALIB = {
  normal: 1,
  momentum: 1,
  explosive: 1,
  sample_size: 0,
  hit_rate: 0,
  computed_at: (/* @__PURE__ */ new Date(0)).toISOString()
};
function tierOf(predicted) {
  if (predicted >= 5) return "explosive";
  if (predicted >= 2.5) return "momentum";
  return "normal";
}
async function runSelfCalibration() {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1e3).toISOString();
  const { data, error } = await supabaseAdmin.from("recommendations").select("expected_gain_pct, realized_pct, outcome").gte("created_at", since).not("realized_pct", "is", null).in("signal", ["buy", "strong_buy"]).in("outcome", ["target_hit", "stop_hit", "expired"]);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const buckets = {
    normal: { sumPred: 0, sumReal: 0, n: 0 },
    momentum: { sumPred: 0, sumReal: 0, n: 0 },
    explosive: { sumPred: 0, sumReal: 0, n: 0 }
  };
  let hits = 0;
  for (const r of rows) {
    const pred = Math.abs(Number(r.expected_gain_pct ?? 0));
    const real = Number(r.realized_pct ?? 0);
    if (pred <= 0) continue;
    if (r.outcome === "target_hit") hits++;
    const b = buckets[tierOf(pred)];
    b.sumPred += pred;
    b.sumReal += Math.max(0, real);
    b.n += 1;
  }
  const clamp = (x) => Math.max(0.6, Math.min(1.8, x || 1));
  const calib = {
    normal: buckets.normal.n >= 10 ? clamp(buckets.normal.sumReal / Math.max(0.01, buckets.normal.sumPred)) : 1,
    momentum: buckets.momentum.n >= 10 ? clamp(buckets.momentum.sumReal / Math.max(0.01, buckets.momentum.sumPred)) : 1,
    explosive: buckets.explosive.n >= 5 ? clamp(buckets.explosive.sumReal / Math.max(0.01, buckets.explosive.sumPred)) : 1,
    sample_size: rows.length,
    hit_rate: rows.length > 0 ? hits / rows.length : 0,
    computed_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  await supabaseAdmin.from("model_state").upsert({
    key: "target_calibration",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: calib,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  return calib;
}
async function loadTargetCalibration() {
  try {
    const { data } = await supabaseAdmin.from("model_state").select("data").eq("key", "target_calibration").maybeSingle();
    if (!data?.data) return DEFAULT_CALIB;
    return { ...DEFAULT_CALIB, ...data.data };
  } catch {
    return DEFAULT_CALIB;
  }
}
export {
  loadTargetCalibration as a,
  runSelfCalibration as b,
  loadAutoThreshold as l,
  recomputeAutoThreshold as r
};
