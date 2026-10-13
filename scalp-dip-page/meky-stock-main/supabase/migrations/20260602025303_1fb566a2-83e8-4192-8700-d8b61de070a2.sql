ALTER TABLE public.stocks ADD COLUMN IF NOT EXISTS is_sharia boolean NOT NULL DEFAULT false;

UPDATE public.stocks SET is_sharia = true WHERE symbol IN
  ('ABUK','AMOC','AUTO','EFIH','EGCH','ESRS','ETEL','FWRY','HELI','ISPH',
   'JUFO','MFPC','MNHD','OCDI','ORAS','ORWE','PHDC','SKPC','SWDY','TMGH',
   'EKHO','EKHOA');