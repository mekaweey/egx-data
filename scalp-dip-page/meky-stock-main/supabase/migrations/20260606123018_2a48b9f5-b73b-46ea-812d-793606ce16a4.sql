CREATE TABLE public.intraday_breakouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  trade_date date NOT NULL,
  breakout_price numeric NOT NULL,
  hh20 numeric NOT NULL,
  sma50 numeric,
  sma200 numeric,
  vol_intraday bigint NOT NULL,
  vol_avg20 numeric NOT NULL,
  vol_x numeric NOT NULL,
  prev_close numeric,
  gap_pct numeric,
  filters_passed jsonb NOT NULL,
  telegram_sent boolean NOT NULL DEFAULT false,
  notes text
);

CREATE UNIQUE INDEX intraday_breakouts_symbol_date_unique ON public.intraday_breakouts(symbol, trade_date);
CREATE INDEX intraday_breakouts_detected_at_idx ON public.intraday_breakouts(detected_at DESC);

GRANT SELECT ON public.intraday_breakouts TO anon, authenticated;
GRANT ALL ON public.intraday_breakouts TO service_role;

ALTER TABLE public.intraday_breakouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intraday_breakouts_public_read" ON public.intraday_breakouts FOR SELECT USING (true);