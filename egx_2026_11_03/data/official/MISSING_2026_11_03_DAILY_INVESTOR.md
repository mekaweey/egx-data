# Missing: 2026-11-03 daily investor-flow report

The official EGX beta daily investor page (`/en/market/investors`) showed the **2026-11-04 preliminary**
values when fetched on 2026-11-04 at 10:17 Cairo. The page is current-day only and its API
(`/api/bff/egx/investor-full-statistics`) does not accept a historical date parameter.

The official daily report PDF for 2026-11-03 was not published/indexed at build time; the latest
available daily report is 2026-11-02 (ID 1022, published 03-11-2026). No daily 2026-11-03 values were invented.

Included instead:
- `egx_daily_investor_report_2026_11_02.csv`: the latest available official daily report (2026-11-02),
  explicitly labelled `report_date=2026-11-02`; it is not the 2026-11-03 report and must not be used as one.
- `egx_investor_cumulative_2026_11_03.csv`: the official cumulative snapshot
fetched 2026-11-04T08:06:35Z before the 2026-11-04 session. It is labelled
`cumulative_or_period_unspecified`; it is not a daily report.

To complete this item later, fetch the official 2026-11-03 daily report PDF/page after publication
and append it without changing the rest of this dataset.
