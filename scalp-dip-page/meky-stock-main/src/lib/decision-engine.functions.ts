import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Decision Engine — analyzes recent trading data (paper_trades, missed_signals,
 * smart_exit_log, trade_events) and generates data-driven suggestions to tune
 * the scalp-dip strategy. Suggest-only by default: nothing is auto-applied.
 *
 * Suggestion categories:
 *  - prebuy_filter       : is the pre-buy volume filter helping or hurting?
 *  - shadow_promotion    : should smart-exit be promoted from shadow to live?
 *  - tp_target           : is the 2% TP well-calibrated?
 *  - sl_stop             : is the 0.6% SL too tight / too wide?
 *
 * Applyable now via strategy_settings toggles:
 *  - scalp-dip-prebuy-volume-filter
 *  - scalp-dip-smart-exit-shadow (disable = promote to live)
 *  - scalp-dip-smart-exit
 */

type SuggestionDraft = {
  category: string;
  target_key: string | null;
  current_value: string | null;
  suggested_value: string | null;
  action_type: "toggle" | "advisory";
  rationale: string;
  evidence: Record<string, unknown>;
  confidence: number; // 0..1
};

function cairoDate(d = new Date()) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
}

/** Run analysis over the last N trading days and upsert suggestions. */
export const runDecisionEngine = createServerFn({ method: "POST" })
  .inputValidator((data: { days?: number } | undefined) => ({ days: Math.max(3, Math.min(60, data?.days ?? 14)) }))
  .handler(async ({ data }) => {
    const days = data.days;
    const today = cairoDate();
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

    // ---- 1. paper_trades summary ----
    const { data: trades } = await supabaseAdmin
      .from("paper_trades")
      .select("trade_date, exit_reason, pnl_pct, status")
      .eq("strategy", "scalp-dip")
      .gte("trade_date", since)
      .lte("trade_date", today);
    const closed = (trades ?? []).filter(t => t.status === "closed" && t.pnl_pct != null);
    const total = closed.length;
    const tpHits = closed.filter(t => t.exit_reason === "tp" || t.exit_reason === "TP").length;
    const slHits = closed.filter(t => (t.exit_reason ?? "").toLowerCase().includes("sl") || t.exit_reason === "stop").length;
    const trailHits = closed.filter(t => (t.exit_reason ?? "").toLowerCase().includes("trail")).length;
    const wins = closed.filter(t => Number(t.pnl_pct) > 0).length;
    const winRate = total ? wins / total : 0;
    const avgWin = total ? closed.filter(t => Number(t.pnl_pct) > 0).reduce((s, t) => s + Number(t.pnl_pct), 0) / Math.max(1, wins) : 0;
    const avgLoss = total ? closed.filter(t => Number(t.pnl_pct) < 0).reduce((s, t) => s + Number(t.pnl_pct), 0) / Math.max(1, total - wins) : 0;

    // ---- 2. missed_signals scored ----
    const { data: misses } = await supabaseAdmin
      .from("missed_signals")
      .select("reason, candidate_price, tp_price, sl_price, ts, symbol, trade_date")
      .gte("trade_date", since)
      .lte("trade_date", today);
    // For each miss, we need outcome (would_win/would_lose). Approximate via a
    // batched live_ticks scan capped for perf: only recompute for the last
    // 3 days of misses to keep the call cheap. Older misses count only by
    // volume, not by outcome.
    const recentSince = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const recent = (misses ?? []).filter(m => m.ts >= recentSince);
    const recentSyms = Array.from(new Set(recent.map(m => m.symbol)));
    const ticksBySym = new Map<string, { p: number; t: number }[]>();
    if (recentSyms.length) {
      const { data: ticks } = await supabaseAdmin
        .from("live_ticks")
        .select("symbol, price, ts")
        .in("symbol", recentSyms)
        .gte("ts", recentSince)
        .eq("source", "thunder_ext")
        .limit(50_000);
      for (const t of ticks ?? []) {
        if (!ticksBySym.has(t.symbol)) ticksBySym.set(t.symbol, []);
        ticksBySym.get(t.symbol)!.push({ p: Number(t.price), t: new Date(t.ts).getTime() });
      }
    }
    function scoreMiss(m: { symbol: string; ts: string; candidate_price: number | null; tp_price: number | null; sl_price: number | null }) {
      const start = new Date(m.ts).getTime();
      const arr = (ticksBySym.get(m.symbol) ?? []).filter(x => x.t >= start && x.t <= start + 60 * 60_000);
      if (arr.length < 3 || m.candidate_price == null) return "unknown";
      for (const x of arr) {
        if (m.tp_price != null && x.p >= Number(m.tp_price)) return "win";
        if (m.sl_price != null && x.p <= Number(m.sl_price)) return "lose";
      }
      return "flat";
    }
    const prebuy = { total: 0, win: 0, lose: 0 };
    for (const m of recent) {
      if (m.reason !== "prebuy_filter") continue;
      const o = scoreMiss(m as { symbol: string; ts: string; candidate_price: number | null; tp_price: number | null; sl_price: number | null });
      prebuy.total++;
      if (o === "win") prebuy.win++;
      if (o === "lose") prebuy.lose++;
    }

    // ---- 3. smart_exit_log HARD_FLOOR shadow accuracy ----
    const { data: hfLogs } = await supabaseAdmin
      .from("smart_exit_log")
      .select("trade_date, symbol, ts, price, entry_price, pnl_pct, shadow, rule")
      .eq("rule", "HARD_FLOOR")
      .eq("shadow", true)
      .gte("trade_date", since);
    // Rule considered "right" if within 30 min after log, price never recovered above -1% from entry
    const hfSyms = Array.from(new Set((hfLogs ?? []).map(r => r.symbol)));
    const shadowSince = new Date(Date.now() - days * 86_400_000).toISOString();
    const hfTicks = new Map<string, { p: number; t: number }[]>();
    if (hfSyms.length) {
      const { data: ticks } = await supabaseAdmin
        .from("live_ticks")
        .select("symbol, price, ts")
        .in("symbol", hfSyms)
        .gte("ts", shadowSince)
        .eq("source", "thunder_ext")
        .limit(50_000);
      for (const t of ticks ?? []) {
        if (!hfTicks.has(t.symbol)) hfTicks.set(t.symbol, []);
        hfTicks.get(t.symbol)!.push({ p: Number(t.price), t: new Date(t.ts).getTime() });
      }
    }
    let hfRight = 0, hfTotal = 0;
    for (const r of hfLogs ?? []) {
      if (r.entry_price == null) continue;
      hfTotal++;
      const start = new Date(r.ts).getTime();
      const arr = (hfTicks.get(r.symbol) ?? []).filter(x => x.t >= start && x.t <= start + 30 * 60_000);
      const recoveredAbove = arr.some(x => (x.p - Number(r.entry_price)) / Number(r.entry_price) >= -0.01);
      if (!recoveredAbove) hfRight++;
    }
    const hfAcc = hfTotal ? hfRight / hfTotal : 0;

    // ---- 4. current settings snapshot ----
    const { data: settings } = await supabaseAdmin
      .from("strategy_settings")
      .select("key, enabled");
    const currentSetting = (k: string) => (settings ?? []).find(s => s.key === k)?.enabled ?? null;

    // ---- Build suggestions ----
    const drafts: SuggestionDraft[] = [];

    // Prebuy filter
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
          rationale: helping
            ? `الفلتر يتفادى ${prebuy.lose} خسارة مقابل ${prebuy.win} فرصة ضاعت — نافع، خليه شغّال.`
            : `الفلتر يفوّت ${prebuy.win} فرصة مقابل ${prebuy.lose} خسارة اتفاديت — بيقطع فرص أكثر مما يحمي.`,
          evidence: { prebuy_stats: prebuy, days_scored: 3 },
          confidence: conf,
        });
      }
    }

    // Shadow → Live promotion
    if (hfTotal >= 5) {
      const shadowOn = currentSetting("scalp-dip-smart-exit-shadow") ?? true;
      if (shadowOn && hfAcc >= 0.70) {
        drafts.push({
          category: "shadow_promotion",
          target_key: "scalp-dip-smart-exit-shadow",
          current_value: "true (shadow)",
          suggested_value: "false (live)",
          action_type: "toggle",
          rationale: `قاعدة HARD_FLOOR دقّتها ${(hfAcc * 100).toFixed(0)}% (${hfRight}/${hfTotal}) — جاهزة تخرج من shadow mode.`,
          evidence: { hard_floor_accuracy: hfAcc, hard_floor_right: hfRight, hard_floor_total: hfTotal },
          confidence: Math.min(1, (hfAcc - 0.5) * 2),
        });
      } else if (shadowOn && hfAcc < 0.5) {
        drafts.push({
          category: "shadow_promotion",
          target_key: "scalp-dip-smart-exit",
          current_value: String(currentSetting("scalp-dip-smart-exit") ?? true),
          suggested_value: "false",
          action_type: "toggle",
          rationale: `قاعدة HARD_FLOOR دقّتها ${(hfAcc * 100).toFixed(0)}% فقط — الأفضل تعطيلها.`,
          evidence: { hard_floor_accuracy: hfAcc, hard_floor_right: hfRight, hard_floor_total: hfTotal },
          confidence: Math.min(1, (0.5 - hfAcc) * 2),
        });
      }
    }

    // TP calibration (advisory)
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
          evidence: { tp_hits: tpHits, sl_hits: slHits, trail_hits: trailHits, total, win_rate: winRate },
          confidence: Math.min(1, (tpRate - 0.5) * 2),
        });
      } else if (tpRate < 0.35 && trailHits > tpHits) {
        drafts.push({
          category: "tp_target",
          target_key: "TP_PCT",
          current_value: "2.0%",
          suggested_value: "1.5%",
          action_type: "advisory",
          rationale: `TP بيتحقق ${(tpRate * 100).toFixed(0)}% بس، والـ trailing stop بياخد أغلب الخروج — قلّل TP لـ 1.5% تحسّن معدل التحقيق.`,
          evidence: { tp_hits: tpHits, sl_hits: slHits, trail_hits: trailHits, total, win_rate: winRate },
          confidence: Math.min(1, (0.35 - tpRate) * 2),
        });
      }
    }

    // SL calibration (advisory)
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
          evidence: { sl_hits: slHits, total, win_rate: winRate, avg_loss_pct: avgLoss },
          confidence: Math.min(1, (slRate - 0.25) * 3),
        });
      }
    }

    // Persist: upsert into pending. If a pending suggestion of same
    // (category, target_key) already exists, replace its content.
    const upserted: string[] = [];
    for (const d of drafts) {
      // Delete any pending same-category+target_key row first (dedupe).
      await supabaseAdmin
        .from("decision_suggestions")
        .delete()
        .eq("status", "pending")
        .eq("category", d.category)
        .eq("target_key", d.target_key ?? "");
      const { data: row, error } = await supabaseAdmin
        .from("decision_suggestions")
        .insert({
          category: d.category,
          target_key: d.target_key,
          current_value: d.current_value,
          suggested_value: d.suggested_value,
          action_type: d.action_type,
          rationale: d.rationale,
          evidence: d.evidence as never,
          evidence_days: days,
          confidence: +d.confidence.toFixed(3),
        })
        .select("id")
        .single();
      if (!error && row) upserted.push(row.id);
    }

    return {
      ok: true,
      days,
      stats: {
        paper_trades_total: total, wins, win_rate: +winRate.toFixed(3),
        tp_hits: tpHits, sl_hits: slHits, trail_hits: trailHits,
        avg_win_pct: +avgWin.toFixed(4), avg_loss_pct: +avgLoss.toFixed(4),
        prebuy_scored: prebuy,
        hard_floor_shadow: { total: hfTotal, right: hfRight, accuracy: +hfAcc.toFixed(3) },
      },
      suggestions_created: upserted.length,
    };
  });

