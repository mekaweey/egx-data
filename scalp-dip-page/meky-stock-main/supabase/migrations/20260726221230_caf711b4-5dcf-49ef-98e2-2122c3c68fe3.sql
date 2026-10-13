
DROP POLICY IF EXISTS "update strategy settings" ON public.strategy_settings;
DROP POLICY IF EXISTS "public insert auth events" ON public.thunder_auth_events;
-- Writes to both tables happen only via server code using service_role,
-- which bypasses RLS. No replacement policy is required.
