# Official Trading Notices — halt/resume timeline and impact audit

Source: `data/egx_official/egx_official_disclosures_2022_2026_2026_10_31.csv`
(section `Trading Notices`, 979 rows, 2022-01-02..2026-10-29).

This is an official-notice timeline, not a complete limit-up/down model and not a
trading result. Times are Cairo local. The parser does not modify the source.

## 1. What was parsed

| Item | Count |
|---|---:|
| Notices | 979 |
| Suspensions | 469 |
| Suspension continuations | 28 |
| Resumes | 475 |
| Other notices | 7 |
| Symbols | 170 |
| Suspensions paired with a resume | 452 |
| Unresolved suspensions | 17 |
| Continuations linked to an original suspension | 28 |
| Orphan resumes (no open suspension in 2022-2026) | 23 |
| Same-day suspension/resume pairs | 309 |

Median halt: 0 calendar days / 1 session. Maximum: 405 calendar days / 266
sessions (`IDHC`, 2022-04-21..2023-05-31).

Longest paired halts:

| Symbol | Published | Calendar days | Sessions | Heading |
|---|---|---:|---:|---|
| IDHC | 2022-04-21 | 405 | 266 | Suspension of Trading on Integrated Diagnostics Holdings |
| MOED | 2022-06-02 | 369 | 247 | Suspension of Trading on The Egyptian Modern Education Systems (SMEs Market) |
| ICLE | 2023-03-30 | 361 | 239 | Suspension of Trading on International Company For Leasing |
| MOSC | 2023-08-31 | 335 | 220 | Suspension of Trading on Misr Oils & Soap |
| LUTS | 2023-06-18 | 310 | 207 | Suspension of Trading on Lotus For Agricultural Investments (SMEs Market) |
| AREH | 2022-02-21 | 113 | 75 | Suspension of Trading on Egyptian Real Estate Group |
| PHGC | 2025-09-24 | 110 | 76 | Suspension of Trading on Premium Healthcare Group |
| VERT | 2023-08-13 | 91 | 64 | Suspension of Trading on Vertika for Industry & Trade (SMEs Market) |
| AREH | 2022-06-16 | 63 | 40 | Suspension of Trading on Egyptian Real Estate Group |
| SVCE | 2024-08-08 | 62 | 43 | Suspension of Trading on South Valley Cement |

## 2. Method and known limits

- A notice is a suspension if its heading contains `suspend`/`suspension`; a
  repeated suspension while the stock is already halted is a continuation, not a
  new interval; a resume closes the earliest open suspension for that symbol.
- Suspension start uses the content effective date at 09:30 when the notice gives
  a date; if the notice was published intraday on that date, the publication time
  is used. Resume uses the content time when present, otherwise publication.
- Date order is mostly day-first (`DD/MM/YYYY`), but 208 suspension dates were
  ambiguous and were resolved with day-first unless the published month made
  month-first the only valid reading. The parse note is kept per row.
- 133 pairs have a resume content time earlier than the suspension publication
  time (late publication). For duration, the publication time is used as the end
  and the row is flagged `resume_before_start_use_published_end`. For the 14:00
  impact audit, the content time is used when it is after the start; otherwise
  the interval is treated as ending at the start (no 14:00 block). This avoids
  over-blocking a stock that was already trading again.
- 17 suspensions have no matching resume in 2022-2026; they are marked
  `unresolved` and left without a duration. They may have resumed after the data
  cut-off or the resume notice may be missing.
- 23 resumes have no open suspension in 2022-2026; they may belong to a
  suspension before 2022. They are marked `orphan_resume`.
- The `SMEs Market` label matters. A notice can suspend a symbol on one segment
  while the main-market line continues to trade. The parser does not have a
  segment history, so the timeline cannot be applied blindly to all 14:00
  entries.

## 3. Impact on the saved S6-14:00 ledger

Input: `strategy-audit/data_derived/signals_all_candidates.csv`, selected rows
only (7,413 rows, 900 dates, 68 symbols). A row is "blocked" if its 14:00
decision time falls inside a suspension interval.

| Basis | Blocked rows | % of selected |
|---|---:|---:|
| Content times | 18 | 0.2428% |
| Publication times (conservative) | 20 | 0.2698% |

Composition:

- Content basis: 16 `MOED` rows during the 2022-06-02..2023-06-05 notice labelled
  `SMEs Market`, 1 `AREH` row on 2022-03-29, 1 `ETRS` row on 2026-06-30.
- Publication basis: the same plus `AJWA` on 2026-02-02 and `AREH` on 2026-07-15.
- Mubasher daily data shows `MOED` trading heavily during the supposed halt
  (e.g. 20.2m shares on 2022-09-13), so those 16 rows are likely a segment
  mismatch, not a true main-market halt.
- Excluding `MOED`, the overlap is 2 rows on content times (0.027%) and 4 rows on
  publication times (0.054%).

The impact audit is an upper bound. It was **not** applied to the strategy
results, and no P&L effect is claimed. A final execution model should exclude the
two non-MOED content overlaps and verify the `MOED` segment before using this
timeline as a hard filter.

## 4. Files

- `data/egx_official/official_trading_notices_parsed_2022_2026_2026_10_31.csv`
- `data/egx_official/official_trading_notices_summary_2026_10_31.json`
- `data/egx_official/official_trading_notices_impact_2026_10_31.json`
- `scripts/parse_trading_notices_2026_10_31.py`
- `scripts/audit_trading_notices_impact_2026_10_31.py`

All results are data audits. Real fills are unverified.
