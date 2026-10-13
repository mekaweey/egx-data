
-- =========================================================
-- EGX Smart Screener — Initial Schema
-- =========================================================

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Enums
CREATE TYPE public.scan_status AS ENUM ('running', 'completed', 'failed');
CREATE TYPE public.signal_type AS ENUM ('strong_buy', 'buy', 'neutral', 'sell', 'strong_sell');
CREATE TYPE public.reco_outcome AS ENUM ('pending', 'target_hit', 'stop_hit', 'expired', 'manual_close');

-- Stocks (EGX universe)
CREATE TABLE public.stocks (
  symbol TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sector_ar TEXT,
  yahoo_symbol TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scans
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status public.scan_status NOT NULL DEFAULT 'running',
  source_provider TEXT,
  stocks_count INTEGER NOT NULL DEFAULT 0,
  ai_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);
CREATE INDEX idx_scans_started_at ON public.scans(started_at DESC);

-- Snapshots
CREATE TABLE public.stock_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL REFERENCES public.stocks(symbol),
  ts TIMESTAMPTZ NOT NULL,
  open NUMERIC(14,4), high NUMERIC(14,4), low NUMERIC(14,4),
  close NUMERIC(14,4) NOT NULL,
  prev_close NUMERIC(14,4),
  change_pct NUMERIC(8,4),
  volume BIGINT,
  rsi14 NUMERIC(8,4),
  macd NUMERIC(10,5), macd_signal NUMERIC(10,5), macd_hist NUMERIC(10,5),
  ema9 NUMERIC(14,4), ema21 NUMERIC(14,4), sma50 NUMERIC(14,4),
  bb_upper NUMERIC(14,4), bb_mid NUMERIC(14,4), bb_lower NUMERIC(14,4),
  atr14 NUMERIC(14,4),
  vol_avg20 NUMERIC(20,2),
  vol_ratio NUMERIC(8,4),
  support NUMERIC(14,4), resistance NUMERIC(14,4),
  patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  composite_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  data_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scan_id, symbol)
);
CREATE INDEX idx_snapshots_scan ON public.stock_snapshots(scan_id, composite_score DESC);
CREATE INDEX idx_snapshots_symbol ON public.stock_snapshots(symbol, ts DESC);

-- Recommendations
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL REFERENCES public.stocks(symbol),
  signal public.signal_type NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  reasons_ar JSONB NOT NULL DEFAULT '[]'::jsonb,
  entry_min NUMERIC(14,4),
  entry_max NUMERIC(14,4),
  target NUMERIC(14,4),
  stop_loss NUMERIC(14,4),
  timeframe_days INTEGER,
  risk_note_ar TEXT,
  price_at_reco NUMERIC(14,4) NOT NULL,
  rr_ratio NUMERIC(8,4),
  position_size_pct NUMERIC(5,2),
  ai_model TEXT,
  raw_ai_response JSONB,
  outcome public.reco_outcome NOT NULL DEFAULT 'pending',
  outcome_price NUMERIC(14,4),
  outcome_at TIMESTAMPTZ,
  realized_pct NUMERIC(8,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reco_scan ON public.recommendations(scan_id, confidence DESC);
CREATE INDEX idx_reco_symbol_created ON public.recommendations(symbol, created_at DESC);
CREATE INDEX idx_reco_pending ON public.recommendations(outcome) WHERE outcome = 'pending';

-- Data source logs
CREATE TABLE public.data_source_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL,
  symbol TEXT,
  ok BOOLEAN NOT NULL,
  latency_ms INTEGER,
  candles_count INTEGER,
  error TEXT
);
CREATE INDEX idx_dsl_ts ON public.data_source_logs(ts DESC);

-- =========================================================
-- RLS — public read, service-role write only
-- =========================================================
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stocks_public_read" ON public.stocks FOR SELECT USING (true);
CREATE POLICY "scans_public_read" ON public.scans FOR SELECT USING (true);
CREATE POLICY "snapshots_public_read" ON public.stock_snapshots FOR SELECT USING (true);
CREATE POLICY "reco_public_read" ON public.recommendations FOR SELECT USING (true);
-- data_source_logs: no public policy (server-side only via service role)

