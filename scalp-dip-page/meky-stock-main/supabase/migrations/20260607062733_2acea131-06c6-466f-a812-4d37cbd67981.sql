
CREATE TABLE public.intraday_candles (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  bucket_ts TIMESTAMPTZ NOT NULL,
  interval_min INT NOT NULL DEFAULT 1,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT,
  tick_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (symbol, bucket_ts, interval_min)
);

CREATE INDEX intraday_candles_symbol_date_idx ON public.intraday_candles (symbol, trade_date);
CREATE INDEX intraday_candles_bucket_idx ON public.intraday_candles (bucket_ts DESC);

GRANT SELECT ON public.intraday_candles TO anon, authenticated;
GRANT ALL ON public.intraday_candles TO service_role;

ALTER TABLE public.intraday_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intraday_candles_public_read" ON public.intraday_candles
  FOR SELECT USING (true);
