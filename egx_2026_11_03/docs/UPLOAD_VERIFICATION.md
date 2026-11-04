# Remote upload verification - egx_2026_11_03

- Repository: `https://github.com/mekaweey/egx-data`
- Branch: `main`
- Data commit: `8d817ba5032b26f153a2e24f2cdee5a6554dbf34`
- Manifest commit: `8d817ba5032b26f153a2e24f2cdee5a6554dbf34`
- Remote head at verification: `8d817ba5032b26f153a2e24f2cdee5a6554dbf34`
- Verified at (Cairo): `2026-11-04T14:04:55+02:00`
- Dataset folder: `egx_2026_11_03/`

## Result

The data commit was pushed to `main`. The remote data tree was verified **before**
updating these two status files:

- Manifest files: **73**
- Manifest total bytes: **277,346,042**
- Remote data tree before status files: **74 files / 277,358,197 bytes**
  (73 manifest files + `MANIFEST.csv`).
- Remote file count after the follow-up status commit: **76**.

## Checks

| Check | Result |
|---|---|
| Remote `main` head equals local head at verification | PASS (`8d817ba5032b26f153a2e24f2cdee5a6554dbf34`) |
| Git index blob SHA1 vs remote tree blob SHA1 | PASS (74/74) |
| Manifest SHA256 vs remote blob content | PASS (73/73) |
| Remote data-tree byte sum vs local | PASS (277,358,197) |
| Only `egx_2026_11_03/` changed since `46e53e8` | PASS |
| `slippage_2026_11_01` unchanged since `46e53e8` | PASS (no diff) |
| No `2026_11_04` data filenames in the remote folder | PASS |
| Daily 2026-11-03 completeness | PASS (309 rows; all `is_partial=0`) |
| Live 13:55/14:05 actual; 09:55 pre-open | PASS (245 / 237 / 237; AALR bid/ask only) |
| Top-100 actual live coverage | PARTIAL (98/100; FCMD no 03/11 data; HALN 1m fallback) |
| 2026-11-03 bid/ask | PARTIAL (AALR only; others null, not invented) |
| Investor 2026-11-03 daily report | MISSING (documented; no fabrication) |
| Exact T0 216 | UNVERIFIED (248 clean union used) |
| Actual fills | NONE CLAIMED |
| Local checks | PASS (104/104) |

## Supplementary actual 09:56 tick

- Folder: `egx_2026_11_03/supplement_0956/` (4 files).
- CSV: `live_snapshots_2026_11_03_0956_actual_tv_ticks.csv`, 297 rows.
- Captured: `2026-11-03T09:56:24+02:00` from PostgreSQL `tv_ticks`.
- Available: `last_price`, `volume`, `prev_close`, `change_pct`.
- Null: `open`, `high`, `low`, `bid`, `ask`, `bid_qty`, `ask_qty`.
- It is the closest actual tick, one minute after the requested 09:55. It is
  pre-open, not a continuous-session trade, and does not replace the 09:55
  pre-open reference in the main delivery.
- Remote supplement manifest: 1/1 SHA256 match; 4 supplement files present.

## Commands used

```text
git ls-remote origin main
git ls-tree -r origin/main egx_2026_11_03
git ls-tree -r -l origin/main egx_2026_11_03
git diff --name-only 46e53e8 origin/main
git diff --name-only 46e53e8 origin/main -- slippage_2026_11_01
git cat-file blob <remote-blob-sha>   # SHA256 compared with MANIFEST.csv
```

## Caveats

- The 2026-11-03 official daily investor report was not available at build time.
  The cumulative snapshot is labelled `cumulative_or_period_unspecified` and
  assumed through 2026-11-03; the latest official daily report included is
  2026-11-02 and is clearly labelled.
- `09:55` is a pre-open reference using 2026-11-02 daily OHLCV because there is
  no live snapshot before the 10:00 open. `13:55` and `14:05` are actual
  `marketwatch_snapshots`; the 14:05 target was captured at 14:05:02 Cairo.
- Bid/ask is actual for AALR only (from `orderbook_snapshots`); the other 236
  symbols have null bid/ask because no verified 2026-11-03 quote source exists.
- Actual top-100 live coverage is 98/100: FCMD has no 2026-11-03
  daily/1m/marketwatch row; HALN has a 1m reconstruction fallback.
- The exact T0 216 list was not found; the 248-symbol clean union is a
  documented superset.
- No actual fills are present or claimed.

**التنفيذات الحقيقية غير متحققة.**
