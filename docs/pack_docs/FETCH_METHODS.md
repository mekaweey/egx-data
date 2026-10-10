# Fetch methodology & speed experiments — for external reviewer (2026-10-10)
Goal: refresh ~271 EGX symbols × (daily + 6 intraday TFs) + indices + FX from TradingView, zero-defect, then rebuild derived products + pack.

## 1) Auth (verified by experiment)
- Guest (`unauthorized_user_id` token): REJECTED ("bad auth token").
- `sessionid` alone (cookie or token): REJECTED.
- `sessionid` + `sessionid_sign` as cookies, NO set_auth_token call: WORKS (series_completed + data).
- Lesson: cookies-only; any set_auth_token variant fails.

## 2) Protocol findings (verified)
- `resolve_symbol` accepts PLAIN symbol strings only ("EGX:COMI"). Any JSON param object (adjustment splits/none/raw/all/dividends) → resolve error. Consequence: server-default adjustment (splits) only; dividends-adjusted series rebuilt offline from splits + derived dividend calendar (validated 98/100 payers).
- `timescale_update` payload keys series by name (`s1` -> dict {node,s,ns,t,lbs}); bars are {i,v:[ts,o,h,l,c,v]} DICTS, not arrays (first implementation read empty for hours before dumping raw payloads).
- Heartbeats `~h~N` must be echoed or long pagination sessions drop.
- Pagination via `request_more_data` works; daily full history (6,165 bars) arrives mostly in ONE page (~3s).
- Some series carry NO volume (indices/FX): bars are 5-element; writer must pad (this bug corrupted ~40 symbols' files with shifted columns before being caught by mtime audit — all repaired + row-verified bad=0).
- Transient malformed messages under load crash naive parsers: every chunk wrapped in try/except now; failures logged with traceback to fetch_errors.log.

## 3) Speed experiments (evidence from logs, 10-09)
| Setup | Result |
|---|---|
| 8 parallel workers | 0% success, 90/90 fails each; triggered account-level throttle poisoning everything for hours |
| 4 workers + 5s sleeps | fail-storms, constant 60s cooldowns |
| 2 workers + 12-20s sleeps + auto-cooldown | 94-99% sustained success (current) |
| Foreground burst: 8 rapid singles | 8/8 OK in isolation |
| Foreground batch: 72 sequential mixed jobs | 0/72 during throttle window; same code OK outside it |
| Conclusion: shared account/IP budget ≈ a few connects/min sustained; bursts OK; hammering = multi-hour ban. Kill-switch (Stop-Process) proven working. |

## 4) Verification layers (all passing)
- Per-file write gate: OHLC invariants on EVERY row (bad>0 rejects the file).
- Tripwire daemon: fail-storm auto-kill + fresh-file spot checks (bad-rows=0 throughout).
- Yahoo cross-check top-30: median dev 0.0000; historical gaps = vendor corporate-action timing (COMI pre-2026 10%, EAST pre-2023...) — flagged, not hidden.
- Live scanner vs snapshot: close/PE/yield match within 2 sessions drift.
- Structural audit 271 symbols: 0 dup/unsorted/impossible-OHLC/negative-volume/ratio anomalies.
- USDEGP TV (7,050 bars) vs Yahoo: within ticks.

## 5) Open questions for you (better ideas wanted)
1. **Connection multiplexing**: current design = 1 websocket per (symbol × resolution) ≈ 9 connects/symbol. Can we run 7 series over ONE socket (7 chart sessions, or sequential create_series on one connection) to cut connects ~9x within the same throttle budget? This is the biggest suspected win — unimplemented for lack of time.
2. **Exact throttle rules**: do you know TV's per-account concurrent-session / connects-per-minute limits? Our data suggests a small shared budget with slow decay.
3. **Dividends adjustment via API**: any endpoint for adjustment=dividends or corporate-action calendars we missed?
4. **Scanner websocket for fundamentals history**: we have snapshot only; is there a bulk historical fundamentals feed?
5. **EGX70 plain symbol**: we use EGX70EWI (equal-weight = the index by construction) — confirm no distinct plain symbol.
6. **Parallel (black) FX**: no reliable feed found — confirm none exists.

## 6) File manifest (code)
- tv_fetch2.py (fetcher), refresh_worker.py (sharded workers + skip-by-tail-date + cooldowns), batch_refresh.py, fetch_idx.py, repair7.py/repair2.py (verified repair), fund_refresh.py (HTTP scanner), merge_all.py (divadj rebuild + weekly/monthly offline (proven vs TV: 11,036 comparisons, 0 real diffs) + consolidated + manifests + panels + rollback backups), audit_shard.py, tripwire.py, watch.py, gap_scan.py, yahoo_bulk.py.
- Logs: D:\EGX_DATA\_logs\refresh_*.log, fetch_errors.log (with tracebacks), tripwire.log, audit_*.json, merge.log.
