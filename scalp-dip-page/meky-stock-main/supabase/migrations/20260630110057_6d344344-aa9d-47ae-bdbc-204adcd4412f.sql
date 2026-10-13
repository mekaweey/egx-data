DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT jobid FROM cron.job
           WHERE command ILIKE '%paper-trade%' OR jobname ILIKE '%paper-trade%' OR jobname ILIKE '%dipbuy%' OR jobname ILIKE '%morning%'
  LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END $$;