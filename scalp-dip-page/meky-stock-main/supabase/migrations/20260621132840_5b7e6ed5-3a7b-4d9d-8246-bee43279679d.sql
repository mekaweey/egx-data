ALTER VIEW public.live_ticks_best SET (security_invoker = true);
REVOKE SELECT ON public.live_ticks_best FROM anon;