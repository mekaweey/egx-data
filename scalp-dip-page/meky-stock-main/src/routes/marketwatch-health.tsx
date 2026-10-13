import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DATA_TABLE_NAMES } from "@/lib/data-tables.config";

type Health = {
  window_seconds?: number;
  raw_scan_count?: number;
  live_price_coverage?: {
    window_seconds: number;
    symbols: number;
    stocks: number;
    age_seconds: number | null;
    from_marketwatch: number;
    from_quotes: number;
    from_ticks: number;
  };
  now: string;
  last_captured_at: string | null;
  age_seconds: number | null;
  stale: boolean;
  marketwatch_volume_confirmed?: boolean;
  last_60s: {
    rows: number;
    distinct_symbols: number;
    with_volume: number;
    with_trades: number;
    with_price: number;
    same_day?: number;
  };
  last_5m: { rows: number; expected_approx: number };
  tv_bridge?: {
    last_ts: string | null;
    age_seconds: number | null;
    distinct_symbols_60s: number;
    fresh: boolean;
  };
  freshest_price_age_seconds?: number | null;
  live_ticks?: {
    last_ts: string | null;
    age_seconds: number | null;
    rows_60s: number;
    distinct_symbols_60s: number;
    with_price_60s: number;
    with_volume_60s: number;
    volume_confirmed: boolean;
  };
  marketwatch_bid_ask?: {
    with_bid: number;
    with_ask: number;
    with_bid_ask: number;
  };
  orderbook?: {
    last_ts: string | null;
    age_seconds: number | null;
    rows_window: number;
    distinct_symbols_window: number;
    with_bid_window: number;
  };
  live_quotes?: {
    last_ts: string | null;
    age_seconds: number | null;
    rows_window: number;
    distinct_symbols_window: number;
    with_bid_ask_window: number;
  };
  universe: {
    total_sharia: number;
    covered: number;
    coverage_pct: number;
    missing_count: number;
    missing_sample: string[];
  };
  verdict: string;
  smart_exit?: {
    flags: { enabled: boolean; shadow: boolean; prebuy: boolean };
    today_counts: { HARD_FLOOR: number; VOLUME_DEATH: number; PREBUY_VOLUME_FILTER: number };
    recent: Array<{
      ts: string;
      symbol: string;
      rule: string;
      action: string;
      shadow: boolean;
      price: number | null;
      pnl_pct: number | null;
      seconds_since_entry: number | null;
      mw_trades_5m: number | null;
      mw_volume_5m: number | null;
    }>;
  };
};

export const Route = createFileRoute("/marketwatch-health")({
  head: () => ({
    meta: [
      { title: "Marketwatch Live Health" },
      { name: "description", content: "فحص لحظي لتدفق بيانات volume من الإكستنشن" },
    ],
  }),
  component: Page,
});

