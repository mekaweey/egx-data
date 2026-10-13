
ALTER TABLE public.stocks ADD COLUMN IF NOT EXISTS day_tradable BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS stocks_day_tradable_idx ON public.stocks(day_tradable) WHERE day_tradable = true;

UPDATE public.stocks SET day_tradable = true WHERE symbol = ANY(ARRAY[
'AALR','ABUK','ACAMD','ADIB','ADRI','AFMC','AIFI','AJWA','AMES','AMOC',
'ARCC','ARVA','ATLC','ATQA','AXPH','BIOC','CAED','CLHO','COPR','CPCI',
'CRST','EALR','EDFM','EFID','EGAL','EGAS','EHDR','FAITA','GIHD','GPIM',
'ICFC','IEEC','IFAP','INEG','INFI','ISMA','ISMQ','JUFO','KABO','MBSC',
'MCQE','MCRO','MFPC','MICH','MILS','MOED','MOSC','MPCI','MPCO','MTIE',
'NCCW','OBRI','OCPH','POUL','PRCL','RREI','RUBX','SAUD','SCEM','SIPC',
'SKPC','SMFR','SPIN','SPMD','TANM','UEFM','WKOL','ZEOT'
]);
