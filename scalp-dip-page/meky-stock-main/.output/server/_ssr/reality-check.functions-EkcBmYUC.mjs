import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function bucketOf(c) {
  if (c >= 80) return "80-100";
  if (c >= 70) return "70-79";
  if (c >= 60) return "60-69";
  if (c >= 50) return "50-59";
  return "<50";
}
function summarize(rows) {
  const total = rows.length;
  const wins = rows.filter((r) => r.outcome === "target_hit").length;
  const losses = rows.filter((r) => r.outcome === "stop_hit").length;
  const expired = rows.filter((r) => r.outcome === "expired").length;
  const pcts = rows.map((r) => Number(r.realized_pct ?? 0));
  const avg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
  const winPcts = rows.filter((r) => r.outcome === "target_hit").map((r) => Number(r.realized_pct ?? 0));
  const lossPcts = rows.filter((r) => r.outcome === "stop_hit").map((r) => Number(r.realized_pct ?? 0));
  const avgWin = winPcts.length ? winPcts.reduce((a, b) => a + b, 0) / winPcts.length : 0;
  const avgLoss = lossPcts.length ? lossPcts.reduce((a, b) => a + b, 0) / lossPcts.length : 0;
  const winRate = total ? wins / (wins + losses || 1) : 0;
  const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;
  return {
    total,
    wins,
    losses,
    expired,
    win_rate: Math.round(winRate * 1e3) / 10,
    avg_pct: Math.round(avg * 100) / 100,
    best_pct: pcts.length ? Math.max(...pcts) : 0,
    worst_pct: pcts.length ? Math.min(...pcts) : 0,
    expectancy: Math.round(expectancy * 100) / 100
  };
}
const getRealityCheck_createServerFn_handler = createServerRpc({
  id: "5b05edd4867c22f2d10837166332ffd6cb00c7a46c0084959717d2dfa0d5d49b",
  name: "getRealityCheck",
  filename: "src/lib/reality/reality-check.functions.ts"
}, (opts) => getRealityCheck.__executeServer(opts));
const getRealityCheck = createServerFn({
  method: "GET"
}).handler(getRealityCheck_createServerFn_handler, async () => {
  const rows = [];
  const PAGE = 1e3;
  for (let from = 0; ; from += PAGE) {
    const {
      data,
      error
    } = await supabaseAdmin.from("recommendations").select("symbol, signal, confidence, outcome, realized_pct").order("created_at", {
      ascending: false
    }).range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  const total = rows.length;
  const evaluated = rows.filter((r) => r.outcome !== "pending");
  const pending = total - evaluated.length;
  const overall = summarize(evaluated);
  const signals = Array.from(new Set(evaluated.map((r) => r.signal)));
  const bySignal = signals.map((sig) => ({
    signal: sig,
    ...summarize(evaluated.filter((r) => r.signal === sig))
  })).sort((a, b) => b.total - a.total);
  const buckets = ["80-100", "70-79", "60-69", "50-59", "<50"];
  const byConfidence = buckets.map((b) => {
    const sub = evaluated.filter((r) => bucketOf(r.confidence) === b);
    if (sub.length === 0) return null;
    const s = summarize(sub);
    return {
      bucket: b,
      total: s.total,
      win_rate: s.win_rate,
      avg_pct: s.avg_pct
    };
  }).filter((x) => x !== null);
  const bySym = /* @__PURE__ */ new Map();
  for (const r of evaluated) {
    const arr = bySym.get(r.symbol) ?? [];
    arr.push(r);
    bySym.set(r.symbol, arr);
  }
  const symbolStats = Array.from(bySym.entries()).filter(([, arr]) => arr.length >= 3).map(([symbol, arr]) => {
    const s = summarize(arr);
    return {
      symbol,
      total: s.total,
      win_rate: s.win_rate,
      avg_pct: s.avg_pct
    };
  });
  const topWinners = [...symbolStats].sort((a, b) => b.avg_pct - a.avg_pct).slice(0, 5);
  const topLosers = [...symbolStats].sort((a, b) => a.avg_pct - b.avg_pct).slice(0, 5);
  let verdict;
  if (overall.win_rate >= 55 && overall.avg_pct > 0) {
    verdict = {
      ar: "النظام مربح حالياً ✅ — استمر بحذر وكمّل التحسين",
      severity: "good"
    };
  } else if (overall.win_rate >= 45) {
    verdict = {
      ar: "النظام شبه متعادل ⚠️ — محتاج تحسين قبل ما تتداول بفلوس حقيقية",
      severity: "warn"
    };
  } else {
    verdict = {
      ar: "النظام خاسر حالياً ❌ — ممنوع التداول الحقيقي. لازم نعيد بناء الاستراتيجية",
      severity: "bad"
    };
  }
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    total,
    evaluated: evaluated.length,
    pending,
    overallWinRate: overall.win_rate,
    overallAvgPct: overall.avg_pct,
    totalReturnPct: Math.round(evaluated.reduce((a, r) => a + Number(r.realized_pct ?? 0), 0) * 100) / 100,
    bySignal,
    byConfidence,
    topWinners,
    topLosers,
    verdict
  };
});
export {
  getRealityCheck_createServerFn_handler
};