function Page() {
  const [h, setH] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState<boolean>(false);
  const [authAlert, setAuthAlert] = useState<{
    latest: { ts: string; kind: string; message: string | null; url: string | null } | null;
    age_seconds: number | null;
  } | null>(null);

  // Storage badge state
  const [storageInfo, setStorageInfo] = useState<{
    total_bytes: number;
    human_size: string;
    used_mb: number;
    percent: number;
    level: "green" | "yellow" | "red";
    message: string;
  } | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Fetch storage size from db-size endpoint
  const fetchStorageSize = async () => {
    try {
      const res = await fetch("/api/public/hooks/db-size");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to fetch storage size");

      const used_mb = Math.round(data.total_bytes / 1024 / 1024);
      const limit_mb = 500;
      const percent = Math.round((used_mb / limit_mb) * 100);

      let level: "green" | "yellow" | "red" = "green";
      let message = "";

      if (used_mb >= 450) {
        level = "red";
        message = "عاجل: لازم تنزّل البيانات دلوقتي قبل ما تمتلئ المساحة";
      } else if (used_mb >= 350) {
        level = "yellow";
        message = "قرّب الوقت لتنزيل البيانات من Supabase للهارد";
      }

      setStorageInfo({
        total_bytes: data.total_bytes,
        human_size: data.human_size,
        used_mb,
        percent,
        level,
        message,
      });
      setStorageError(null);
    } catch (e) {
      setStorageError(String((e as Error)?.message || e).slice(0, 200));
    }
  };

  // Initial fetch + refresh every 3 minutes
  useEffect(() => {
    fetchStorageSize();
    const interval = setInterval(fetchStorageSize, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // EGX open: Sun-Thu (0..4), 10:00 → 14:30 Cairo local time
  const isEgxOpen = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const wd = parts.find((p) => p.type === "weekday")?.value || "";
    const hh = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const mm = Number(parts.find((p) => p.type === "minute")?.value || 0);
    const dayOk = ["Sun", "Mon", "Tue", "Wed", "Thu"].includes(wd);
    const mins = hh * 60 + mm;
    return dayOk && mins >= 600 && mins <= 870; // 10:00 → 14:30
  };

  useEffect(() => {
    let alive = true;
    let abortMain: AbortController | null = null;
    let abortAuth: AbortController | null = null;

    setMarketOpen(isEgxOpen());

    const load = async () => {
      abortMain = new AbortController();
      try {
        const r = await fetch("/api/public/hooks/marketwatch-health", {
          cache: "no-store",
          signal: abortMain.signal,
        });
        const j = await r.json();
        if (alive) {
          setH(j);
          setErr(null);
          firstLoadDone = true;
        }
      } catch (e) {
        if (alive && (e as Error).name !== "AbortError") setErr((e as Error).message);
      }
    };

    // Load main health data FIRST
    let firstLoadDone = false;
    load();
    const iv = setInterval(() => {
      if (isEgxOpen()) load();
    }, 1000);

    // Load auth alert AFTER main data loads (non-blocking, lower priority)
    const loadAuth = async () => {
      if (!alive) return;
      abortAuth = new AbortController();
      try {
        // Defer to next tick so main load can grab connections first
        await new Promise((r) => setTimeout(r, 0));
        if (!alive) return;
        const r = await fetch("/api/public/hooks/thunder-auth-alert", {
          cache: "no-store",
          signal: abortAuth.signal,
        });
        const j = await r.json();
        if (alive) setAuthAlert({ latest: j.latest, age_seconds: j.age_seconds });
      } catch (e) {
        if (alive && (e as Error).name !== "AbortError") {
          // Silently ignore auth alert errors - non-critical
          console.debug("[thunder-auth-alert] skipped:", (e as Error).message);
        }
      }
    };

    // Start auth check AFTER initial main load
    const startAuthPolling = () => {
      loadAuth();
      const ivAuth = setInterval(loadAuth, 15_000);
      return ivAuth;
    };

    // Wait for first health load, then start auth polling
    let ivAuth: ReturnType<typeof setInterval> | null = null;
    const checkAndStartAuth = setInterval(() => {
      if (firstLoadDone) {
        clearInterval(checkAndStartAuth);
        ivAuth = startAuthPolling();
      }
    }, 500);

    const t = setInterval(() => {
      const open = isEgxOpen();
      setMarketOpen(open);
      if (open) setTick((x) => x + 1);
    }, 1000);

    return () => {
      alive = false;
      abortMain?.abort();
      abortAuth?.abort();
      clearInterval(iv);
      clearInterval(checkAndStartAuth);
      if (ivAuth) clearInterval(ivAuth);
      clearInterval(t);
    };
  }, []);

  const liveAge = h?.last_captured_at
    ? Math.round((Date.now() - new Date(h.last_captured_at).getTime()) / 1000)
    : null;
  const tickAge = h?.live_ticks?.last_ts
    ? Math.round((Date.now() - new Date(h.live_ticks.last_ts).getTime()) / 1000)
    : null;
  // live_ticks is event-based: the extension flushes in bursts (observed 10-30 min),
  // so a longer window is correct — the strategy relies on marketwatch (primary),
  // not on this supplementary stream. (Aligned 2026-09-17 after ingest fixed.)
  const TICK_FRESH_WINDOW_SEC = 1800;
  const isPriceLive = marketOpen && tickAge != null && tickAge <= TICK_FRESH_WINDOW_SEC;
  const healthWindow = h?.window_seconds ?? 150;
  const isMarketwatchVolumeConfirmed =
    marketOpen &&
    (h?.marketwatch_volume_confirmed === true ||
      (liveAge != null && liveAge <= healthWindow && (h?.last_60s.with_volume ?? 0) > 0));
  const isMarketwatchBidAskConfirmed =
    marketOpen &&
    liveAge != null &&
    liveAge <= healthWindow &&
    (h?.marketwatch_bid_ask?.with_bid_ask ?? 0) > 0;
  const isVolumeConfirmed =
    marketOpen && (isMarketwatchVolumeConfirmed || h?.live_ticks?.volume_confirmed === true);

  const toggle = async (key: string, next: boolean) => {
    setBusy(key);
    try {
      await fetch("/api/public/hooks/smart-exit-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: next }),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background p-6 font-sans">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">فحص Volume وBid/Ask لحظي</h1>

          <div className="flex items-center gap-2 text-sm">
            {/* Storage Badge */}
            {storageInfo && (
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  storageInfo.level === "green"
                    ? "bg-green-100 text-green-800"
                    : storageInfo.level === "yellow"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800 animate-pulse"
                }`}
                title={`المستخدمة: ${storageInfo.human_size} (${storageInfo.percent}%)`}
              >
                <span className="flex h-2 w-2 rounded-full bg-current" />
                <span>
                  سعة Supabase: {storageInfo.used_mb} MB / 500 MB ({storageInfo.percent}%)
                </span>
                {storageInfo.message && (
                  <span className="font-semibold">{storageInfo.message}</span>
                )}
              </div>
            )}
            {storageError && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <span className="flex h-2 w-2 rounded-full bg-current" />
                <span>تعذر قراءة سعة التخزين</span>
              </div>
            )}
            <Link to="/shadow-report" className="rounded border px-2 py-1 text-xs hover:bg-muted">
              📊 Shadow Report
            </Link>
            <Link to="/trade-lifecycle" className="rounded border px-2 py-1 text-xs hover:bg-muted">
              🔎 Trade Lifecycle
            </Link>
            <Link to="/slippage-report" className="rounded border px-2 py-1 text-xs hover:bg-muted">
              📐 Slippage
            </Link>
            <Link to="/missed-signals" className="rounded border px-2 py-1 text-xs hover:bg-muted">
              🎯 Missed Signals
            </Link>
            <Link to="/decision-engine" className="rounded border px-2 py-1 text-xs hover:bg-muted">
              🧠 Decision Engine
            </Link>
            <Link to="/reconciliation" className="rounded border px-2 py-1 text-xs hover:bg-muted">
              📒 Reconciliation
            </Link>
            <Link to="/signal-quality" className="rounded border px-2 py-1 text-xs hover:bg-muted">
              ⭐ Signal Quality
            </Link>
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                !marketOpen
                  ? "bg-gray-500"
                  : isPriceLive
                    ? "animate-pulse bg-green-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-muted-foreground">
              {!marketOpen
                ? "السوق مغلق · آخر بيانات محفوظة"
                : `${isPriceLive ? "السعر متصل" : "السعر غير متصل"} · تحديث كل ثانية · ${tick}`}
            </span>
          </div>
        </header>

        {err && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-500">
            خطأ: {err}
          </div>
        )}

        {authAlert?.latest && authAlert.age_seconds != null && authAlert.age_seconds <= 300 && (
          <div className="animate-pulse rounded-lg border-2 border-red-600 bg-red-600/15 p-4 text-red-500">
            <div className="text-lg font-bold">🚨 انتهت جلسة ثاندر — سجّل دخول فوراً</div>
            <div className="mt-1 text-sm">
              آخر تنبيه من {authAlert.age_seconds}ث ·{" "}
              {authAlert.latest.message ?? authAlert.latest.kind}
            </div>
            {authAlert.latest.url && (
              <a
                href={authAlert.latest.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
              >
                افتح تاب ثاندر
              </a>
            )}
          </div>
        )}

        {h && (
          <>
            <div
              className={`rounded-lg border p-4 text-lg font-semibold ${
                !marketOpen
                  ? "border-gray-500/40 bg-gray-500/10 text-muted-foreground"
                  : isVolumeConfirmed
                    ? "border-green-500/40 bg-green-500/10 text-green-600"
                    : isPriceLive
                      ? "border-green-500/40 bg-green-500/10 text-green-600"
                      : "border-yellow-500/40 bg-yellow-500/10 text-yellow-600"
              }`}
            >
              {!marketOpen ? "🌙 السوق مغلق — البيانات المعروضة هي آخر snapshot محفوظ" : h.verdict}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat
                label="إجمالي الأسهم المرصودة (Raw Scan)"
                value={String(h.raw_scan_count ?? 0)}
                good={(h.raw_scan_count ?? 0) >= 100 /* realistic: aligned to the actually polled watchlist size (150-165), aligned 2026-09-17 */}
              />
              <Stat
                label="عمر آخر سعر حي (الإكستنشن)"
                value={!marketOpen || h.live_price_coverage?.age_seconds == null ? "—" : `${h.live_price_coverage?.age_seconds}ث`}
                good={marketOpen ? ((h.live_price_coverage?.age_seconds ?? 9999) <= 120) : undefined}
              />
              <Stat
                label={`جسر TV بدون جهاز/${healthWindow}ث`}
                value={String(h.tv_bridge?.distinct_symbols_60s ?? 0)}
                good={h.tv_bridge?.fresh === true}
              />
              {/* STANDING RULE (2026-09-20): Two SEPARATE, permanently visible metrics.
                   Card A = Firebase/Ticks ONLY — narrow, honest, ~10-12 symbols.
                   Card B = Broad union (marketwatch + quotes + ticks) — ~260-280 symbols.
                   NEVER merge these two into one card. See conversation-647ae812. */}
              <Stat
                label={`قديم/معطل — أسهم Firebase/Ticks فقط (${h.live_ticks?.age_seconds != null ? h.live_ticks.age_seconds + 'ث' : '—'})`}
                value={String(h.live_ticks?.distinct_symbols_60s ?? 0)}
                good={marketOpen ? (h.live_ticks?.distinct_symbols_60s ?? 0) > 0 : undefined}
              />
              <Stat
                label={`تغطية الأسعار المجمعة (كل المصادر/${h.live_price_coverage?.window_seconds ?? 900}ث)`}
                value={String(h.live_price_coverage?.symbols ?? 0)}
                good={(h.live_price_coverage?.symbols ?? 0) >= 100}
              />
              <Stat
                label={`تغطية Marketwatch الفعالة`}
                value={`${h.universe.covered} / ${h.universe.total_sharia}`}
                good={isVolumeConfirmed}
              />
              <Stat
                label={`Marketwatch/${healthWindow}ث`}
                value={`${h.universe.covered} / ${h.universe.total_sharia}`}
                good={h.universe.coverage_pct >= 40 /* realistic: coverage is bounded by the subscribed Thndr watchlist, not by a fixed list (aligned 2026-09-17) */}
              />
              <Stat
                label={`L2/${healthWindow}ث`}
                value={String(h.orderbook?.distinct_symbols_window ?? 0)}
                good={(h.orderbook?.distinct_symbols_window ?? 0) > 0}
              />
              <Stat
                label={`Bid/Ask Marketwatch/${healthWindow}ث`}
                value={String(h.marketwatch_bid_ask?.with_bid_ask ?? 0)}
                good={isMarketwatchBidAskConfirmed}
              />
              <Stat
                label={`قديم/معطل — Bid/Ask Firebase/${healthWindow}ث`}
                value={String(h.live_quotes?.with_bid_ask_window ?? 0)}
              />
              <Stat
                label="Marketwatch فيه volume"
                value={String(h.last_60s.with_volume)}
                good={h.last_60s.with_volume > 0}
              />
              <Stat
                label="Marketwatch فيه سعر"
                value={String(h.last_60s.with_price)}
                good={h.last_60s.with_price > 0}
              />
              <Stat
                label="نفس يوم التداول"
                value={String(h.last_60s.same_day ?? 0)}
                good={(h.last_60s.same_day ?? 0) > 0}
              />
              <Stat label="صفوف/90ث" value={String(h.last_60s.rows)} />
              <Stat label="صفوف/5د" value={String(h.last_5m.rows)} />
              <Stat label="متوقع/5د" value={`~${h.last_5m.expected_approx}`} />
              <Stat
                label="تغطية"
                value={`${h.universe.coverage_pct}%`}
                good={h.universe.coverage_pct >= 40 /* realistic: coverage is bounded by the subscribed Thndr watchlist, not by a fixed list (aligned 2026-09-17) */}
              />
            </div>

            {h.universe.missing_sample.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="mb-2 text-sm text-muted-foreground">
                  أسهم مش موصلة ({h.universe.missing_count}) — أول 20:
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {h.universe.missing_sample.map((s) => (
                    <span key={s} className="rounded bg-muted px-2 py-1 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              آخر captured_at: {h.last_captured_at ?? "لا يوجد"}
            </div>

            {marketOpen && !isVolumeConfirmed && (
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm leading-7 text-yellow-600">
                السعر الحي واصل من ثاندر، لكن لا يوجد Marketwatch Volume مؤكد حتى الآن. الإصدار
                v4.6.2 Ultimate Safe يجلب البيانات مباشرة من API ثاندر لضمان تغطية 100% للسوق؛ تأكد
                من تحميل الإصدار الجديد من صفحة الإكستنشن.
              </div>
            )}

            {h.smart_exit && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">🧠 النظام الذكي للخروج</h2>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      !h.smart_exit.flags.enabled
                        ? "bg-red-500/20 text-red-500"
                        : h.smart_exit.flags.shadow
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-green-500/20 text-green-600"
                    }`}
                  >
                    {!h.smart_exit.flags.enabled
                      ? "⏸ متوقف"
                      : h.smart_exit.flags.shadow
                        ? "👁 وضع ظلي (تسجيل فقط)"
                        : "▶ نشط"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <ToggleRow
                    label="تفعيل النظام الذكي"
                    desc="الـ Kill Switch الرئيسي"
                    on={h.smart_exit.flags.enabled}
                    busy={busy === "scalp-dip-smart-exit"}
                    onToggle={() => toggle("scalp-dip-smart-exit", !h.smart_exit!.flags.enabled)}
                  />
                  <ToggleRow
                    label="الوضع الظلي"
                    desc="سجّل بس، متنفذش"
                    on={h.smart_exit.flags.shadow}
                    busy={busy === "scalp-dip-smart-exit-shadow"}
                    onToggle={() =>
                      toggle("scalp-dip-smart-exit-shadow", !h.smart_exit!.flags.shadow)
                    }
                  />
                  <ToggleRow
                    label="فلتر الفوليوم قبل الشراء"
                    desc="تجاهل الأسهم الميتة"
                    on={h.smart_exit.flags.prebuy}
                    busy={busy === "scalp-dip-prebuy-volume-filter"}
                    onToggle={() =>
                      toggle("scalp-dip-prebuy-volume-filter", !h.smart_exit!.flags.prebuy)
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded bg-muted p-2">
                    <div className="text-muted-foreground">إشارات مرفوضة (فوليوم)</div>
                    <div className="text-lg font-bold">
                      {h.smart_exit.today_counts.PREBUY_VOLUME_FILTER}
                    </div>
                  </div>
                  <div className="rounded bg-muted p-2">
                    <div className="text-muted-foreground">Hard Floor</div>
                    <div className="text-lg font-bold">{h.smart_exit.today_counts.HARD_FLOOR}</div>
                  </div>
                  <div className="rounded bg-muted p-2">
                    <div className="text-muted-foreground">Volume Death</div>
                    <div className="text-lg font-bold">
                      {h.smart_exit.today_counts.VOLUME_DEATH}
                    </div>
                  </div>
                </div>

                {h.smart_exit.recent.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">آخر 15 قرار:</div>
                    <div className="max-h-64 overflow-auto rounded border">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-muted text-muted-foreground">
                          <tr>
                            <th className="p-1 text-right">الوقت</th>
                            <th className="p-1 text-right">السهم</th>
                            <th className="p-1 text-right">القاعدة</th>
                            <th className="p-1 text-right">الإجراء</th>
                            <th className="p-1 text-right">P&amp;L</th>
                            <th className="p-1 text-right">Trades/5د</th>
                          </tr>
                        </thead>
                        <tbody>
                          {h.smart_exit.recent.map((r, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-1 font-mono">
                                {new Date(r.ts).toLocaleTimeString("ar-EG")}
                              </td>
                              <td className="p-1 font-mono font-bold">{r.symbol}</td>
                              <td className="p-1">{r.rule}</td>
                              <td
                                className={`p-1 ${r.shadow ? "text-yellow-600" : "text-red-500"}`}
                              >
                                {r.action}
                              </td>
                              <td className="p-1 tabular-nums">
                                {r.pnl_pct != null ? `${(r.pnl_pct * 100).toFixed(2)}%` : "—"}
                              </td>
                              <td className="p-1 tabular-nums">{r.mw_trades_5m ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded bg-muted/50 p-2 text-xs leading-6 text-muted-foreground">
                  <b>القواعد:</b> Hard Floor خروج فوري لو الخسارة ≥ 1.5% · Volume Death خروج
                  breakeven لو عدّى 10د بدون trades · فلتر الفوليوم يتجاهل الإشارات في الأسهم الميتة
                  قبل الدخول. ابدأ بالوضع الظلي أسبوع للمقارنة قبل التفعيل الحقيقي.
                </div>
              </div>
            )}
          </>
        )}

        {!h && !err && <div className="text-muted-foreground">جاري التحميل…</div>}

        <div className="mt-4 border-t border-border/60 pt-6">
          <HistoryExportSection />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-xl font-bold tabular-nums ${
          good === true ? "text-green-600" : good === false ? "text-red-500" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  busy,
  onToggle,
}: {
  label: string;
  desc: string;
  on: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={busy}
      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-right transition ${
        on ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"
      } ${busy ? "opacity-50" : "hover:brightness-110"}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className={`text-xs ${on ? "text-green-600" : "text-red-500"}`}>
          {on ? "ON" : "OFF"}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}

const EXPORT_TABLES = DATA_TABLE_NAMES;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysStr(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

interface ExportBreakdownRow {
  date: string;
  source: string;
  cached?: boolean;
  rows: number;
}
interface ExportTableFile {
  table: string;
  rows: number;
  columns: string[];
  csv: string;
  breakdown: ExportBreakdownRow[];
}
interface ExportPayload {
  ok: boolean;
  local: boolean;
  reason?: string;
  from?: string;
  to?: string;
  tables?: ExportTableFile[];
  gaps?: Array<{ table: string; date: string }>;
  unifiedCsv?: string;
  /** STAGE D: per-symbol data-quality companion CSV + plain-language readme */
  qualityCsv?: string;
  qualityReadme?: string;
  errors?: Array<{ table: string; error: string }>;
}

/** Mirror of archive-runner.server.ts ProgressEvent (client-side copy). */
type ArchiveProgress = {
  type: "table_start" | "table_progress" | "table_done" | "all_done" | "error" | "connected";
  table?: string;
  phase?: "fetch" | "export" | "delete";
  totalRows?: number;
  eligibleRows?: number;
  fetchedRows?: number;
  exportedRows?: number;
  deletedRows?: number;
  currentTable?: number;
  totalTables?: number;
  dbSize?: { pretty: string; bytes: number };
  summary?: {
    success: boolean;
    startTime: string;
    endTime: string;
    cutoffDate: string;
    dbSizeBefore: { pretty: string; bytes: number };
    dbSizeAfter: { pretty: string; bytes: number };
    spaceFreedBytes: number;
    dbSizeFreedPretty: string;
    tables: Array<{
      table: string;
      totalInDb: number;
      olderThan2Days: number;
      rowsExported: number;
      rowsDeleted: number;
      partitionsAffected: string[];
      errors?: string;
    }>;
    archiveDir: string;
  };
  error?: string;
  dryRun?: boolean;
  olderThanHours?: number;
};

function HistoryExportSection() {
  const [open, setOpen] = useState(false);
  const [tables, setTables] = useState<string[]>(["live_ticks"]);
  const [mode, setMode] = useState<"single" | "last" | "custom">("single");
  const [singleDate, setSingleDate] = useState(todayStr());
  const [lastN, setLastN] = useState(7);
  const [customStart, setCustomStart] = useState(addDaysStr(todayStr(), -7));
  const [customEnd, setCustomEnd] = useState(todayStr());
  const exportMode = "unified" as const;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [local, setLocal] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<ExportPayload | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  // Column-select mode for the streaming export.
  //   all     — every column (heaviest, ~138 MB gz for 10 days)
  //   core    — drop JSON/string columns, keep numeric & time (~11 MB)
  //   minimal — only id+symbol+price+volume+ts (~9 MB)
  const [directSelect, setDirectSelect] = useState<"all" | "core" | "minimal">("core");

  // Archive trigger state
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveReady, setArchiveReady] = useState<boolean | null>(null);
  const [archiveProgress, setArchiveProgress] = useState<ArchiveProgress[]>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // Full cleanup state
  const [isFullCleaning, setIsFullCleaning] = useState(false);
  const [fullCleanError, setFullCleanError] = useState<string | null>(null);
  const [fullCleanProgress, setFullCleanProgress] = useState<ArchiveProgress[]>([]);

  useEffect(() => {
    fetch("/api/public/hooks/export-history", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setLocal(j?.local === true))
      .catch(() => setLocal(false));
  }, []);

  useEffect(() => {
    fetch("/api/public/hooks/archive-trigger", { cache: "no-store" })
      .then((r) => setArchiveReady(r.ok))
      .catch(() => setArchiveReady(false));
  }, []);

  const startDate =
    mode === "single"
      ? singleDate
      : mode === "last"
        ? addDaysStr(todayStr(), -(Math.max(1, Math.min(180, lastN)) - 1))
        : customStart;
  const endDate = mode === "single" ? singleDate : mode === "last" ? todayStr() : customEnd;

  const toggleTable = (t: string) => {
    if (t === "all") {
      setTables(tables.length === EXPORT_TABLES.length ? [] : [...EXPORT_TABLES]);
    } else {
      setTables((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    }
  };

  // Export click handler — DOWNLOAD-FIRST, no native picker.
  // The File System Access API (showDirectoryPicker) has proven unreliable in
  // this environment (never shows / never settles / "user aborted"), so we
  // skip it entirely and deliver the merged CSVs via a plain <a download>,
  // which lands in the browser's default Downloads folder. Simpler and not
  // dependent on the (broken here) native API.
  const run = async () => {
    // Diagnostic: log the exact mode + resolved date range + tables BEFORE fetch.
    console.log("[export] handler-start-ms", Date.now(), {
      mode,
      startDate,
      endDate,
      tables,
      exportMode,
    });

    // Client-side guard: reject an inverted range before ever hitting fetch.
    if (startDate > endDate) {
      console.error("[export] INVALID_RANGE rejected before fetch:", { startDate, endDate });
      setErr("نطاق التاريخ غير صالح: البداية بعد النهاية.");
      setBusy(false);
      return;
    }

    setBusy(true);
    setErr(null);
    setSummary(null);
    setSaved([]);
    let res: Response | null = null;
    try {
      // Log right before the fetch in last-N mode specifically.
      console.log(
        "[export] about-to-fetch-ms",
        Date.now(),
        JSON.stringify({ startDate, endDate, tables, mode: exportMode }),
      );
      res = await fetch("/api/public/hooks/export-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables, start: startDate, end: endDate, mode: exportMode }),
      });
      console.log("[export] fetch-done-ms", Date.now());
      console.log("[export] response-status", res.status);
      const j = (await res.json()) as ExportPayload;
      console.log("[export] json-rows", j.tables?.reduce((n, t) => n + (t.rows || 0), 0) ?? 0);
      setSummary(j);
      if (!j.ok) {
        setErr(j.reason || "تصدير فشل — حاول اختيار جداول وتواريخ أقل.");
        return;
      }

      if (j.unifiedCsv) {
        // Unified export: download a single merged CSV containing all tables.
        const blob = new Blob([j.unifiedCsv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "unified_export.csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setSaved(["unified_export.csv"]);
      }
      // STAGE D: auto-download the data-quality companion as a second file
      // (readme header prepended as # comments so it opens as valid CSV text).
      if (j.qualityCsv) {
        const qBlob = new Blob(
          [(j.qualityReadme ? j.qualityReadme.split("\n").map((l) => "# " + l).join("\n") + "\n\n" : "") + j.qualityCsv],
          { type: "text/csv" },
        );
        const qUrl = URL.createObjectURL(qBlob);
        const qa = document.createElement("a");
        qa.href = qUrl;
        qa.download = `data_quality_${startDate}_to_${endDate}.csv`;
        qa.click();
        setTimeout(() => URL.revokeObjectURL(qUrl), 5000);
        setSaved((prev) => [...prev, `data_quality_${startDate}_to_${endDate}.csv`]);
      }
    } catch (e) {
      console.error("[export] fetch-error", e);
      setErr(String((e as Error)?.message || e));
    } finally {
      console.log("[export] handler-done-ms", Date.now());
      setBusy(false);
    }
  };

  // Direct streaming export: triggers the browser's Save dialog (no
  // directory picker needed — the new endpoint sends a single CSV file
  // attachment with a sensible default name). Streams bytes from disk
  // via Node readStream, so memory is constant regardless of size.
  // Safe for years of data and 6 tables simultaneously.
  const runDirect = async () => {
    if (startDate > endDate) {
      setErr("نطاق التاريخ غير صالح: البداية بعد النهاية.");
      return;
    }
    if (!tables.length) {
      setErr("لم تختر أي جدول للتصدير.");
      return;
    }
    setBusy(true);
    setErr(null);
    setSummary(null);
    setSaved([]);
    try {
      const res = await fetch("/api/public/hooks/export-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables, start: startDate, end: endDate, select: directSelect }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setErr(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      const blob = await res.blob();
      const sizeMb = (blob.size / 1024 / 1024).toFixed(1);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = directSelect === "all" ? "csv" : "csv";
      a.download = `historical_${directSelect}_${startDate}_to_${endDate}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setSaved([`historical_${directSelect}_${startDate}_to_${endDate}.${ext}`]);
      console.log("[export-direct] saved", sizeMb, "MB, mode =", directSelect);
    } catch (e) {
      console.error("[export-direct] error", e);
      setErr(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  };

  // MKB2 binary export — uses /export-binary endpoint, which produces a
  // fully-streaming columnar archive (dictionary + delta + zigzag varint
  // + null bitmaps + zlib), several times smaller than CSV.gz. Lossless
  // by construction: every cell round-trips exactly.
  // Use the included scripts/decode-mkb2.cjs to convert back to CSV.
  const runBinary = async () => {
    if (startDate > endDate) {
      setErr("نطاق التاريخ غير صالح: البداية بعد النهاية.");
      return;
    }
    if (!tables.length) {
      setErr("لم تختر أي جدول للتصدير.");
      return;
    }
    setBusy(true);
    setErr(null);
    setSummary(null);
    setSaved([]);
    try {
      const res = await fetch("/api/public/hooks/export-binary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables, start: startDate, end: endDate }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setErr(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      const blob = await res.blob();
      const sizeMb = (blob.size / 1024 / 1024).toFixed(2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historical_${startDate}_to_${endDate}.mkb2`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setSaved([`historical_${startDate}_to_${endDate}.mkb2`]);
      console.log("[export-binary] saved", sizeMb, "MB, MKB2 format");
    } catch (e) {
      console.error("[export-binary] error", e);
      setErr(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  };

  // Full cleanup: export ALL data to disk, then VACUUM FULL
  const runFullClean = async () => {
    setIsFullCleaning(true);
    setFullCleanError(null);
    setFullCleanProgress([]);

    const url = `/api/public/hooks/vacuum-cleanup?dryRun=false`;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        setFullCleanError(`HTTP ${res.status}: ${res.statusText}`);
        return;
      }
      if (!res.body) {
        setFullCleanError("استجابة بدون محتوى - تعذر بدء البث.");
        return;
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event.trim();
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data) as ArchiveProgress;
              setFullCleanProgress((prev) => [...prev, parsed]);
            } catch {
              /* ignore */
            }
          }
        }
      }
    } catch (e) {
      setFullCleanError(String((e as Error)?.message || e));
    } finally {
      reader?.releaseLock();
      setIsFullCleaning(false);
    }
  };

  const runArchive = async (dryRun: boolean) => {
    setIsArchiving(true);
    setArchiveError(null);
    setArchiveProgress([]);

    const url = `/api/public/hooks/archive-trigger?dry_run=${dryRun}`;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        setArchiveError(`HTTP ${res.status}: ${res.statusText}`);
        return;
      }
      if (!res.body) {
        setArchiveError("استجابة بدون محتوى — تعذر بدء البث.");
        return;
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event.trim();
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data) as ArchiveProgress;
              setArchiveProgress((prev) => [...prev, parsed]);
            } catch {
              // ignore parse errors
            }
          } else if (line.startsWith("event: error")) {
            setArchiveError("خطأ في البث من الخادم");
          }
        }
      }
    } catch (e) {
      setArchiveError(String((e as Error)?.message || e));
    } finally {
      reader?.releaseLock();
      setIsArchiving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-right font-semibold"
      >
        <span>📦 تصدير بيانات تاريخية (Historical Data Export)</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {local === false && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm leading-6 text-yellow-600">
              هذه الميزة تعمل محليًا فقط (bun run dev). على موقع Render/الإنتاج لن تعمل نوافذ اختيار
              الملفات أو قراءة القرص D:. شغّل الموقع محليًا ثم عد هنا لاستخدام التصدير.
            </div>
          )}

          {local === true && (
            <>
              <div className="text-xs text-muted-foreground mb-1">اختر الجداول:</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleTable("all")}
                  className={`rounded border px-2 py-1 text-xs ${
                    tables.length === EXPORT_TABLES.length
                      ? "bg-blue-500/20 text-blue-600"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                >
                  الكل
                </button>
                {EXPORT_TABLES.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTable(t)}
                    className={`rounded border px-2 py-1 text-xs ${
                      tables.includes(t)
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-1 text-xs text-muted-foreground">نمط المدى:</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMode("single")}
                  className={`rounded border px-2 py-1 text-xs ${mode === "single" ? "bg-blue-500/20 text-blue-600" : "bg-muted/40"}`}
                >
                  يوم واحد
                </button>
                <button
                  onClick={() => setMode("last")}
                  className={`rounded border px-2 py-1 text-xs ${mode === "last" ? "bg-blue-500/20 text-blue-600" : "bg-muted/40"}`}
                >
                  آخر N يوم
                </button>
                <button
                  onClick={() => setMode("custom")}
                  className={`rounded border px-2 py-1 text-xs ${mode === "custom" ? "bg-blue-500/20 text-blue-600" : "bg-muted/40"}`}
                >
                  مدى مخصص
                </button>
              </div>

              <div className="grid gap-2 text-xs">
                {mode === "single" && (
                  <label>
                    التاريخ:
                    <input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="ml-2 rounded border bg-muted px-2 py-1"
                    />
                  </label>
                )}
                {mode === "last" && (
                  <label>
                    آخر
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={lastN}
                      onChange={(e) => setLastN(Number(e.target.value))}
                      className="w-16 rounded border bg-muted px-2 py-1 ml-2"
                    />
                    يوم
                  </label>
                )}
                {mode === "custom" && (
                  <div className="flex items-center gap-2">
                    <label>من:</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="rounded border bg-muted px-2 py-1"
                    />
                    <label>إلى:</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="rounded border bg-muted px-2 py-1"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={run}
                disabled={busy || !tables.length}
                className="w-full rounded px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "جارٍ التصدير…" : "تصدير"}
              </button>

              {/* Direct streaming export — bypasses the in-memory JSON response
                  and pipes the CSV straight from disk to the browser. Use this
                  for any range > a few days or any multi-table export. */}
              <button
                onClick={runDirect}
                disabled={busy || !tables.length}
                className="w-full rounded px-3 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                title="تنزيل streaming مباشر من القرص — CSV + gzip (~138 MB لـ 10 أيام × 6 جداول)"
              >
                {busy ? "جارٍ التنزيل المباشر…" : "⬇ تنزيل مباشر (CSV.gz)"}
              </button>

              {/* MKB2 binary export — several times smaller than CSV.gz.
                  Lossless by construction (canonical round-trip checks,
                  null bitmaps, int64-safe varints). Fully streamed, so
                  even year-long ranges are safe. Decode back to CSV with
                  scripts/decode-mkb2.cjs (Node, included). */}
              <button
                onClick={runBinary}
                disabled={busy || !tables.length}
                className="w-full rounded px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                title="تنزيل MKB2 (custom binary, columnar + dictionary + zlib) — أصغر بكثير من CSV.gz، lossless 100%، بدون استهلاك ذاكرة على السيرفر"
              >
                {busy ? "جارٍ التنزيل المضغوط…" : "⬇ تنزيل مضغوط جداً (MKB2)"}
              </button>

              {/* Column-select mode for the streaming export. Lets the user
                  pick the trade-off between file completeness and size. */}
              <div className="mt-1 text-xs text-muted-foreground">مستوى البيانات في الملف:</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDirectSelect("all")}
                  className={`rounded border px-2 py-1 text-xs ${
                    directSelect === "all"
                      ? "bg-emerald-500/20 text-emerald-600"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                  title="كل الأعمدة (138 MB gz لـ 10 أيام × 6 جداول)"
                >
                  كل البيانات
                </button>
                <button
                  onClick={() => setDirectSelect("core")}
                  className={`rounded border px-2 py-1 text-xs ${
                    directSelect === "core"
                      ? "bg-emerald-500/20 text-emerald-600"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                  title="بدون JSON/metadata — id+symbol+prices+volume+ts (11 MB gz)"
                >
                  بدون بيانات وصفية
                </button>
                <button
                  onClick={() => setDirectSelect("minimal")}
                  className={`rounded border px-2 py-1 text-xs ${
                    directSelect === "minimal"
                      ? "bg-emerald-500/20 text-emerald-600"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                  title="أعمدة أساسية فقط — id+symbol+price+volume+ts (9 MB gz)"
                >
                  أعمدة أساسية
                </button>
              </div>

              {/* Archive Trigger Section */}
              <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  أرشفة (يصدّر صفوف أقدم من 48h إلى CSV.gz ثم يحذفها)
                </div>
                {archiveReady === false && (
                  <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-600">
                    ميزة الأرشفة غير متاحة في هذه البيئة.
                  </div>
                )}
                {archiveReady === true && !isArchiving && (
                  <>
                    <button
                      onClick={() => runArchive(true)}
                      disabled={isArchiving}
                      className="w-full rounded px-3 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                    >
                      أرشفة تجريبية (بدون حذف)
                    </button>
                    <button
                      onClick={() => runArchive(false)}
                      disabled={isArchiving}
                      className="w-full rounded px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      أرشفة وحذف
                    </button>
                  </>
                )}

                {/* Full Cleanup Section */}
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    تنظيف شامل (ينزّل كل البيانات ثم VACUUM FULL)
                  </div>
                  {archiveReady === true && !isFullCleaning && !isArchiving && (
                    <button
                      onClick={runFullClean}
                      className="w-full rounded px-3 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      تنظيف شامل + أرشفة
                    </button>
                  )}
                  {isFullCleaning && (
                    <div className="text-xs text-green-600">
                      جارٍ التنظيف الشامل... {fullCleanProgress.length} حدثًا
                    </div>
                  )}
                  {fullCleanError && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-500">
                      {fullCleanError}
                    </div>
                  )}
                  {fullCleanProgress.length > 0 && (
                    <div className="max-h-64 overflow-y-auto rounded border border-border/40 bg-muted/30 p-2 text-xs">
                      <div className="font-mono whitespace-pre-wrap">
                        {fullCleanProgress.map((evt, i) => {
                          if (evt.type === "connected")
                            return <div key={i}>🔌 متصل - التنظيف الشامل</div>;
                          if (evt.type === "table_start")
                            return (
                              <div key={i}>
                                📊 [{evt.currentTable}/{evt.totalTables}] {evt.table}: بدأ
                              </div>
                            );
                          if (evt.type === "table_progress")
                            return (
                              <div key={i}>
                                {" "}
                                ↳ {evt.table} ({evt.phase}): {evt.fetchedRows ?? 0}
                              </div>
                            );
                          if (evt.type === "table_done")
                            return (
                              <div key={i}>
                                ✓ {evt.table}: صدر {evt.exportedRows ?? 0}
                              </div>
                            );
                          if (evt.type === "all_done" && evt.summary) {
                            const s = evt.summary;
                            return (
                              <div key={i}>
                                <div className="text-green-600 font-bold">✓✓✓ مكتمل!</div>
                                <div>المساحة قبل: {s.dbSizeBefore?.pretty}</div>
                                <div>المساحة بعد: {s.dbSizeAfter?.pretty}</div>
                                <div>
                                  تم توفير:{" "}
                                  {s.spaceFreedBytes
                                    ? Math.round(s.spaceFreedBytes / 1024 / 1024) + " MB"
                                    : "0 MB"}
                                </div>
                                <div>VACUUM: {(s as any).vacuumSuccess ? "نجاح" : "خطأ"}</div>
                                {s.tables.map((t, ti) => (
                                  <div key={ti}>
                                    {" "}
                                    - {t.table}: {t.rowsExported} صف مصدّر
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {isArchiving && (
                  <div className="text-xs text-blue-600">
                    جارٍ الأرشفة… {archiveProgress.length} حدثًا
                  </div>
                )}
                {archiveError && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-500">
                    {archiveError}
                  </div>
                )}
                {archiveProgress.length > 0 && (
                  <div className="max-h-64 overflow-y-auto rounded border border-border/40 bg-muted/30 p-2 text-xs">
                    <div className="font-mono whitespace-pre-wrap">
                      {archiveProgress.map((evt, i) => {
                        if (evt.type === "connected") return <div key={i}>🔌 متصل</div>;
                        if (evt.type === "table_start") {
                          return (
                            <div key={i}>
                              📊 [{evt.currentTable}/{evt.totalTables}] {evt.table}: بدأ -{" "}
                              {evt.phase} - {evt.totalRows} صف
                            </div>
                          );
                        }
                        if (evt.type === "table_progress") {
                          return (
                            <div key={i}>
                              {" "}
                              ↳ {evt.table} ({evt.phase}): {evt.fetchedRows ?? 0}→
                              {evt.exportedRows ?? 0}→{evt.deletedRows ?? 0}
                            </div>
                          );
                        }
                        if (evt.type === "table_done") {
                          return (
                            <div key={i}>
                              ✓ {evt.table}: أنهى - {evt.phase} - صدر {evt.exportedRows ?? 0}، حُذف{" "}
                              {evt.deletedRows ?? 0}
                            </div>
                          );
                        }
                        if (evt.type === "all_done" && evt.summary) {
                          const s = evt.summary;
                          return (
                            <div key={i}>
                              <div>
                                ✓✓✓ مكتمل! {s.success ? "نجاح" : "أخطاء"} - {s.startTime} →{" "}
                                {s.endTime}
                              </div>
                              <div>حُرر {s.dbSizeFreedPretty} من قاعدة البيانات</div>
                              <div>المجلد: {s.archiveDir}</div>
                              {s.tables.map((t) => (
                                <div key={t.table}>
                                  {t.table}: {t.totalInDb} مجموع / {t.olderThan2Days} أقدم / صدر{" "}
                                  {t.rowsExported} / حُذف {t.rowsDeleted}
                                  {t.errors && <span> ⚠ {t.errors}</span>}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        if (evt.type === "error") {
                          return (
                            <div key={i} className="text-red-600">
                              ⚠ {evt.error}
                            </div>
                          );
                        }
                        return <div key={i}>{JSON.stringify(evt)}</div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
              {err && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-500">
                  {err}
                </div>
              )}

              {summary?.ok && (
                <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 space-y-2 text-xs">
                  <div className="font-semibold text-green-700">
                    {"\u2705"} تم دمج {summary.tables?.reduce((n, t) => n + (t.rows || 0), 0) ?? 0}{" "}
                    صف في {summary.tables?.length ?? 0} جداول
                  </div>
                  {summary.from && summary.to && (
                    <div>
                      المدى: {summary.from} ← {summary.to}
                    </div>
                  )}
                  {summary.gaps && summary.gaps.length > 0 && (
                    <div className="text-yellow-600">
                      فجوات (لا توجد محليًا ولا في Supabase):{" "}
                      {summary.gaps.map((g) => `${g.table}@${g.date}`).join("، ")}
                    </div>
                  )}
                  {summary.errors && summary.errors.length > 0 && (
                    <div className="text-red-600">
                      أخطاء: {summary.errors.map((e) => `${e.table}: ${e.error}`).join("، ")}
                    </div>
                  )}
                  <div className="overflow-auto rounded border max-h-56">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted text-muted-foreground">
                        <tr>
                          <th className="p-1 text-right">الجداول</th>
                          <th className="p-1 text-right">التاريخ</th>
                          <th className="p-1 text-right">المصدر</th>
                          <th className="p-1 text-right">عدد الصفوف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.tables?.flatMap((t) =>
                          t.breakdown.map((b) => (
                            <tr key={`${t.table}-${b.date}`} className="border-t">
                              <td className="p-1 font-mono">{t.table}</td>
                              <td className="p-1 font-mono">{b.date}</td>
                              <td className="p-1">
                                {b.source === "local"
                                  ? "من القرص"
                                  : b.source === "cache"
                                    ? "جديد من Supabase (تم تخزينه محليًا)"
                                    : "فجوة"}
                              </td>
                              <td className="p-1 tabular-nums">{b.rows}</td>
                            </tr>
                          )),
                        )}
                      </tbody>
                    </table>
                  </div>
                  {saved.length > 0 && (
                    <div className="text-green-600">✓ حُفظت الملفات: {saved.join("، ")}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
