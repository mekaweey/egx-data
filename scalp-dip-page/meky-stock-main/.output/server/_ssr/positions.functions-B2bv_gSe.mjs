import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { e as escapeHtml, s as sendTelegram } from "./telegram.server-D6g8flro.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as object, b as string, n as number, f as boolean, _ as _enum } from "../_libs/zod.mjs";
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
import "./chat-fallback.server-HMcdWJQs.mjs";
async function getStockName(symbol) {
  const {
    data
  } = await supabaseAdmin.from("stocks").select("name_ar").eq("symbol", symbol).maybeSingle();
  return data?.name_ar ?? null;
}
const listPositions_createServerFn_handler = createServerRpc({
  id: "0b600d69f4c93e6451655d8abeafa56788e476dd51a35d3aae5a60fe034e9082",
  name: "listPositions",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => listPositions.__executeServer(opts));
const listPositions = createServerFn({
  method: "GET"
}).handler(listPositions_createServerFn_handler, async () => {
  const {
    data: positions,
    error
  } = await supabaseAdmin.from("positions").select("*").order("status", {
    ascending: true
  }).order("created_at", {
    ascending: false
  });
  if (error) throw new Error(error.message);
  const symbols = [...new Set((positions ?? []).map((p) => p.symbol))];
  const namesMap = /* @__PURE__ */ new Map();
  if (symbols.length) {
    const {
      data: stocks
    } = await supabaseAdmin.from("stocks").select("symbol, name_ar").in("symbol", symbols);
    for (const s of stocks ?? []) namesMap.set(s.symbol, s.name_ar);
  }
  const rows = (positions ?? []).map((p) => ({
    id: p.id,
    symbol: p.symbol,
    name_ar: namesMap.get(p.symbol) ?? null,
    entry_price: Number(p.entry_price),
    entry_date: p.entry_date,
    entry_at: p.entry_at ?? p.created_at,
    quantity: Number(p.quantity),
    stop_loss: p.stop_loss != null ? Number(p.stop_loss) : null,
    target_price: p.target_price != null ? Number(p.target_price) : null,
    trailing_stop: p.trailing_stop != null ? Number(p.trailing_stop) : null,
    max_hold_days: p.max_hold_days,
    current_price: p.current_price != null ? Number(p.current_price) : null,
    highest_price: p.highest_price != null ? Number(p.highest_price) : null,
    pnl_pct: p.pnl_pct != null ? Number(p.pnl_pct) : null,
    status: p.status,
    exit_price: p.exit_price != null ? Number(p.exit_price) : null,
    exit_date: p.exit_date,
    exit_at: p.exit_at ?? null,
    exit_reason: p.exit_reason,
    recommendation_id: p.recommendation_id,
    notes: p.notes,
    created_at: p.created_at
  }));
  const {
    data: alerts
  } = await supabaseAdmin.from("sell_alerts").select("*").eq("acknowledged", false).order("created_at", {
    ascending: false
  }).limit(50);
  const alertRows = (alerts ?? []).map((a) => ({
    id: a.id,
    position_id: a.position_id,
    symbol: a.symbol,
    name_ar: namesMap.get(a.symbol) ?? null,
    alert_type: a.alert_type,
    message_ar: a.message_ar,
    suggested_exit_price: a.suggested_exit_price != null ? Number(a.suggested_exit_price) : null,
    pnl_pct: a.pnl_pct != null ? Number(a.pnl_pct) : null,
    acknowledged: a.acknowledged,
    created_at: a.created_at
  }));
  return {
    positions: rows,
    alerts: alertRows
  };
});
const OpenSchema = object({
  symbol: string().min(1).max(20),
  entry_price: number().positive(),
  quantity: number().positive().default(1),
  stop_loss: number().positive().nullable().optional(),
  target_price: number().positive().nullable().optional(),
  max_hold_days: number().int().positive().nullable().optional(),
  recommendation_id: string().uuid().nullable().optional(),
  notes: string().max(500).nullable().optional(),
  // Pre-buy L2 gate controls. Default: ON.
  skip_l2_gate: boolean().optional().default(false),
  gate_tp_pct: number().positive().optional(),
  gate_fee_pct: number().nonnegative().optional(),
  gate_source: string().max(40).optional()
});
const openPosition_createServerFn_handler = createServerRpc({
  id: "80a649afc32c59e6f9568a2b2d1537765c00f78803241630c58f8908c8640535",
  name: "openPosition",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => openPosition.__executeServer(opts));
const openPosition = createServerFn({
  method: "POST"
}).inputValidator((d) => OpenSchema.parse(d)).handler(openPosition_createServerFn_handler, async ({
  data
}) => {
  const name = await getStockName(data.symbol);
  if (!name) throw new Error("الرمز غير موجود في قائمة الأسهم");
  if (!data.skip_l2_gate) {
    const {
      runPreBuyL2Gate
    } = await import("./pre-buy-gate.server-BTW6j08Z.mjs");
    const gate = await runPreBuyL2Gate({
      symbol: data.symbol,
      entry_price: data.entry_price,
      qty: data.quantity,
      tp_pct: data.gate_tp_pct,
      fee_pct: data.gate_fee_pct,
      source: data.gate_source ?? "manual_buy"
    });
    if (!gate.ok) {
      const msg = arabicGateReason(gate);
      throw new Error(msg);
    }
  }
  const {
    data: row,
    error
  } = await supabaseAdmin.from("positions").insert({
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
    entry_at: (/* @__PURE__ */ new Date()).toISOString()
  }).select("id").single();
  if (error) throw new Error(error.message);
  return {
    id: row.id
  };
});
function arabicGateReason(g) {
  const t = g.target_price.toFixed(2);
  if (g.reason.startsWith("no_l2_snapshot")) return `مفيش بيانات Order Book طازة للسهم — مش هنشتري لأننا مش قادرين نتأكد من إمكانية البيع لحظياً عند ${t}.`;
  if (g.reason.startsWith("stale_snapshot")) return `بيانات Order Book قديمة (${Math.round((g.snapshot_age_ms ?? 0) / 1e3)}ث) — مش هنشتري لحد ما تتحدّث.`;
  if (g.reason.startsWith("insufficient_bid_depth")) return `مفيش طلبات شراء كافية عند سعر البيع المستهدف ${t} (متاح ${g.bid_sum_at_target ?? 0} سهم فقط) — الصفقة هتحبس رأس المال، تم الإلغاء.`;
  if (g.reason.startsWith("wide_spread")) return `الفرق بين العرض والطلب واسع جداً — الخروج اللحظي غير مضمون، تم إلغاء الشراء.`;
  if (g.reason.startsWith("l2_read_error")) return `تعذر قراءة Order Book — تم إلغاء الشراء احتياطياً.`;
  return `pre-buy L2 gate رفض الصفقة: ${g.reason}`;
}
const ClosePositionSchema = object({
  position_id: string().uuid(),
  exit_price: number().positive(),
  exit_reason: _enum(["target_hit", "stop_loss", "trailing_stop", "time_exit", "manual", "news_shock"]).default("manual")
});
const closePosition_createServerFn_handler = createServerRpc({
  id: "9cf7afcc4da36d0351774c8f92e72a3725e5d650af8c66d48632f750d598c4b4",
  name: "closePosition",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => closePosition.__executeServer(opts));
const closePosition = createServerFn({
  method: "POST"
}).inputValidator((d) => ClosePositionSchema.parse(d)).handler(closePosition_createServerFn_handler, async ({
  data
}) => {
  const {
    data: pos,
    error: fErr
  } = await supabaseAdmin.from("positions").select("entry_price").eq("id", data.position_id).single();
  if (fErr) throw new Error(fErr.message);
  const entry = Number(pos.entry_price);
  const pnl = (data.exit_price - entry) / entry * 100;
  const {
    error
  } = await supabaseAdmin.from("positions").update({
    status: "closed",
    exit_price: data.exit_price,
    exit_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    exit_at: (/* @__PURE__ */ new Date()).toISOString(),
    exit_reason: data.exit_reason,
    current_price: data.exit_price,
    pnl_pct: pnl
  }).eq("id", data.position_id);
  if (error) throw new Error(error.message);
  await supabaseAdmin.from("sell_alerts").update({
    acknowledged: true
  }).eq("position_id", data.position_id);
  return {
    ok: true,
    pnl_pct: pnl
  };
});
const AckSchema = object({
  alert_id: string().uuid()
});
const acknowledgeAlert_createServerFn_handler = createServerRpc({
  id: "43c34c8f9006f7b035597816cfca2525ec0d440216be52fd9788c10db431d269",
  name: "acknowledgeAlert",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => acknowledgeAlert.__executeServer(opts));
const acknowledgeAlert = createServerFn({
  method: "POST"
}).inputValidator((d) => AckSchema.parse(d)).handler(acknowledgeAlert_createServerFn_handler, async ({
  data
}) => {
  const {
    error
  } = await supabaseAdmin.from("sell_alerts").update({
    acknowledged: true
  }).eq("id", data.alert_id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const DeletePositionSchema = object({
  position_id: string().uuid()
});
const deletePosition_createServerFn_handler = createServerRpc({
  id: "5a60a9ee330fc9f273ade8e7a78db9e9579f9859b2f32a138495fad137c0c562",
  name: "deletePosition",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => deletePosition.__executeServer(opts));
const deletePosition = createServerFn({
  method: "POST"
}).inputValidator((d) => DeletePositionSchema.parse(d)).handler(deletePosition_createServerFn_handler, async ({
  data
}) => {
  const {
    error
  } = await supabaseAdmin.from("positions").delete().eq("id", data.position_id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const listActivity_createServerFn_handler = createServerRpc({
  id: "f20c1f9a188f60bf1513f24269a676cf1ec4b95a891a3cdb3c697c5543bfe754",
  name: "listActivity",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => listActivity.__executeServer(opts));
const listActivity = createServerFn({
  method: "GET"
}).handler(listActivity_createServerFn_handler, async () => {
  const [posR, alertsR, picksR] = await Promise.all([supabaseAdmin.from("positions").select("id, symbol, entry_price, quantity, entry_at, status, exit_price, exit_at, exit_reason, pnl_pct, notes").order("created_at", {
    ascending: false
  }).limit(200), supabaseAdmin.from("sell_alerts").select("id, symbol, alert_type, message_ar, suggested_exit_price, pnl_pct, created_at").order("created_at", {
    ascending: false
  }).limit(200), supabaseAdmin.from("pick_notifications").select("id, symbol, kind, payload, sent_at").order("sent_at", {
    ascending: false
  }).limit(200)]);
  const items = [];
  for (const p of posR.data ?? []) {
    items.push({
      id: `pos-open-${p.id}`,
      kind: "position_open",
      ts: p.entry_at ?? (/* @__PURE__ */ new Date()).toISOString(),
      symbol: p.symbol,
      title: `🛒 سجّلت شراء ${p.symbol}`,
      detail: `الكميه ${Number(p.quantity)} سهم · سعر الدخول ${Number(p.entry_price).toFixed(2)} ج.م${p.notes ? ` · ${p.notes}` : ""}`
    });
    if (p.status === "closed" && p.exit_at) {
      const pnl = p.pnl_pct != null ? Number(p.pnl_pct) : 0;
      items.push({
        id: `pos-close-${p.id}`,
        kind: "position_close",
        ts: p.exit_at,
        symbol: p.symbol,
        title: `📤 أقفلت صفقة ${p.symbol} (${p.exit_reason ?? "manual"})`,
        detail: `سعر الخروج ${p.exit_price != null ? Number(p.exit_price).toFixed(2) : "—"} · ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`
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
      detail: `السعر المقترح ${a.suggested_exit_price != null ? Number(a.suggested_exit_price).toFixed(2) : "—"} · ${a.pnl_pct != null ? Number(a.pnl_pct).toFixed(2) : "0"}%`
    });
  }
  for (const n of picksR.data ?? []) {
    if (typeof n.kind === "string" && n.kind.startsWith("monitor:hb_")) continue;
    items.push({
      id: `pick-${n.id}`,
      kind: "pick_notification",
      ts: n.sent_at,
      symbol: n.symbol,
      title: `📊 إشعار ترشيح ${n.symbol} (${n.kind})`,
      detail: n.payload && typeof n.payload === "object" ? JSON.stringify(n.payload).slice(0, 180) : ""
    });
  }
  items.sort((a, b) => a.ts < b.ts ? 1 : -1);
  return {
    items: items.slice(0, 300)
  };
});
const dailyPnl_createServerFn_handler = createServerRpc({
  id: "4870ca91aee46fb7bc64953938bca4df042ce4a02210fe46e1f5c1f4a541a57d",
  name: "dailyPnl",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => dailyPnl.__executeServer(opts));
const dailyPnl = createServerFn({
  method: "GET"
}).handler(dailyPnl_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("positions").select("symbol, entry_price, exit_price, quantity, pnl_pct, exit_date, exit_at").eq("status", "closed").not("exit_date", "is", null).order("exit_date", {
    ascending: false
  });
  if (error) throw new Error(error.message);
  const map = /* @__PURE__ */ new Map();
  for (const p of data ?? []) {
    const day = p.exit_date;
    const entry = Number(p.entry_price);
    const exit = p.exit_price != null ? Number(p.exit_price) : entry;
    const qty = Number(p.quantity);
    const realized = (exit - entry) * qty;
    const row = map.get(day) ?? {
      day,
      trades: 0,
      realized_egp: 0,
      avg_pnl_pct: 0,
      symbols: []
    };
    row.trades += 1;
    row.realized_egp += realized;
    row.avg_pnl_pct += Number(p.pnl_pct ?? 0);
    if (!row.symbols.includes(p.symbol)) row.symbols.push(p.symbol);
    map.set(day, row);
  }
  const rows = Array.from(map.values()).map((r) => ({
    ...r,
    avg_pnl_pct: r.trades > 0 ? r.avg_pnl_pct / r.trades : 0
  }));
  rows.sort((a, b) => a.day < b.day ? 1 : -1);
  return {
    days: rows
  };
});
const evaluatePositions_createServerFn_handler = createServerRpc({
  id: "eda5aee35a0be88f6267b3aa53d7129925a40fa6b52adbbecb90dd35c04a3703",
  name: "evaluatePositions",
  filename: "src/lib/positions/positions.functions.ts"
}, (opts) => evaluatePositions.__executeServer(opts));
const evaluatePositions = createServerFn({
  method: "POST"
}).handler(evaluatePositions_createServerFn_handler, async () => {
  const {
    data: positions,
    error
  } = await supabaseAdmin.from("positions").select("*").eq("status", "open");
  if (error) throw new Error(error.message);
  if (!positions || positions.length === 0) {
    return {
      evaluated: 0,
      alerts_created: 0
    };
  }
  const symbols = [...new Set(positions.map((p) => p.symbol))];
  const {
    data: snaps
  } = await supabaseAdmin.from("stock_snapshots").select("symbol, close, ts").in("symbol", symbols).order("ts", {
    ascending: false
  });
  const latestPrice = /* @__PURE__ */ new Map();
  for (const s of snaps ?? []) {
    if (!latestPrice.has(s.symbol)) latestPrice.set(s.symbol, Number(s.close));
  }
  let alertsCreated = 0;
  for (const pos of positions) {
    const price = latestPrice.get(pos.symbol);
    if (price == null) continue;
    const entry = Number(pos.entry_price);
    const pnl = (price - entry) / entry * 100;
    const prevHigh = pos.highest_price != null ? Number(pos.highest_price) : entry;
    const newHigh = Math.max(prevHigh, price);
    let trailing = pos.trailing_stop != null ? Number(pos.trailing_stop) : null;
    if (pnl >= 7 && (trailing == null || trailing < entry * 1.03)) {
      trailing = entry * 1.03;
    }
    if (pnl >= 12 && (trailing == null || trailing < entry * 1.07)) {
      trailing = entry * 1.07;
    }
    await supabaseAdmin.from("positions").update({
      current_price: price,
      current_price_at: (/* @__PURE__ */ new Date()).toISOString(),
      highest_price: newHigh,
      pnl_pct: pnl,
      trailing_stop: trailing
    }).eq("id", pos.id);
    const triggers = [];
    if (pos.target_price != null && price >= Number(pos.target_price)) {
      triggers.push({
        type: "target_hit",
        message: `🎯 السهم ${escapeHtml(pos.symbol)} وصل الهدف! حقق ${pnl.toFixed(2)}% — يُنصح بالبيع`,
        cond: true
      });
    }
    if (pos.stop_loss != null && price <= Number(pos.stop_loss)) {
      triggers.push({
        type: "stop_loss",
        message: `🛑 السهم ${escapeHtml(pos.symbol)} وصل وقف الخسارة (${pnl.toFixed(2)}%) — يجب البيع فوراً`,
        cond: true
      });
    }
    if (trailing != null && price <= trailing && pnl > 0) {
      triggers.push({
        type: "trailing_stop",
        message: `🔒 السهم ${escapeHtml(pos.symbol)} لمس التريلينج ستوب — احتفظ بالربح (${pnl.toFixed(2)}%)`,
        cond: true
      });
    }
    if (pos.max_hold_days != null) {
      const days = Math.floor((Date.now() - new Date(pos.entry_date).getTime()) / (1e3 * 60 * 60 * 24));
      if (days >= pos.max_hold_days) {
        triggers.push({
          type: "time_exit",
          message: `⏰ مرّ ${days} يوم على شراء ${escapeHtml(pos.symbol)} (${pnl.toFixed(2)}%) — راجع الموقف`,
          cond: true
        });
      }
    }
    for (const t of triggers) {
      const {
        data: existing
      } = await supabaseAdmin.from("sell_alerts").select("id").eq("position_id", pos.id).eq("alert_type", t.type).gte("created_at", new Date(Date.now() - 24 * 3600 * 1e3).toISOString()).limit(1);
      if (existing && existing.length > 0) continue;
      await supabaseAdmin.from("sell_alerts").insert({
        position_id: pos.id,
        symbol: pos.symbol,
        alert_type: t.type,
        message_ar: t.message,
        suggested_exit_price: price,
        pnl_pct: pnl
      });
      alertsCreated++;
      void sendTelegram(`<b>${t.type === "target_hit" ? "🎯 وصل الهدف" : t.type === "stop_loss" ? "🛑 وقف الخسارة" : t.type === "trailing_stop" ? "🔒 تريلينج ستوب" : "⏰ تنبيه وقت"}</b>
${escapeHtml(t.message)}

💵 السعر الحالي: <b>${price.toFixed(2)}</b>
📈 الربح/الخسارة: <b>${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%</b>
🛒 الدخول: ${entry.toFixed(2)} · الكمية: ${Number(pos.quantity)}`);
    }
  }
  return {
    evaluated: positions.length,
    alerts_created: alertsCreated
  };
});
export {
  acknowledgeAlert_createServerFn_handler,
  closePosition_createServerFn_handler,
  dailyPnl_createServerFn_handler,
  deletePosition_createServerFn_handler,
  evaluatePositions_createServerFn_handler,
  listActivity_createServerFn_handler,
  listPositions_createServerFn_handler,
  openPosition_createServerFn_handler
};
