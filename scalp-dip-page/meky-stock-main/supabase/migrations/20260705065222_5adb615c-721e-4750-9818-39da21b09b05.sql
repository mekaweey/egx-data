
CREATE TABLE public.thunder_watchlist_snapshots (
  id bigserial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  symbol text NOT NULL,
  uuid text,
  name text,
  day_tradable boolean,
  feed_price numeric,
  previous_close numeric,
  min_price_limit numeric,
  max_price_limit numeric,
  day_trade_limit numeric,
  round_digits int,
  market_id text,
  source text NOT NULL DEFAULT 'thunder_ext'
);
CREATE INDEX thunder_watchlist_symbol_ts_idx ON public.thunder_watchlist_snapshots (symbol, ts DESC);
CREATE INDEX thunder_watchlist_ts_idx ON public.thunder_watchlist_snapshots (ts DESC);
GRANT SELECT, INSERT ON public.thunder_watchlist_snapshots TO authenticated;
GRANT ALL ON public.thunder_watchlist_snapshots TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.thunder_watchlist_snapshots_id_seq TO authenticated, service_role;
ALTER TABLE public.thunder_watchlist_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.thunder_watchlist_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read" ON public.thunder_watchlist_snapshots FOR SELECT TO authenticated USING (true);