-- =========================================================
-- Seed EGX30 constituents
-- =========================================================
INSERT INTO public.stocks (symbol, name_ar, name_en, sector_ar, yahoo_symbol) VALUES
  ('COMI', 'البنك التجاري الدولي', 'Commercial International Bank', 'بنوك', 'COMI.CA'),
  ('HRHO', 'المجموعة المالية هيرميس', 'EFG Hermes Holding', 'خدمات مالية', 'HRHO.CA'),
  ('EKHO', 'القابضة المصرية الكويتية', 'Egypt Kuwait Holding', 'استثمارات', 'EKHO.CA'),
  ('EKHOA', 'القابضة المصرية الكويتية - دولار', 'Egypt Kuwait Holding USD', 'استثمارات', 'EKHOA.CA'),
  ('SWDY', 'السويدي إليكتريك', 'Elsewedy Electric', 'صناعات كهربائية', 'SWDY.CA'),
  ('ETEL', 'المصرية للاتصالات', 'Telecom Egypt', 'اتصالات', 'ETEL.CA'),
  ('EAST', 'الشرقية - إيسترن', 'Eastern Company', 'تبغ', 'EAST.CA'),
  ('TMGH', 'مجموعة طلعت مصطفى', 'TMG Holding', 'عقارات', 'TMGH.CA'),
  ('PHDC', 'بالم هيلز للتعمير', 'Palm Hills Developments', 'عقارات', 'PHDC.CA'),
  ('HELI', 'مصر الجديدة للإسكان', 'Heliopolis Housing', 'عقارات', 'HELI.CA'),
  ('MNHD', 'مدينة نصر للإسكان', 'Madinet Nasr Housing', 'عقارات', 'MNHD.CA'),
  ('ORAS', 'أوراسكوم كونستراكشون', 'Orascom Construction', 'مقاولات', 'ORAS.CA'),
  ('ORWE', 'النساجون الشرقيون', 'Oriental Weavers', 'سجاد ومنسوجات', 'ORWE.CA'),
  ('JUFO', 'جهينة للصناعات الغذائية', 'Juhayna Food Industries', 'أغذية', 'JUFO.CA'),
  ('EFIH', 'إي فاينانس للاستثمارات المالية والرقمية', 'e-Finance', 'تكنولوجيا مالية', 'EFIH.CA'),
  ('FWRY', 'فوري لتكنولوجيا البنوك والمدفوعات', 'Fawry', 'تكنولوجيا مالية', 'FWRY.CA'),
  ('CIEB', 'كريدي أجريكول مصر', 'Credit Agricole Egypt', 'بنوك', 'CIEB.CA'),
  ('ADIB', 'مصرف أبوظبي الإسلامي مصر', 'Abu Dhabi Islamic Bank Egypt', 'بنوك', 'ADIB.CA'),
  ('FAIT', 'فيصل الإسلامي المصري', 'Faisal Islamic Bank of Egypt', 'بنوك', 'FAIT.CA'),
  ('HDBK', 'بنك التعمير والإسكان', 'Housing and Development Bank', 'بنوك', 'HDBK.CA'),
  ('SKPC', 'سيدي كرير للبتروكيماويات', 'Sidi Kerir Petrochemicals', 'بتروكيماويات', 'SKPC.CA'),
  ('AMOC', 'الإسكندرية للزيوت المعدنية', 'Alexandria Mineral Oils', 'بترول', 'AMOC.CA'),
  ('ABUK', 'أبو قير للأسمدة', 'Abu Qir Fertilizers', 'أسمدة', 'ABUK.CA'),
  ('MFPC', 'مصر للأسمدة - موبكو', 'Misr Fertilizers - MOPCO', 'أسمدة', 'MFPC.CA'),
  ('ESRS', 'حديد عز', 'Ezz Steel', 'حديد وصلب', 'ESRS.CA'),
  ('OCDI', 'سوديك', 'SODIC', 'عقارات', 'OCDI.CA'),
  ('EGCH', 'الكيماويات المصرية', 'Egyptian Chemical Industries', 'كيماويات', 'EGCH.CA'),
  ('AUTO', 'جي بي أوتو', 'GB Auto', 'سيارات', 'AUTO.CA'),
  ('CCAP', 'القلعة للاستشارات المالية', 'Qalaa Holdings', 'استثمارات', 'CCAP.CA'),
  ('ISPH', 'إبن سينا فارما', 'Ibnsina Pharma', 'دواء', 'ISPH.CA');
