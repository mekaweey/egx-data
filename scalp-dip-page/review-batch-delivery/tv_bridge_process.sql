-- tv_bridge_process() — live text from the database (read-only pg_get_functiondef, 4 Oct 2026).
-- Provided for the audit (opens trace). NOTE the candle upsert below: open is
-- set only on INSERT (first write wins); high/low/close/volume merge.
-- The OVERWRITE path found in the audit is NOT here but in the site route
-- upsertTodayCandles (marketwatch first-snapshot open overwrote scanner rows);
-- fixed on branch audit/followup-oct4 (fills only missing symbols).
CREATE OR REPLACE FUNCTION public.tv_bridge_process()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_last_id bigint := 0;
  v_resp record;
  v_n int := 0;
BEGIN
  INSERT INTO tv_cron_state (id, last_id) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
  SELECT s.last_id INTO v_last_id FROM tv_cron_state s WHERE s.id = 1;
  -- SELF-HEALING: a poisoned pointer (beyond the newest response) must never
  -- silently disable processing — reset to 0; the price-diff suppresses dupes.
  IF v_last_id > (SELECT COALESCE(MAX(id), 0) FROM net._http_response) THEN
    v_last_id := 0;
  END IF;
  SELECT * INTO v_resp FROM net._http_response
   WHERE id > v_last_id AND status_code = 200
   ORDER BY id DESC LIMIT 1;
  IF v_resp.id IS NULL THEN RETURN 0; END IF;

  WITH ins AS (
    SELECT replace(elem->>'s', 'EGX:', '') AS sym,
      (elem->'d'->>1)::numeric AS o,
      (elem->'d'->>2)::numeric AS h,
      (elem->'d'->>3)::numeric AS l,
      (elem->'d'->>4)::numeric AS c,
      COALESCE(NULLIF(elem->'d'->>5, '')::numeric, 0) AS v
    FROM jsonb_array_elements(v_resp.content::jsonb -> 'data') elem
    WHERE (elem->'d'->>1)::numeric > 0 AND (elem->'d'->>4)::numeric > 0
  ), candle_upsert AS (
    INSERT INTO daily_candles (symbol, date, open, high, low, close, volume)
    SELECT i.sym, (v_resp.created AT TIME ZONE 'Africa/Cairo')::date, i.o, i.h, i.l, i.c, i.v
    FROM ins i
    ON CONFLICT (symbol, date) DO UPDATE SET
      high = GREATEST(daily_candles.high, EXCLUDED.high),
      low = LEAST(daily_candles.low, EXCLUDED.low),
      close = EXCLUDED.close,
      volume = GREATEST(daily_candles.volume, EXCLUDED.volume)
    RETURNING 1
  )
  INSERT INTO tv_ticks (symbol, price, volume, ts, source)
  SELECT i.sym, i.c, i.v, v_resp.created, 'tv'
  FROM ins i
  WHERE NOT EXISTS (
    SELECT 1 FROM tv_ticks t
    WHERE t.symbol = i.sym AND t.ts > now() - interval '10 minutes' AND t.price = i.c
  );
  GET DIAGNOSTICS v_n = ROW_COUNT;
  UPDATE tv_cron_state SET last_id = v_resp.id, updated_at = now() WHERE id = 1;
  RETURN v_n;
END
$function$
;
