-- 20260918000001_decision_audit_log.sql
-- Decision Audit Log: Permanent immutable record of every signal, emergency alert,
-- and user action (Bought, Sold, Ignored, Window Expired) with exact timestamp and market prices.

CREATE TABLE IF NOT EXISTS public.decision_audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL, -- 'SIGNAL_10AM', 'EMERGENCY_STOP_LOSS', 'EMERGENCY_ANOMALY', 'SCHEDULED_EXIT', 'USER_BOUGHT', 'USER_SOLD', 'WINDOW_EXPIRED'
  symbol TEXT NOT NULL,
  trigger_price NUMERIC,
  reference_price NUMERIC,
  pnl_pct NUMERIC,
  details JSONB,
  user_action TEXT DEFAULT 'PENDING', -- 'PENDING', 'BOUGHT', 'SOLD', 'IGNORED', 'EXPIRED'
  action_ts TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_decision_audit_log_created ON public.decision_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_audit_log_symbol ON public.decision_audit_log (symbol, created_at DESC);

ALTER TABLE public.decision_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON public.decision_audit_log;
CREATE POLICY "service_role_full_access" ON public.decision_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_decision_audit_log" ON public.decision_audit_log;
CREATE POLICY "authenticated_read_decision_audit_log" ON public.decision_audit_log
  FOR SELECT TO authenticated USING (true);

GRANT ALL ON public.decision_audit_log TO service_role;
GRANT SELECT ON public.decision_audit_log TO authenticated;
