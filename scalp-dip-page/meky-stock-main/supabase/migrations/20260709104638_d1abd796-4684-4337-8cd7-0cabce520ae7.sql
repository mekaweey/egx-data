
CREATE TABLE public.extension_tab_telemetry (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  uuid TEXT,
  opened_at_ms BIGINT,
  uptime_sec INTEGER,
  last_ensure_age_sec INTEGER,
  last_l2_fresh BOOLEAN,
  last_l2_age_sec INTEGER,
  panel_state TEXT,
  has_trigger BOOLEAN,
  snapshots_sent INTEGER,
  last_snapshot_age_sec INTEGER,
  extras JSONB
);

CREATE INDEX idx_ext_tab_tel_ts ON public.extension_tab_telemetry (ts DESC);
CREATE INDEX idx_ext_tab_tel_symbol_ts ON public.extension_tab_telemetry (symbol, ts DESC);

GRANT SELECT, INSERT ON public.extension_tab_telemetry TO authenticated;
GRANT INSERT ON public.extension_tab_telemetry TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.extension_tab_telemetry_id_seq TO authenticated, anon;
GRANT ALL ON public.extension_tab_telemetry TO service_role;
GRANT ALL ON SEQUENCE public.extension_tab_telemetry_id_seq TO service_role;

ALTER TABLE public.extension_tab_telemetry ENABLE ROW LEVEL SECURITY;

-- Ingest is protected at the endpoint by THUNDER_INGEST_TOKEN header;
-- only the service role writes via that hook. Deny direct anon writes.
CREATE POLICY "Service role manages telemetry"
  ON public.extension_tab_telemetry FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read telemetry"
  ON public.extension_tab_telemetry FOR SELECT
  TO authenticated
  USING (true);
