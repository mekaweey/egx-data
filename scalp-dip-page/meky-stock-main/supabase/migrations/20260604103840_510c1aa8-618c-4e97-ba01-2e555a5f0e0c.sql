
-- Helpers exposed via RPC to read cron schedule + run history
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE(jobid bigint, jobname text, schedule text, active boolean, command text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT jobid, jobname, schedule, active, command
  FROM cron.job
  ORDER BY jobname;
$$;

CREATE OR REPLACE FUNCTION public.get_cron_runs(p_limit int DEFAULT 50)
RETURNS TABLE(
  runid bigint,
  jobid bigint,
  jobname text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT r.runid, r.jobid, j.jobname, r.status, r.return_message, r.start_time, r.end_time
  FROM cron.job_run_details r
  LEFT JOIN cron.job j ON j.jobid = r.jobid
  ORDER BY r.start_time DESC
  LIMIT GREATEST(1, LEAST(p_limit, 500));
$$;

REVOKE ALL ON FUNCTION public.get_cron_jobs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_cron_runs(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cron_runs(int) TO service_role;

-- Add extra intraday automation (UTC; Cairo = UTC+2)
-- Midday scan @ 12:00 Cairo (10:00 UTC) on trading days (Sun-Thu)
SELECT cron.schedule(
  'midday-scan-weekdays',
  '0 10 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url:='https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/daily-scan',
      headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
      body:='{}'::jsonb
    ) $$
);

-- End-of-market scan @ 14:30 Cairo (12:30 UTC)
SELECT cron.schedule(
  'eod-scan-weekdays',
  '30 12 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url:='https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/daily-scan',
      headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
      body:='{}'::jsonb
    ) $$
);

-- Intraday news refresh every 4h on trading days
SELECT cron.schedule(
  'news-refresh-4h-weekdays',
  '0 */4 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url:='https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/fetch-news-all',
      headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
      body:='{}'::jsonb
    ) $$
);

-- Hourly outcome update during Cairo market hours (10:00–14:00 Cairo = 08:00-12:00 UTC)
SELECT cron.schedule(
  'outcome-update-market-hours',
  '0 8-12 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url:='https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/update-outcomes',
      headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
      body:='{}'::jsonb
    ) $$
);
