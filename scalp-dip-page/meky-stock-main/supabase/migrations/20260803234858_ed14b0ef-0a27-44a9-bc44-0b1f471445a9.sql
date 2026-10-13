DROP POLICY IF EXISTS "service role manages trade_events" ON public.trade_events;
CREATE POLICY "service role manages trade_events"
ON public.trade_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
REVOKE ALL ON public.trade_events FROM anon, authenticated;
GRANT ALL ON public.trade_events TO service_role;