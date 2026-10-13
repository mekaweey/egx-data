-- Register cron jobs for fundamentals, macro indicators, and weekly learning

-- 1. Fetch fundamentals — daily at 8:00 AM Cairo (6:00 UTC), Sun-Thu
SELECT cron.schedule(
  'egx-fetch-fundamentals',
  '0 6 * * 0,1,2,3,4',
  $$
  SELECT net.http_post(
    url := 'https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/fetch-fundamentals',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 2. Fetch macro indicators — daily at 7:30 AM Cairo (5:30 UTC), Sun-Thu
SELECT cron.schedule(
  'egx-fetch-macro',
  '30 5 * * 0,1,2,3,4',
  $$
  SELECT net.http_post(
    url := 'https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/fetch-macro',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 3. Weekly adaptive learning — every Friday at 9:00 AM Cairo (7:00 UTC)
SELECT cron.schedule(
  'egx-weekly-learning',
  '0 7 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/weekly-learning',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);