/** List suggestions (default: all). */
export const listDecisionSuggestions = createServerFn({ method: "GET" })
  .inputValidator((data: { status?: string } | undefined) => ({ status: data?.status }))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("decision_suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

/** Apply a toggle suggestion. Advisory suggestions cannot be auto-applied. */
export const applyDecisionSuggestion = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("decision_suggestions")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error(error?.message ?? "not found");
    if (row.status !== "pending") throw new Error("already handled");
    if (row.action_type !== "toggle" || !row.target_key) {
      throw new Error("هذا الاقتراح استشاري فقط ويتطلب تعديل الكود يدوياً.");
    }
    const newVal = row.suggested_value === "true" || row.suggested_value?.startsWith("false (live)") === false && row.suggested_value === "true";
    // Parse: "true"/"false" or "false (live)" (means turn shadow off) / "true (shadow)"
    let enabled: boolean;
    if (row.suggested_value === "true") enabled = true;
    else if (row.suggested_value === "false") enabled = false;
    else if (row.suggested_value?.includes("false")) enabled = false;
    else if (row.suggested_value?.includes("true")) enabled = true;
    else throw new Error(`تعذر تفسير القيمة المقترحة: ${row.suggested_value}`);
    void newVal;

    const { error: upErr } = await supabaseAdmin
      .from("strategy_settings")
      .upsert({ key: row.target_key, enabled, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (upErr) throw new Error(upErr.message);

    await supabaseAdmin
      .from("decision_suggestions")
      .update({ status: "applied", applied_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true, key: row.target_key, enabled };
  });

/** Reject a suggestion (mark rejected). */
export const rejectDecisionSuggestion = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("decision_suggestions")
      .update({ status: "rejected", rejected_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });