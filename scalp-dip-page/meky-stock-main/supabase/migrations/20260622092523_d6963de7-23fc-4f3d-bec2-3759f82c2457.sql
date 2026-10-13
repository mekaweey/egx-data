ALTER TABLE public.live_ticks
  ADD CONSTRAINT live_ticks_source_thunder_only
  CHECK (source = 'thunder_ext') NOT VALID;