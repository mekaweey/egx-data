-- ============================================================
-- VIEW 1: depth_imbalance
-- نسبة إجمالي كميات الشراء إلى البيع في كتاب الطلبات
-- ============================================================
CREATE OR REPLACE VIEW public.depth_imbalance
WITH (security_invoker = on) AS
SELECT
  o.id,
  o.symbol,
  o.ts,
  o.best_bid,
  o.best_ask,
  o.spread,
  ROUND(COALESCE((
    SELECT SUM((elem->>'qty')::numeric)
    FROM jsonb_array_elements(o.bids_depth) elem
  ), 0)::numeric, 0) AS total_bid_qty,
  ROUND(COALESCE((
    SELECT SUM((elem->>'qty')::numeric)
    FROM jsonb_array_elements(o.asks_depth) elem
  ), 0)::numeric, 0) AS total_ask_qty,
  ROUND(
    NULLIF(COALESCE((
      SELECT SUM((elem->>'qty')::numeric)
      FROM jsonb_array_elements(o.bids_depth) elem
    ), 0), 0)
    / NULLIF(COALESCE((
      SELECT SUM((elem->>'qty')::numeric)
      FROM jsonb_array_elements(o.asks_depth) elem
    ), 0), 0)
  , 3) AS bid_ask_ratio,
  jsonb_array_length(o.bids_depth) AS bid_levels,
  jsonb_array_length(o.asks_depth) AS ask_levels
FROM public.orderbook_snapshots o
WHERE o.bids_depth IS NOT NULL AND o.asks_depth IS NOT NULL;

GRANT SELECT ON public.depth_imbalance TO authenticated;

-- ============================================================
-- VIEW 2: symbol_vwap_daily
-- VWAP لكل سهم لكل يوم تداول (توقيت القاهرة)
-- ============================================================
CREATE OR REPLACE VIEW public.symbol_vwap_daily
WITH (security_invoker = on) AS
SELECT
  symbol,
  (ts AT TIME ZONE 'Africa/Cairo')::date AS trade_date,
  COUNT(*) AS tick_count,
  SUM(volume) AS total_volume,
  ROUND((SUM(price * volume) / NULLIF(SUM(volume), 0))::numeric, 3) AS vwap,
  ROUND(MIN(price)::numeric, 3) AS day_low,
  ROUND(MAX(price)::numeric, 3) AS day_high,
  ROUND(AVG(price)::numeric, 3) AS avg_price
FROM public.live_ticks
WHERE volume IS NOT NULL AND volume > 0 AND price IS NOT NULL AND price > 0
GROUP BY symbol, (ts AT TIME ZONE 'Africa/Cairo')::date;

GRANT SELECT ON public.symbol_vwap_daily TO authenticated;

-- ============================================================
-- VIEW 3: opening_range
-- أعلى وأقل سعر في أول 15 دقيقة تداول (10:00-10:15 القاهرة)
-- ============================================================
CREATE OR REPLACE VIEW public.opening_range
WITH (security_invoker = on) AS
SELECT
  symbol,
  (ts AT TIME ZONE 'Africa/Cairo')::date AS trade_date,
  COUNT(*) AS ticks_in_range,
  ROUND(MIN(price)::numeric, 3) AS or_low,
  ROUND(MAX(price)::numeric, 3) AS or_high,
  ROUND((MAX(price) - MIN(price))::numeric, 3) AS or_range,
  ROUND(((MAX(price) - MIN(price)) / NULLIF(MIN(price), 0) * 100)::numeric, 3) AS or_range_pct,
  SUM(COALESCE(volume, 0)) AS or_volume,
  MIN(ts) AS or_start_ts,
  MAX(ts) AS or_end_ts
FROM public.live_ticks
WHERE price IS NOT NULL AND price > 0
  AND EXTRACT(HOUR FROM (ts AT TIME ZONE 'Africa/Cairo')) = 10
  AND EXTRACT(MINUTE FROM (ts AT TIME ZONE 'Africa/Cairo')) < 15
GROUP BY symbol, (ts AT TIME ZONE 'Africa/Cairo')::date;

GRANT SELECT ON public.opening_range TO authenticated;

-- ============================================================
-- VIEW 4: news_near_signal
-- الأخبار خلال ساعة قبل/بعد كل إشارة would_open
-- (مقصور على would_open علشان الأداء - 156 إشارة بدل 313k)
-- ============================================================
CREATE OR REPLACE VIEW public.news_near_signal
WITH (security_invoker = on) AS
SELECT
  s.id AS signal_id,
  s.symbol,
  s.ts AS signal_ts,
  s.decision,
  s.last_price,
  n.id AS news_id,
  n.headline,
  n.sentiment_score,
  n.published_at AS news_ts,
  ROUND(EXTRACT(EPOCH FROM (n.published_at - s.ts))::numeric, 0) AS delta_sec
FROM public.scalp_signal_log s
JOIN public.news_sentiment n
  ON n.symbol = s.symbol
 AND n.published_at BETWEEN s.ts - INTERVAL '1 hour' AND s.ts + INTERVAL '1 hour'
WHERE s.decision = 'would_open';

GRANT SELECT ON public.news_near_signal TO authenticated;

-- ============================================================
-- VIEW 5: signal_reversal_check
-- بعد كل صفقة رابحة (TP)، هل السعر رجع تحت exit_price خلال 5 دقايق؟
-- ============================================================
CREATE OR REPLACE VIEW public.signal_reversal_check
WITH (security_invoker = on) AS
SELECT
  pt.id AS trade_id,
  pt.symbol,
  pt.strategy,
  pt.entry_ts,
  pt.exit_ts,
  pt.exit_price,
  pt.pnl,
  (
    SELECT MIN(t.price)
    FROM public.live_ticks t
    WHERE t.symbol = pt.symbol
      AND t.ts > pt.exit_ts
      AND t.ts <= pt.exit_ts + INTERVAL '5 minutes'
      AND t.price IS NOT NULL
  ) AS min_price_next_5min,
  (
    SELECT MAX(t.price)
    FROM public.live_ticks t
    WHERE t.symbol = pt.symbol
      AND t.ts > pt.exit_ts
      AND t.ts <= pt.exit_ts + INTERVAL '5 minutes'
      AND t.price IS NOT NULL
  ) AS max_price_next_5min,
  CASE
    WHEN (
      SELECT MIN(t.price)
      FROM public.live_ticks t
      WHERE t.symbol = pt.symbol
        AND t.ts > pt.exit_ts
        AND t.ts <= pt.exit_ts + INTERVAL '5 minutes'
        AND t.price IS NOT NULL
    ) < pt.exit_price THEN true
    ELSE false
  END AS reversed_below_exit
FROM public.paper_trades pt
WHERE pt.status = 'closed'
  AND pt.exit_reason = 'TP'
  AND pt.exit_ts IS NOT NULL
  AND pt.exit_price IS NOT NULL;

GRANT SELECT ON public.signal_reversal_check TO authenticated;