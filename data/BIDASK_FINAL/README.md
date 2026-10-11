# BIDASK_FINAL (read-only build; sources untouched)

- ticks/<SYM>.csv: all prints (time_utc, price, volume, source)
- quotes/<SYM>.csv: all quote rows incl. orderbook bests
- depth/<SYM>.csv: full depth arrays + bests
- snapshots/<SYM>.csv: marketwatch daily state
- per_symbol_summary.csv, MANIFEST.json (sha256)
No dedup across sources (documented). Times UTC; Cairo session 10:00-14:30.
