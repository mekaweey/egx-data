-- Enable Realtime push for paper_trades so /scalp and /scalp-fresh pages
-- get instant updates without polling delay.
ALTER TABLE public.paper_trades REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'paper_trades'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.paper_trades;
  END IF;
END $$;
