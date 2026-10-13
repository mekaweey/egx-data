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
function cairoDate(d = /* @__PURE__ */ new Date()) {
  return new Date(d.toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
}
const runDecisionEngine_createServerFn_handler = createServerRpc({
  id: "9f28297d28e79acffc175c7937bd59fcdf22f0ce32145ad870f5489e3ded2022",
  name: "runDecisionEngine",
  filename: "src/lib/decision-engine.functions.ts"
}, (opts) => runDecisionEngine.__executeServer(opts));
const runDecisionEngine = createServerFn({
  method: "POST"
}).inputValidator((data) => ({
  days: Math.max(3, Math.min(60, data?.days ?? 14))
})).handler(runDecisionEngine_createServerFn_handler, async ({
  data
}) => {
  const days = data.days;
  const today = cairoDate();
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const {
    data: trades
  } = await supabaseAdmin.from("paper_trades").select("trade_date, exit_reason, pnl_pct, status").eq("strategy", "scalp-dip").gte("trade_date", since).lte("trade_date", today);
  const closed = (trades ?? []).filter((t) => t.status === "closed" && t.pnl_pct != null);
  const total = closed.length;
  const tpHits = closed.filter((t) => t.exit_reason === "tp" || t.exit_reason === "TP").length;
  const slHits = closed.filter((t) => (t.exit_reason ?? "").toLowerCase().includes("sl") || t.exit_reason === "stop").length;
  const trailHits = closed.filter((t) => (t.exit_reason ?? "").toLowerCase().includes("trail")).length;
  const wins = closed.filter((t) => Number(t.pnl_pct) > 0).length;
  const winRate = total ? wins / total : 0;
  const avgWin = total ? closed.filter((t) => Number(t.pnl_pct) > 0).reduce((s, t) => s + Number(t.pnl_pct), 0) / Math.max(1, wins) : 0;
  const avgLoss = total ? closed.filter((t) => Number(t.pnl_pct) < 0).reduce((s, t) => s + Number(t.pnl_pct), 0) / Math.max(1, total - wins) : 0;
  const {
    data: misses
  } = await supabaseAdmin.from("missed_signals").select("reason, candidate_price, tp_price, sl_price, ts, symbol, trade_date").gte("trade_date", since).lte("trade_date", today);
  const recentSince = new Date(Date.now() - 3 * 864e5).toISOString();
  const recent = (misses ?? []).filter((m) => m.ts >= recentSince);
  const recentSyms = Array.from(new Set(recent.map((m) => m.symbol)));
  const ticksBySym = /* @__PURE__ */ new Map();
  if (recentSyms.length) {
    const {
      data: ticks
    } = await supabaseAdmin.from("live_ticks").select("symbol, price, ts").in("symbol", recentSyms).gte("ts", recentSince).eq("source", "thunder_ext").limit(5e4);
    for (const t of ticks ?? []) {
      if (!ticksBySym.has(t.symbol)) ticksBySym.set(t.symbol, []);
      ticksBySym.get(t.symbol).push({
        p: Number(t.price),
        t: new Date(t.ts).getTime()
      });
    }
  }
  function scoreMiss(m) {
    const start = new Date(m.ts).getTime();
    const arr = (ticksBySym.get(m.symbol) ?? []).filter((x) => x.t >= start && x.t <= start + 60 * 6e4);
    if (arr.length < 3 || m.candidate_price == null) return "unknown";
    for (const x of arr) {
      if (m.tp_price != null && x.p >= Number(m.tp_price)) return "win";
      if (m.sl_price != null && x.p <= Number(m.sl_price)) return "lose";
    }
    return "flat";
  }
  const prebuy = {
    total: 0,
    win: 0,
    lose: 0
  };
  for (const m of recent) {
    if (m.reason !== "prebuy_filter") continue;
    const o = scoreMiss(m);
    prebuy.total++;
    if (o === "win") prebuy.win++;
    if (o === "lose") prebuy.lose++;
  }
  const {
    data: hfLogs
  } = await supabaseAdmin.from("smart_exit_log").select("trade_date, symbol, ts, price, entry_price, pnl_pct, shadow, rule").eq("rule", "HARD_FLOOR").eq("shadow", true).gte("trade_date", since);
  const hfSyms = Array.from(new Set((hfLogs ?? []).map((r) => r.symbol)));
  const shadowSince = new Date(Date.now() - days * 864e5).toISOString();
  const hfTicks = /* @__PURE__ */ new Map();
  if (hfSyms.length) {
    const {
      data: ticks
    } = await supabaseAdmin.from("live_ticks").select("symbol, price, ts").in("symbol", hfSyms).gte("ts", shadowSince).eq("source", "thunder_ext").limit(5e4);
    for (const t of ticks ?? []) {
      if (!hfTicks.has(t.symbol)) hfTicks.set(t.symbol, []);
      hfTicks.get(t.symbol).push({
        p: Number(t.price),
        t: new Date(t.ts).getTime()
      });
    }
  }
  let hfRight = 0, hfTotal = 0;
  for (const r of hfLogs ?? []) {
    if (r.entry_price == null) continue;
    hfTotal++;
    const start = new Date(r.ts).getTime();
    const arr = (hfTicks.get(r.symbol) ?? []).filter((x) => x.t >= start && x.t <= start + 30 * 6e4);
    const recoveredAbove = arr.some((x) => (x.p - Number(r.entry_price)) / Number(r.entry_price) >= -0.01);
    if (!recoveredAbove) hfRight++;
  }
  const hfAcc = hfTotal ? hfRight / hfTotal : 0;
  const {
    data: settings
  } = await supabaseAdmin.from("strategy_settings").select("key, enabled");
  const currentSetting = (k) => (settings ?? []).find((s) => s.key === k)?.enabled ?? null;
  const drafts = [];
  if (prebuy.total >= 5) {
    const netAvoided = prebuy.lose - prebuy.win;
    const helping = netAvoided > 0;
    const conf = Math.min(1, Math.abs(netAvoided) / Math.max(3, prebuy.total));
    const current = currentSetting("scalp-dip-prebuy-volume-filter");
    const suggest = helping ? true : false;
    if (current !== null && current !== suggest) {
      drafts.push({
        category: "prebuy_filter",
        target_key: "scalp-dip-prebuy-volume-filter",
        current_value: String(current),
        suggested_value: String(suggest),
        action_type: "toggle",
        rationale: helping ? `الفلتر يتفادى ${prebuy.lose} خسارة مقابل ${prebuy.win} فرصة ضاعت — نافع، خليه شغّال.` : `الفلتر يفوّت ${prebuy.win} فرصة مقابل ${prebuy.lose} خسارة اتفاديت — بيقطع فرص أكثر مما يحمي.`,
        evidence: {
          prebuy_stats: prebuy,
          days_scored: 3
        },
        confidence: conf
      });
    }
  }
  if (hfTotal >= 5) {
    const shadowOn = currentSetting("scalp-dip-smart-exit-shadow") ?? true;
    if (shadowOn && hfAcc >= 0.7) {
      drafts.push({
        category: "shadow_promotion",
        target_key: "scalp-dip-smart-exit-shadow",
        current_value: "true (shadow)",
        suggested_value: "false (live)",
        action_type: "toggle",
        rationale: `قاعدة HARD_FLOOR دقّتها ${(hfAcc * 100).toFixed(0)}% (${hfRight}/${hfTotal}) — جاهزة تخرج من shadow mode.`,
        evidence: {
          hard_floor_accuracy: hfAcc,
          hard_floor_right: hfRight,
          hard_floor_total: hfTotal
        },
        confidence: Math.min(1, (hfAcc - 0.5) * 2)
      });
    } else if (shadowOn && hfAcc < 0.5) {
      drafts.push({
        category: "shadow_promotion",
        target_key: "scalp-dip-smart-exit",
        current_value: String(currentSetting("scalp-dip-smart-exit") ?? true),
        suggested_value: "false",
        action_type: "toggle",
        rationale: `قاعدة HARD_FLOOR دقّتها ${(hfAcc * 100).toFixed(0)}% فقط — الأفضل تعطيلها.`,
        evidence: {
          hard_floor_accuracy: hfAcc,
          hard_floor_right: hfRight,
          hard_floor_total: hfTotal
        },
        confidence: Math.min(1, (0.5 - hfAcc) * 2)
      });
    }
  }
  if (total >= 10) {
    const tpRate = tpHits / total;
    if (tpRate >= 0.65) {
      drafts.push({
        category: "tp_target",
        target_key: "TP_PCT",
        current_value: "2.0%",
        suggested_value: "2.5%",
        action_type: "advisory",
        rationale: `TP بيتحقق في ${(tpRate * 100).toFixed(0)}% من الصفقات — ممكن نرفع الهدف لـ 2.5% نلاقي ربح أكبر.`,
        evidence: {
          tp_hits: tpHits,
          sl_hits: slHits,
          trail_hits: trailHits,
          total,
          win_rate: winRate
        },
        confidence: Math.min(1, (tpRate - 0.5) * 2)
      });
    } else if (tpRate < 0.35 && trailHits > tpHits) {
      drafts.push({
        category: "tp_target",
        target_key: "TP_PCT",
        current_value: "2.0%",
        suggested_value: "1.5%",
        action_type: "advisory",
        rationale: `TP بيتحقق ${(tpRate * 100).toFixed(0)}% بس، والـ trailing stop بياخد أغلب الخروج — قلّل TP لـ 1.5% تحسّن معدل التحقيق.`,
        evidence: {
          tp_hits: tpHits,
          sl_hits: slHits,
          trail_hits: trailHits,
          total,
          win_rate: winRate
        },
        confidence: Math.min(1, (0.35 - tpRate) * 2)
      });
    }
  }
  if (total >= 10) {
    const slRate = slHits / total;
    if (slRate > 0.25) {
      drafts.push({
        category: "sl_stop",
        target_key: "SL_PCT",
        current_value: "0.6%",
        suggested_value: "1.0%",
        action_type: "advisory",
        rationale: `SL بيضرب في ${(slRate * 100).toFixed(0)}% من الصفقات — SL 0.6% ضيق جداً؛ جرّب 1.0%.`,
        evidence: {
          sl_hits: slHits,
          total,
          win_rate: winRate,
          avg_loss_pct: avgLoss
        },
        confidence: Math.min(1, (slRate - 0.25) * 3)
      });
    }
  }
  const upserted = [];
  for (const d of drafts) {
    await supabaseAdmin.from("decision_suggestions").delete().eq("status", "pending").eq("category", d.category).eq("target_key", d.target_key ?? "");
    const {
      data: row,
      error
    } = await supabaseAdmin.from("decision_suggestions").insert({
      category: d.category,
      target_key: d.target_key,
      current_value: d.current_value,
      suggested_value: d.suggested_value,
      action_type: d.action_type,
      rationale: d.rationale,
      evidence: d.evidence,
      evidence_days: days,
      confidence: +d.confidence.toFixed(3)
    }).select("id").single();
    if (!error && row) upserted.push(row.id);
  }
  return {
    ok: true,
    days,
    stats: {
      paper_trades_total: total,
      wins,
      win_rate: +winRate.toFixed(3),
      tp_hits: tpHits,
      sl_hits: slHits,
      trail_hits: trailHits,
      avg_win_pct: +avgWin.toFixed(4),
      avg_loss_pct: +avgLoss.toFixed(4),
      prebuy_scored: prebuy,
      hard_floor_shadow: {
        total: hfTotal,
        right: hfRight,
        accuracy: +hfAcc.toFixed(3)
      }
    },
    suggestions_created: upserted.length
  };
});
const listDecisionSuggestions_createServerFn_handler = createServerRpc({
  id: "60005308d8d79969383950cb24ddf438f3bde1e9211d63caf626702d5ff70d11",
  name: "listDecisionSuggestions",
  filename: "src/lib/decision-engine.functions.ts"
}, (opts) => listDecisionSuggestions.__executeServer(opts));
const listDecisionSuggestions = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  status: data?.status
})).handler(listDecisionSuggestions_createServerFn_handler, async ({
  data
}) => {
  let q = supabaseAdmin.from("decision_suggestions").select("*").order("created_at", {
    ascending: false
  }).limit(200);
  if (data.status) q = q.eq("status", data.status);
  const {
    data: rows,
    error
  } = await q;
  if (error) throw new Error(error.message);
  return {
    rows: rows ?? []
  };
});
const applyDecisionSuggestion_createServerFn_handler = createServerRpc({
  id: "45c3f4d3de703a3a86610fffd645a972e2ec818f0b61ff70403281794029a812",
  name: "applyDecisionSuggestion",
  filename: "src/lib/decision-engine.functions.ts"
}, (opts) => applyDecisionSuggestion.__executeServer(opts));
const applyDecisionSuggestion = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(applyDecisionSuggestion_createServerFn_handler, async ({
  data
}) => {
  const {
    data: row,
    error
  } = await supabaseAdmin.from("decision_suggestions").select("*").eq("id", data.id).single();
  if (error || !row) throw new Error(error?.message ?? "not found");
  if (row.status !== "pending") throw new Error("already handled");
  if (row.action_type !== "toggle" || !row.target_key) {
    throw new Error("هذا الاقتراح استشاري فقط ويتطلب تعديل الكود يدوياً.");
  }
  row.suggested_value === "true" || row.suggested_value?.startsWith("false (live)") === false && row.suggested_value === "true";
  let enabled;
  if (row.suggested_value === "true") enabled = true;
  else if (row.suggested_value === "false") enabled = false;
  else if (row.suggested_value?.includes("false")) enabled = false;
  else if (row.suggested_value?.includes("true")) enabled = true;
  else throw new Error(`تعذر تفسير القيمة المقترحة: ${row.suggested_value}`);
  const {
    error: upErr
  } = await supabaseAdmin.from("strategy_settings").upsert({
    key: row.target_key,
    enabled,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    onConflict: "key"
  });
  if (upErr) throw new Error(upErr.message);
  await supabaseAdmin.from("decision_suggestions").update({
    status: "applied",
    applied_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id);
  return {
    ok: true,
    key: row.target_key,
    enabled
  };
});
const rejectDecisionSuggestion_createServerFn_handler = createServerRpc({
  id: "3e28ac361a5a6447c80d39738ac9076fbc64c197b520dd015ff137da78172bc1",
  name: "rejectDecisionSuggestion",
  filename: "src/lib/decision-engine.functions.ts"
}, (opts) => rejectDecisionSuggestion.__executeServer(opts));
const rejectDecisionSuggestion = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(rejectDecisionSuggestion_createServerFn_handler, async ({
  data
}) => {
  const {
    error
  } = await supabaseAdmin.from("decision_suggestions").update({
    status: "rejected",
    rejected_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id).eq("status", "pending");
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  applyDecisionSuggestion_createServerFn_handler,
  listDecisionSuggestions_createServerFn_handler,
  rejectDecisionSuggestion_createServerFn_handler,
  runDecisionEngine_createServerFn_handler
};
