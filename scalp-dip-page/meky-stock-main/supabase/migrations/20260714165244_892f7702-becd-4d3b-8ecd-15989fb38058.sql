SELECT cron.schedule(
  'paper-scalp-dip-runner',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app/api/public/hooks/paper-scalp-dip',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);