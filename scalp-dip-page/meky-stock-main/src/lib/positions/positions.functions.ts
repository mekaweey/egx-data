import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

export type PositionRow = {
  id: string;
  symbol: string;
  name_ar: string | null;
  entry_price: number;
  entry_date: string;
  entry_at: string;
  quantity: number;
  stop_loss: number | null;
  target_price: number | null;
  trailing_stop: number | null;
  max_hold_days: number | null;
  current_price: number | null;
  highest_price: number | null;
  pnl_pct: number | null;
  status: "open" | "closed";
  exit_price: number | null;
  exit_date: string | null;
  exit_at: string | null;
  exit_reason: string | null;
  recommendation_id: string | null;
  notes: string | null;
  created_at: string;
};

export type SellAlertRow = {
  id: string;
  position_id: string;
  symbol: string;
  name_ar: string | null;
  alert_type: string;
  message_ar: string;
  suggested_exit_price: number | null;
  pnl_pct: number | null;
  acknowledged: boolean;
  created_at: string;
};

async function getStockName(symbol: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("stocks")
    .select("name_ar")
    .eq("symbol", symbol)
    .maybeSingle();
  return data?.name_ar ?? null;
}

export const listPositions = createServerFn({ method: "GET" }).handler(async () => {
  const { data: positions, error } = await supabaseAdmin
    .from("positions")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const symbols = [...new Set((positions ?? []).map((p) => p.symbol))];
  const namesMap = new Map<string, string>();
  if (symbols.length) {
    const { data: stocks } = await supabaseAdmin
      .from("stocks")
      .select("symbol, name_ar")
      .in("symbol", symbols);
    for (const s of stocks ?? []) namesMap.set(s.symbol, s.name_ar);
  }

  const rows: PositionRow[] = (positions ?? []).map((p) => ({
    id: p.id,
    symbol: p.symbol,
    name_ar: namesMap.get(p.symbol) ?? null,
    entry_price: Number(p.entry_price),
    entry_date: p.entry_date,
    entry_at: (p as { entry_at?: string }).entry_at ?? p.created_at,
    quantity: Number(p.quantity),
    stop_loss: p.stop_loss != null ? Number(p.stop_loss) : null,
    target_price: p.target_price != null ? Number(p.target_price) : null,
    trailing_stop: p.trailing_stop != null ? Number(p.trailing_stop) : null,
    max_hold_days: p.max_hold_days,
    current_price: p.current_price != null ? Number(p.current_price) : null,
    highest_price: p.highest_price != null ? Number(p.highest_price) : null,
    pnl_pct: p.pnl_pct != null ? Number(p.pnl_pct) : null,
    status: p.status as "open" | "closed",
    exit_price: p.exit_price != null ? Number(p.exit_price) : null,
    exit_date: p.exit_date,
    exit_at: (p as { exit_at?: string | null }).exit_at ?? null,
    exit_reason: p.exit_reason,
    recommendation_id: p.recommendation_id,
    notes: p.notes,
    created_at: p.created_at,
  }));

  const { data: alerts } = await supabaseAdmin
    .from("sell_alerts")
    .select("*")
    .eq("acknowledged", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const alertRows: SellAlertRow[] = (alerts ?? []).map((a) => ({
    id: a.id,
    position_id: a.position_id,
    symbol: a.symbol,
    name_ar: namesMap.get(a.symbol) ?? null,
    alert_type: a.alert_type,
    message_ar: a.message_ar,
    suggested_exit_price: a.suggested_exit_price != null ? Number(a.suggested_exit_price) : null,
    pnl_pct: a.pnl_pct != null ? Number(a.pnl_pct) : null,
    acknowledged: a.acknowledged,
    created_at: a.created_at,
  }));

  return { positions: rows, alerts: alertRows };
});

const OpenSchema = z.object({
  symbol: z.string().min(1).max(20),
  entry_price: z.number().positive(),
  quantity: z.number().positive().default(1),
  stop_loss: z.number().positive().nullable().optional(),
  target_price: z.number().positive().nullable().optional(),
  max_hold_days: z.number().int().positive().nullable().optional(),
  recommendation_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  // Pre-buy L2 gate controls. Default: ON.
  skip_l2_gate: z.boolean().optional().default(false),
  gate_tp_pct: z.number().positive().optional(),
  gate_fee_pct: z.number().nonnegative().optional(),
  gate_source: z.string().max(40).optional(),
});

export const openPosition = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OpenSchema.parse(d))
  .handler(async ({ data }) => {
    const name = await getStockName(data.symbol);
    if (!name) throw new Error("الرمز غير موجود في قائمة الأسهم");

    // Pre-buy L2 gate: refuse the buy unless a fresh orderbook snapshot proves
    // instant profitable exit is possible at target_price = entry × (1 + tp + fee).
    if (!data.skip_l2_gate) {
      const { runPreBuyL2Gate } = await import("@/lib/scalp-feasibility/pre-buy-gate.server");
      const gate = await runPreBuyL2Gate({
        symbol: data.symbol,
        entry_price: data.entry_price,
        qty: data.quantity,
        tp_pct: data.gate_tp_pct,
        fee_pct: data.gate_fee_pct,
        source: data.gate_source ?? "manual_buy",
      });
      if (!gate.ok) {
        const msg = arabicGateReason(gate);
        throw new Error(msg);
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from("positions")
      .insert({
        symbol: data.symbol,
        entry_price: data.entry_price,
        quantity: data.quantity,
        stop_loss: data.stop_loss ?? null,
        target_price: data.target_price ?? null,
        max_hold_days: data.max_hold_days ?? 30,
        recommendation_id: data.recommendation_id ?? null,
        notes: data.notes ?? null,
        current_price: data.entry_price,
        highest_price: data.entry_price,
        pnl_pct: 0,
        entry_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

function arabicGateReason(g: {
  reason: string;
  target_price: number;
  best_bid: number | null;
  bid_sum_at_target: number | null;
  snapshot_age_ms: number | null;
}): string {
  const t = g.target_price.toFixed(2);
  if (g.reason.startsWith("no_l2_snapshot"))
    return `مفيش بيانات Order Book طازة للسهم — مش هنشتري لأننا مش قادرين نتأكد من إمكانية البيع لحظياً عند ${t}.`;
  if (g.reason.startsWith("stale_snapshot"))
    return `بيانات Order Book قديمة (${Math.round((g.snapshot_age_ms ?? 0) / 1000)}ث) — مش هنشتري لحد ما تتحدّث.`;
  if (g.reason.startsWith("insufficient_bid_depth"))
    return `مفيش طلبات شراء كافية عند سعر البيع المستهدف ${t} (متاح ${g.bid_sum_at_target ?? 0} سهم فقط) — الصفقة هتحبس رأس المال، تم الإلغاء.`;
  if (g.reason.startsWith("wide_spread"))
    return `الفرق بين العرض والطلب واسع جداً — الخروج اللحظي غير مضمون، تم إلغاء الشراء.`;
  if (g.reason.startsWith("l2_read_error"))
    return `تعذر قراءة Order Book — تم إلغاء الشراء احتياطياً.`;
  return `pre-buy L2 gate رفض الصفقة: ${g.reason}`;
}

const ClosePositionSchema = z.object({
  position_id: z.string().uuid(),
  exit_price: z.number().positive(),
  exit_reason: z
    .enum(["target_hit", "stop_loss", "trailing_stop", "time_exit", "manual", "news_shock"])
    .default("manual"),
});

export const closePosition = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ClosePositionSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: pos, error: fErr } = await supabaseAdmin
      .from("positions")
      .select("entry_price")
      .eq("id", data.position_id)
      .single();
    if (fErr) throw new Error(fErr.message);

    const entry = Number(pos.entry_price);
    const pnl = ((data.exit_price - entry) / entry) * 100;

    const { error } = await supabaseAdmin
      .from("positions")
      .update({
        status: "closed",
        exit_price: data.exit_price,
        exit_date: new Date().toISOString().slice(0, 10),
        exit_at: new Date().toISOString(),
        exit_reason: data.exit_reason,
        current_price: data.exit_price,
        pnl_pct: pnl,
      })
      .eq("id", data.position_id);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("sell_alerts")
      .update({ acknowledged: true })
      .eq("position_id", data.position_id);

    return { ok: true, pnl_pct: pnl };
  });

const AckSchema = z.object({ alert_id: z.string().uuid() });
export const acknowledgeAlert = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AckSchema.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("sell_alerts")
      .update({ acknowledged: true })
      .eq("id", data.alert_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DeletePositionSchema = z.object({ position_id: z.string().uuid() });
export const deletePosition = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeletePositionSchema.parse(d))
  .handler(async ({ data }) => {
    // sell_alerts cascades via FK; remove the position record entirely
    const { error } = await supabaseAdmin
      .from("positions")
      .delete()
      .eq("id", data.position_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ActivityItem = {
  id: string;
  kind: "position_open" | "position_close" | "sell_alert" | "pick_notification";
  ts: string;
  symbol: string;
  title: string;
  detail: string;
};

export const listActivity = createServerFn({ method: "GET" }).handler(async () => {
  const [posR, alertsR, picksR] = await Promise.all([
    supabaseAdmin
      .from("positions")
      .select("id, symbol, entry_price, quantity, entry_at, status, exit_price, exit_at, exit_reason, pnl_pct, notes")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("sell_alerts")
      .select("id, symbol, alert_type, message_ar, suggested_exit_price, pnl_pct, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("pick_notifications")
      .select("id, symbol, kind, payload, sent_at")
      .order("sent_at", { ascending: false })
      .limit(200),
  ]);

  const items: ActivityItem[] = [];

  for (const p of posR.data ?? []) {
    items.push({
      id: `pos-open-${p.id}`,
      kind: "position_open",
      ts: (p as { entry_at?: string }).entry_at ?? new Date().toISOString(),
      symbol: p.symbol,
      title: `🛒 سجّلت شراء ${p.symbol}`,
      detail: `الكميه ${Number(p.quantity)} سهم · سعر الدخول ${Number(p.entry_price).toFixed(2)} ج.م${p.notes ? ` · ${p.notes}` : ""}`,
    });
    if (p.status === "closed" && p.exit_at) {
      const pnl = p.pnl_pct != null ? Number(p.pnl_pct) : 0;
      items.push({
        id: `pos-close-${p.id}`,
        kind: "position_close",
        ts: p.exit_at,
        symbol: p.symbol,
        title: `📤 أقفلت صفقة ${p.symbol} (${p.exit_reason ?? "manual"})`,
        detail: `سعر الخروج ${p.exit_price != null ? Number(p.exit_price).toFixed(2) : "—"} · ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`,
      });
    }
  }

  for (const a of alertsR.data ?? []) {
    items.push({
      id: `alert-${a.id}`,
      kind: "sell_alert",
      ts: a.created_at,
      symbol: a.symbol,
      title: `🔔 ${a.message_ar}`,
      detail: `السعر المقترح ${a.suggested_exit_price != null ? Number(a.suggested_exit_price).toFixed(2) : "—"} · ${a.pnl_pct != null ? Number(a.pnl_pct).toFixed(2) : "0"}%`,
    });
  }

  for (const n of picksR.data ?? []) {
    // Skip noisy periodic heartbeats — they're just "still watching" pings.
    if (typeof n.kind === "string" && n.kind.startsWith("monitor:hb_")) continue;
    items.push({
      id: `pick-${n.id}`,
      kind: "pick_notification",
      ts: n.sent_at,
      symbol: n.symbol,
      title: `📊 إشعار ترشيح ${n.symbol} (${n.kind})`,
      detail:
        n.payload && typeof n.payload === "object"
          ? JSON.stringify(n.payload).slice(0, 180)
          : "",
    });
  }

  items.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return { items: items.slice(0, 300) };
});

export type DailyPnlRow = {
  day: string; // YYYY-MM-DD (exit day)
  trades: number;
  realized_egp: number; // (exit - entry) * quantity sum
  avg_pnl_pct: number;
  symbols: string[];
};

export const dailyPnl = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .select("symbol, entry_price, exit_price, quantity, pnl_pct, exit_date, exit_at")
    .eq("status", "closed")
    .not("exit_date", "is", null)
    .order("exit_date", { ascending: false });
  if (error) throw new Error(error.message);

  const map = new Map<string, DailyPnlRow>();
  for (const p of data ?? []) {
    const day = p.exit_date as string;
    const entry = Number(p.entry_price);
    const exit = p.exit_price != null ? Number(p.exit_price) : entry;
    const qty = Number(p.quantity);
    const realized = (exit - entry) * qty;
    const row = map.get(day) ?? { day, trades: 0, realized_egp: 0, avg_pnl_pct: 0, symbols: [] };
    row.trades += 1;
    row.realized_egp += realized;
    row.avg_pnl_pct += Number(p.pnl_pct ?? 0);
    if (!row.symbols.includes(p.symbol)) row.symbols.push(p.symbol);
    map.set(day, row);
  }
  const rows = Array.from(map.values()).map((r) => ({
    ...r,
    avg_pnl_pct: r.trades > 0 ? r.avg_pnl_pct / r.trades : 0,
  }));
  rows.sort((a, b) => (a.day < b.day ? 1 : -1));
  return { days: rows };
});

/**
 * Sell Engine: يقيّم كل المراكز المفتوحة، يحدّث السعر الحالي،
 * وينشئ sell_alerts لما يلاقي شرط بيع تحقّق.
 */
export const evaluatePositions = createServerFn({ method: "POST" }).handler(async () => {
  const { data: positions, error } = await supabaseAdmin
    .from("positions")
    .select("*")
    .eq("status", "open");
    if (error) throw new Error(error.message);
    if (!positions || positions.length === 0) {
      return { evaluated: 0, alerts_created: 0 };
    }

  const symbols = [...new Set(positions.map((p) => p.symbol))];
  // أحدث snapshot لكل سهم
  const { data: snaps } = await supabaseAdmin
    .from("stock_snapshots")
    .select("symbol, close, ts")
    .in("symbol", symbols)
    .order("ts", { ascending: false });

  const latestPrice = new Map<string, number>();
  for (const s of snaps ?? []) {
    if (!latestPrice.has(s.symbol)) latestPrice.set(s.symbol, Number(s.close));
  }

  let alertsCreated = 0;

  for (const pos of positions) {
    const price = latestPrice.get(pos.symbol);
    if (price == null) continue;

    const entry = Number(pos.entry_price);
    const pnl = ((price - entry) / entry) * 100;
    const prevHigh = pos.highest_price != null ? Number(pos.highest_price) : entry;
    const newHigh = Math.max(prevHigh, price);

    // Trailing stop: لو حقق +7% حرّك الـ stop لـ entry * 1.03
    let trailing = pos.trailing_stop != null ? Number(pos.trailing_stop) : null;
    if (pnl >= 7 && (trailing == null || trailing < entry * 1.03)) {
      trailing = entry * 1.03;
    }
    // لو حقق +12% حرّك الـ trailing لـ entry * 1.07
    if (pnl >= 12 && (trailing == null || trailing < entry * 1.07)) {
      trailing = entry * 1.07;
    }

    await supabaseAdmin
      .from("positions")
      .update({
        current_price: price,
        current_price_at: new Date().toISOString(),
        highest_price: newHigh,
        pnl_pct: pnl,
        trailing_stop: trailing,
      })
      .eq("id", pos.id);

    // افحص هل يوجد alert لنفس النوع غير مقفول؟
    type AlertType = "target_hit" | "stop_loss" | "trailing_stop" | "time_exit";
    const triggers: Array<{ type: AlertType; message: string; cond: boolean }> = [];

    if (pos.target_price != null && price >= Number(pos.target_price)) {
      triggers.push({
        type: "target_hit",
        message: `🎯 السهم ${escapeHtml(pos.symbol)} وصل الهدف! حقق ${pnl.toFixed(2)}% — يُنصح بالبيع`,
        cond: true,
      });
    }
    if (pos.stop_loss != null && price <= Number(pos.stop_loss)) {
      triggers.push({
        type: "stop_loss",
        message: `🛑 السهم ${escapeHtml(pos.symbol)} وصل وقف الخسارة (${pnl.toFixed(2)}%) — يجب البيع فوراً`,
        cond: true,
      });
    }
    if (trailing != null && price <= trailing && pnl > 0) {
      triggers.push({
        type: "trailing_stop",
        message: `🔒 السهم ${escapeHtml(pos.symbol)} لمس التريلينج ستوب — احتفظ بالربح (${pnl.toFixed(2)}%)`,
        cond: true,
      });
    }
    if (pos.max_hold_days != null) {
      const days = Math.floor(
        (Date.now() - new Date(pos.entry_date).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days >= pos.max_hold_days) {
        triggers.push({
          type: "time_exit",
          message: `⏰ مرّ ${days} يوم على شراء ${escapeHtml(pos.symbol)} (${pnl.toFixed(2)}%) — راجع الموقف`,
          cond: true,
        });
      }
    }

    for (const t of triggers) {
      // تجنّب التكرار: لو فيه alert من نفس النوع في آخر 24 ساعة
      const { data: existing } = await supabaseAdmin
        .from("sell_alerts")
        .select("id")
        .eq("position_id", pos.id)
        .eq("alert_type", t.type)
        .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .limit(1);
      if (existing && existing.length > 0) continue;

      await supabaseAdmin.from("sell_alerts").insert({
        position_id: pos.id,
        symbol: pos.symbol,
        alert_type: t.type,
        message_ar: t.message,
        suggested_exit_price: price,
        pnl_pct: pnl,
      });
      alertsCreated++;

      // Push to Telegram (fire-and-forget; never blocks the eval loop)
      void sendTelegram(
        `<b>${t.type === "target_hit" ? "🎯 وصل الهدف" : t.type === "stop_loss" ? "🛑 وقف الخسارة" : t.type === "trailing_stop" ? "🔒 تريلينج ستوب" : "⏰ تنبيه وقت"}</b>\n` +
          `${escapeHtml(t.message)}\n\n` +
          `💵 السعر الحالي: <b>${price.toFixed(2)}</b>\n` +
          `📈 الربح/الخسارة: <b>${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%</b>\n` +
          `🛒 الدخول: ${entry.toFixed(2)} · الكمية: ${Number(pos.quantity)}`,
      );
    }
  }

  return { evaluated: positions.length, alerts_created: alertsCreated };
});