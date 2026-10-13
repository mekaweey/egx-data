CREATE TABLE public.paper_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date date NOT NULL,
  symbol text NOT NULL,
  strategy text NOT NULL DEFAULT 'dipbuy-s30-tp3-sl1',
  morning_high numeric,
  dip_trigger_price numeric,
  entry_price numeric NOT NULL,
  entry_ts timestamptz NOT NULL,
  exit_price numeric,
  exit_ts timestamptz,
  exit_reason text,
  tp_price numeric NOT NULL,
  sl_price numeric NOT NULL,
  capital numeric NOT NULL DEFAULT 7142.86,
  pnl numeric,
  pnl_pct numeric,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trade_date, symbol, strategy)
);

CREATE INDEX idx_paper_trades_date ON public.paper_trades(trade_date DESC);
CREATE INDEX idx_paper_trades_status ON public.paper_trades(status) WHERE status = 'open';

GRANT SELECT ON public.paper_trades TO anon, authenticated;
GRANT ALL ON public.paper_trades TO service_role;

ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paper_trades_public_read" ON public.paper_trades FOR SELECT USING (true);

CREATE TRIGGER trg_paper_trades_updated_at
  BEFORE UPDATE ON public.paper_trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();