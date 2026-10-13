CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- إزالة أي جدولة قديمة بنفس الاسم
DO $$
BEGIN
  PERFORM cron.unschedule('daily-instant-train');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- يومياً 13:00 UTC (3:00 عصراً بتوقيت القاهرة، بعد قفل البورصة)
SELECT cron.schedule(
  'daily-instant-train',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/instant-train?force=1',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik'
    ),
    body := '{}'::jsonb
  );
  $$
);