-- Audit Oct-4 task 1 (SCHEDULE): Thursday signal scan + Sunday fill-only.
-- STATUS: PROPOSED ONLY. DO NOT APPLY without the user's explicit approval.
--
-- Design: the signal scan runs THURSDAY after the 14:45 Cairo close
-- (12:00 UTC = 15:00 Cairo, safely past the close); the Telegram alert goes
-- out Thursday evening. Sunday runs do gap/fill/exit only (the route's
-- isSignalWindow gate already skips scanning on non-Thursdays, so the
-- existing Sunday jobs need NO change — phase=auto degrades to fill+exit).
--
-- DEPLOY STEPS (after approval): run this file via supabase db push (or the
-- SQL editor), then verify next Thursday: one MW_WEEKLY_SCAN event with
-- Thursday signal_date + one Telegram marker, and Sunday fills after open.

SELECT cron.schedule(
  'mw-thursday-scan',
  '5 12 * * 4',
  $$SELECT net.http_post(
    url := 'https://meky-stock.onrender.com/api/public/hooks/momentum-weekly-run?phase=auto',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', 'sb_publishable_AHyMZrTrHs8RN2iUC4mO7g_BzKyw779'),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  )$$
);
