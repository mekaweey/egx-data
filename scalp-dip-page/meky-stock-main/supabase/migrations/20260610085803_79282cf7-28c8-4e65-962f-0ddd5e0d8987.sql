UPDATE public.stocks
SET is_active = true
WHERE is_sharia = true
  AND is_active = false
  AND symbol IN (
    SELECT DISTINCT symbol FROM public.live_ticks
    WHERE ts > now() - interval '24 hours'
  );