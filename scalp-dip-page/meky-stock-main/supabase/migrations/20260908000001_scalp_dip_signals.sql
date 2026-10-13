-- PARTS 3/4/5 — scalp_dip_signals: permanent per-signal log with user Buy/Sell
-- tracking + universal shadow simulation for EVERY qualified signal.
--
-- One row per (scan_date, symbol). Created automatically by the daily scan
-- (cron Phase S) for EVERY liquidity-qualified gap-down candidate — not just
-- the ones the user marks as Bought. Shadow fields (day1/2/3, shadow_pnl)
-- track the pure-strategy outcome of every signal independently of user
-- action; bought/sold/realized_pnl track the user's real manual trades.
--
-- RLS: enabled, service_role full access (same pattern as _cleanup_log).

CREATE TABLE IF NOT EXISTS public.scalp_dip_signals (
  id BIGSERIAL PRIMARY KEY,
  scan_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  -- Step 1-3 scan snapshot (immutable record of what was shown)
  entry_price NUMERIC NOT NULL,           -- first real observed price that day
  gap_pct NUMERIC NOT NULL,
  bid_depth_at_entry NUMERIC NOT NULL,    -- highest_bid x qty at entry moment
  position_value NUMERIC NOT NULL,        -- planned size: MIN(slot, 15% x depth)
  -- Part 3: user's real manual buy
  bought BOOLEAN NOT NULL DEFAULT false,
  actual_buy_price NUMERIC,
  buy_timestamp TIMESTAMPTZ,
  -- Part 4: universal shadow progression (auto, every signal)
  day1_status TEXT,
  day1_price NUMERIC,
  day2_status TEXT,
  day2_price NUMERIC,
  day3_status TEXT,
  day3_price NUMERIC,
  exit_reason TEXT,                       -- shadow exit: STOP_LOSS / TIME_EXIT / FORCED_EXIT_INSUFFICIENT_LIQUIDITY
  bid_confirmed_at_exit BOOLEAN,
  extra_hold_used BOOLEAN NOT NULL DEFAULT false,  -- Step 5B one-time extension
  shadow_exit_price NUMERIC,
  shadow_pnl NUMERIC,                    -- hypothetical EGP pnl (stamp duty included)
  shadow_pnl_pct NUMERIC,
  -- Part 3B: user's real manual sell
  sold BOOLEAN NOT NULL DEFAULT false,
  actual_sell_price NUMERIC,
  sell_timestamp TIMESTAMPTZ,
  realized_pnl NUMERIC,                   -- real EGP pnl incl. stamp duty
  realized_pnl_pct NUMERIC,
  -- SELL NOW notification state (Step 4/5 logic run daily on bought rows)
  sell_signal BOOLEAN NOT NULL DEFAULT false,
  sell_signal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scan_date, symbol)
);

ALTER TABLE public.scalp_dip_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON public.scalp_dip_signals;
CREATE POLICY "service_role_full_access" ON public.scalp_dip_signals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Prevent pg_cron's postgres role (SECURITY DEFINER context) from being blocked:
GRANT ALL ON public.scalp_dip_signals TO service_role;
