-- Schedule compute-scalp-feasibility every 15 min during Cairo market hours (Sun-Thu 10:00-15:00 UTC+2 → 08:00-13:00 UTC)
SELECT cron.schedule(
  'compute-scalp-feasibility-15m',
  '*/15 8-13 * * 0-4',
  $$
  SELECT net.http_post(
    url:='https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/compute-scalp-feasibility',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);