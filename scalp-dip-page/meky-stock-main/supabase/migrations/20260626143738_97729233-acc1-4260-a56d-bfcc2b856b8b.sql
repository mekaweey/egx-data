CREATE TABLE public.extension_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_trade_id text NOT NULL,
  symbol text NOT NULL,
  trade_date date NOT NULL,
  source text,
  status text NOT NULL DEFAULT 'open',
  opened_at timestamptz NOT NULL,
  buy_qty numeric,
  buy_price numeric,
  buy_value numeric,
  buy_fee numeric,
  buy_total_cost numeric,
  closed_at timestamptz,
  sell_qty numeric,
  sell_price numeric,
  sell_value numeric,
  sell_fee numeric,
  sell_net_proceeds numeric,
  pnl numeric,
  pnl_pct numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_trade_id)
);

GRANT ALL ON public.extension_trades TO service_role;

ALTER TABLE public.extension_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.extension_trades
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_extension_trades_date ON public.extension_trades (trade_date DESC);
CREATE INDEX idx_extension_trades_symbol_date ON public.extension_trades (symbol, trade_date DESC);

CREATE TRIGGER extension_trades_updated_at
  BEFORE UPDATE ON public.extension_trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();