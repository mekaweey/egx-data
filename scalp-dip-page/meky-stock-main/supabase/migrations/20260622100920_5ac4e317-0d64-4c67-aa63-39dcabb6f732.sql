-- Idempotency guard for the new buy-fill bridge: prevent duplicate open
-- positions for the same symbol on the same entry_date. The bridge endpoint
-- relies on this index to turn a duplicate INSERT into a clean no-op.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_positions_open_symbol_entry_date
  ON public.positions (symbol, entry_date)
  WHERE status = 'open';

-- Defensive: ensure service_role can write/read positions (used by the
-- thunder-positions server route via supabaseAdmin).
GRANT SELECT, INSERT, UPDATE ON public.positions TO service_role;