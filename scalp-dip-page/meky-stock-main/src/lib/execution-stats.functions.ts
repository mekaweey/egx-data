import { createServerFn } from "@tanstack/react-start";

export type ExecutionStats = {
  snapshots_today: number;
  orders_today: number;
  orders_by_status: Record<string, number>;
  orders_by_type: Record<string, number>;
  avg_time_to_first_fill_ms: number | null;
  avg_slippage_vs_touch: number | null;
  recent_orders: Array<{
    id: string;
    symbol: string;
    side: string;
    order_type: string;
    status: string;
    requested_price: number | null;
    requested_qty: number;
    fill_price_avg: number | null;
    filled_qty: number | null;
    placed_at: string;
    time_to_first_fill_ms: number | null;
    slippage_vs_touch: number | null;
    best_bid_at_placement: number | null;
    best_ask_at_placement: number | null;
  }>;
};

export const getExecutionStats = createServerFn({ method: "GET" }).handler(async (): Promise<ExecutionStats> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [snapCount, orders, recent] = await Promise.all([
    supabaseAdmin.from("orderbook_snapshots").select("id", { count: "exact", head: true }).gte("ts", sinceIso),
    supabaseAdmin.from("order_lifecycle").select("status, order_type").gte("placed_at", sinceIso),
    supabaseAdmin.from("fill_analysis_v")
      .select("order_id, symbol, side, order_type, status, requested_price, requested_qty, fill_price_avg, filled_qty, placed_at, time_to_first_fill_ms, slippage_vs_touch, best_bid_at_placement, best_ask_at_placement")
      .order("placed_at", { ascending: false })
      .limit(20),
  ]);

  const by_status: Record<string, number> = {};
  const by_type: Record<string, number> = {};
  for (const o of orders.data ?? []) {
    by_status[o.status] = (by_status[o.status] ?? 0) + 1;
    by_type[o.order_type] = (by_type[o.order_type] ?? 0) + 1;
  }
  const fills = (recent.data ?? []).filter((r) => r.time_to_first_fill_ms != null);
  const avgTtff = fills.length ? fills.reduce((s, r) => s + Number(r.time_to_first_fill_ms), 0) / fills.length : null;
  const slips = (recent.data ?? []).filter((r) => r.slippage_vs_touch != null);
  const avgSlip = slips.length ? slips.reduce((s, r) => s + Number(r.slippage_vs_touch), 0) / slips.length : null;

  return {
    snapshots_today: snapCount.count ?? 0,
    orders_today: (orders.data ?? []).length,
    orders_by_status: by_status,
    orders_by_type: by_type,
    avg_time_to_first_fill_ms: avgTtff,
    avg_slippage_vs_touch: avgSlip,
    recent_orders: (recent.data ?? []).map((r) => ({
      id: r.order_id as string,
      symbol: r.symbol as string,
      side: r.side as string,
      order_type: r.order_type as string,
      status: r.status as string,
      requested_price: r.requested_price as number | null,
      requested_qty: Number(r.requested_qty),
      fill_price_avg: r.fill_price_avg as number | null,
      filled_qty: r.filled_qty as number | null,
      placed_at: r.placed_at as string,
      time_to_first_fill_ms: r.time_to_first_fill_ms as number | null,
      slippage_vs_touch: r.slippage_vs_touch as number | null,
      best_bid_at_placement: r.best_bid_at_placement as number | null,
      best_ask_at_placement: r.best_ask_at_placement as number | null,
    })),
  };
});