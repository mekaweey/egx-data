
-- 1. Remove public read on model_state (ML internals must stay private)
DROP POLICY IF EXISTS model_state_public_read ON public.model_state;

-- 2. Fix daily_intelligence write policy: replace bypassable public-role check
DROP POLICY IF EXISTS daily_intelligence_service_write ON public.daily_intelligence;
CREATE POLICY daily_intelligence_service_write
  ON public.daily_intelligence
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Fix daily_picks write policy: same pattern
DROP POLICY IF EXISTS "Service role manages picks" ON public.daily_picks;
CREATE POLICY "Service role manages picks"
  ON public.daily_picks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
