raw symbols loaded: 271
trades in file: 3586
price match vs raw (entry+exit opens): 3586 OK, 0 BAD
net recompute match: 3586 OK, 0 BAD
skipped (stuck/badpx): {}
equity curve days: 2123 from 2018-01-02 to 2026-10-06
annual rebased check (start 100k each Jan):
   2021: computed=486.7%  reported-check n_days=244
   2022: computed=173.5%  reported-check n_days=244
   2023: computed=139.4%  reported-check n_days=242
   2024: computed=314.6%  reported-check n_days=242
   2025: computed=800.6%  reported-check n_days=242
   2026: computed=72.9%  reported-check n_days=182

signal timing proof (sample 8 trades 2021-2025):
   2021-01-03 ISMA: signal_close_day=2020-12-31 (< entry OK=True) base=2020-12-24 mom=0.2666
   2021-01-06 ELNA: signal_close_day=2021-01-05 (< entry OK=True) base=2020-12-29 mom=0.2023
   2021-01-11 ELNA: signal_close_day=2021-01-10 (< entry OK=True) base=2020-12-31 mom=0.2642
   2021-01-13 PRCL: signal_close_day=2021-01-12 (< entry OK=True) base=2021-01-04 mom=0.3658
   2021-01-14 AREH: signal_close_day=2021-01-13 (< entry OK=True) base=2021-01-05 mom=0.1639
   2021-01-18 RREI: signal_close_day=2021-01-17 (< entry OK=True) base=2021-01-10 mom=0.2184
   2021-01-20 EEII: signal_close_day=2021-01-19 (< entry OK=True) base=2021-01-12 mom=0.3126
   2021-01-21 EEII: signal_close_day=2021-01-20 (< entry OK=True) base=2021-01-13 mom=0.2835

fillability re-check (100k ticket <= 10% of entry-day money):
   violations: 0/2328
