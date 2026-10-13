UPDATE public.scans
SET status='failed',
    finished_at=NOW(),
    error_message=COALESCE(error_message,'') || ' | manual-clear: worker timeout'
WHERE status='running'
  AND started_at < NOW() - INTERVAL '5 minutes';
