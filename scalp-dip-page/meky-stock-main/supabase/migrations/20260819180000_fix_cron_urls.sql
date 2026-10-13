-- Reschedule cron jobs with corrected endpoint URLs for local development.
-- These jobs were originally hardcoded to https://project--22b3e97d-22b3...lovable.app
-- which is the OLD Lovable app domain. For local dev, point to localhost:8080.
-- When deploying to Lovable, these should be updated to the new app URL.

-- 1. Daily reco outcome update @ 15:00 UTC (17:00 Cairo), Sun-Thu
SELECT cron.schedule(
  'update-reco-outcomes-daily',
  '0 15 * * 0-4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/update-outcomes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 2. Fetch fundamentals — daily at 6:00 UTC (8:00 Cairo), Sun-Thu
SELECT cron.schedule(
  'egx-fetch-fundamentals',
  '0 6 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/fetch-fundamentals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 3. Fetch macro indicators — daily at 5:30 UTC (7:30 Cairo), Sun-Thu
SELECT cron.schedule(
  'egx-fetch-macro',
  '30 5 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/fetch-macro',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 4. Weekly adaptive learning — every Friday at 7:00 UTC (9:00 Cairo)
SELECT cron.schedule(
  'egx-weekly-learning',
  '0 7 * * 5',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/weekly-learning',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 5. Instant train — daily at 13:00 UTC (15:00 Cairo)
SELECT cron.schedule(
  'daily-instant-train',
  '0 13 * * *',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/instant-train?force=1',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 6. Eklas monitor — every 10 min during Cairo market hours (7-12 UTC)
SELECT cron.schedule(
  'eklas-monitor',
  '*/10 7-12 * * 0-4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/monitor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 7. Midday scan @ 10:00 UTC (12:00 Cairo), Sun-Thu
SELECT cron.schedule(
  'midday-scan-weekdays',
  '0 10 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/daily-scan',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 8. End-of-market scan @ 12:30 UTC (14:30 Cairo), Sun-Thu
SELECT cron.schedule(
  'eod-scan-weekdays',
  '30 12 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/daily-scan',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 9. News refresh every 4h on trading days
SELECT cron.schedule(
  'news-refresh-4h-weekdays',
  '0 */4 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/fetch-news-all',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 10. Hourly outcome update during Cairo market hours (8-12 UTC)
SELECT cron.schedule(
  'outcome-update-market-hours',
  '0 8-12 * * 0,1,2,3,4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/update-outcomes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 11. Compute scalp feasibility every 15 min during Cairo market hours (8-13 UTC)
SELECT cron.schedule(
  'compute-scalp-feasibility-15m',
  '*/15 8-13 * * 0-4',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/compute-scalp-feasibility',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) $$
);

-- 12. Paper scalp dip runner — every minute
SELECT cron.schedule(
  'paper-scalp-dip-runner',
  '* * * * *',
  $$ SELECT net.http_post(
      url := 'http://localhost:8080/api/public/hooks/paper-scalp-dip',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'
      ),
      body := '{}'::jsonb
    ) $$
);