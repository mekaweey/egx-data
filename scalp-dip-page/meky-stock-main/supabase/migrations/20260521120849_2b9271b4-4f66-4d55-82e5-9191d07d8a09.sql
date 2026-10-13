-- Unschedule any existing job with the same name to make this migration idempotent
DO $$
BEGIN
  PERFORM cron.unschedule('update-reco-outcomes-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'update-reco-outcomes-daily',
  '0 15 * * 0-4', -- 15:00 UTC = 17:00 Cairo, Sun-Thu (EGX trading week)
  $$
  SELECT net.http_post(
    url := 'https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/update-outcomes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);