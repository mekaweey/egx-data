-- ============================================================
-- MUBASHER NEWS ARCHIVE (EG "pulse/stocks" listing)
-- ============================================================
-- Source: https://www.mubasher.info/news/eg/pulse/stocks (SSR pages,
-- 25 articles/page; crawled politely by _mb_archive_pull.cjs (repo root)
-- with 5.5s crawl-delay, robots-respecting, no /api/ use).
-- ATTRIBUTION (Mubasher ToS / robots, reviewed Stage 0-1 Sep 2026): robots.txt
-- allows these SSR pages (Crawl-delay 5 honored); /api/ is Disallowed and never
-- touched; ToS has no anti-scraping clause. Attribution is respected by storing
-- source + the original article URL on every row.
-- Rows are upserted idempotently by the mubasher numeric article id,
-- so re-running the puller never duplicates rows.
-- Schema follows news_sentiment conventions (headline / summary_ar / published_at).

CREATE TABLE IF NOT EXISTS public.mubasher_news (
  id            TEXT PRIMARY KEY,             -- mubasher numeric article id
  headline      TEXT NOT NULL,                -- Arabic title (entities decoded)
  summary_ar    TEXT,
  url           TEXT NOT NULL,                -- original mubasher article URL (attribution)
  source        TEXT NOT NULL DEFAULT 'mubasher',
  category_id   TEXT,
  category_name TEXT,
  date_raw      TEXT,                         -- original Arabic date string (audit)
  published_at  TIMESTAMPTZ NOT NULL,
  pulled_at     TIMESTAMPTZ,                  -- when this row was fetched (time-only dates resolve relative to pull time)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mubasher_news TO anon, authenticated;
GRANT ALL ON public.mubasher_news TO service_role;

ALTER TABLE public.mubasher_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mubasher_news_public_read" ON public.mubasher_news;
CREATE POLICY "mubasher_news_public_read" ON public.mubasher_news
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_mubasher_news_published_at
  ON public.mubasher_news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mubasher_news_category
  ON public.mubasher_news (category_id);