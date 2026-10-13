-- news_30h: monitoring-only flag persisted per signal row.
-- true = matched news for this symbol published in the 30h before entry
-- (weekend-extended for Sunday). NOT a filter -- logged to accumulate the
-- news-driven vs flow-driven gap sample. See gap-fade-3d.server.ts loadNewsFlags().
ALTER TABLE public.scalp_dip_signals
  ADD COLUMN IF NOT EXISTS news_30h BOOLEAN;

COMMENT ON COLUMN public.scalp_dip_signals.news_30h IS
  'Monitoring flag (not a filter): matched news in the 30h before entry (Sunday covers Fri+Sat weekend).';