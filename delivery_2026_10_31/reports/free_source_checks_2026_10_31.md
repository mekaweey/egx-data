# Free-source checks — 2026-10-31

Scope: free sources for EGX 1m 2023-2024, bid/ask/order book, historical
intraday snapshots, official financial statements, and recommendations. No paid
signup and no account creation was performed. All results below are source
checks, not trading results.

## 1. Official EGX beta BFF API

Base: `https://beta.egx.com.eg/api/bff/egx`

Known valid endpoints observed in the site's own network traffic:

- `stock-categories`
- `stock-info`
- `market-watch`
- `price-volume-points`
- `index-data`
- `news-search`
- `market-status`
- gold/silver market-watch and history

`price-volume-points?isin=...&date=180` returns daily rows only:

```json
{"isinCode":"EGS21171C011","tradeDate":"2026-05-04T00:00:00","closePrice":5.87,"tradeVolume":28357379}
```

- No time of day, no open/high/low, no bid/ask.
- `date` is a lookback in days (tested up to 1095), not an intraday interval.
- The stock chart itself calls this endpoint with `date=180`.
- `stock-info` is a current quote; it has `intraday` and `with_history` flags but
  no order book and no historical bars.
- `market-watch` is the current daily quote table; 223 rows on 2026-10-29.

Candidate endpoints that would be needed for the missing data were probed:
`intraday`, `intraday-points`, `stock-intraday`, `tick-data`, `order-book`,
`market-depth`, `best-bid-ask`, `bid-ask`, `financial-statements`,
`recommendations`, `target-prices`, `stock-history`, `historical-prices`,
`price-history`, `trading-notices`, `disclosures`, `stock-news`,
`stock-details`, `company-info`, `company-profile`, `financials`,
`stock-financials`, `stock-dividends`, `corporate-actions`,
`analyst-recommendations`.

All returned HTTP 200 with `text/html` `Request Rejected` (WAF), not JSON. This
means the route is not a valid BFF endpoint; it is not an empty result.

Conclusion: no free official stock 1m, bid/ask, order book, historical intraday,
financial statements archive, or recommendation/target-price endpoint was found.

## 2. Mubasher

- Historical daily CSV: 250,154 rows / 250 symbols / 2022-01-02..2026-10-29.
- Intraday CSV: static per-symbol file, latest session only (2026-10-29),
  237 files / 32,184 bars.
- The intraday URL has no date parameter; it is overwritten each session.
- Snapshots collected on 2026-10-29: 1,346 rows / 225 symbols at 10:00, 10:05,
  14:00, 14:25, 14:28 and 14:31 proxy; 701 exact and 645 proxy; 12 stale symbols
  kept separately.

Conclusion: no free historical 1m before 2026-10-29 and no historical bid/ask.

## 3. EGX.news

Page: `https://egx.news/ar/our-data`

- Free live quotes and Level 2 market depth are advertised through RapidAPI with
  a free developer tier. This is current-only and requires an account/API key.
- Historical 1m is paid:
  - single stock: $0.10 per trading day
  - EGX30: $1.50/day
  - EGX70: $3.00/day
  - EGX100: $4.00/day
  - full market: $5.00/day
  - daily history: $1.00 per stock
- The stock 1m calculator showed a 64-trading-day range; index 1m was listed as
  2026-08-17..2026-10-29. It does not offer 2023-2024 1m in the tested range.

Conclusion: free current depth exists only with a RapidAPI account; historical
1m 2023-2024 is paid and was not purchased.

## 4. EGXAPI

- `https://egxapi.com`: 200, paid product (pricing/subscribe/api key).
- `https://api.egxapi.com`: 530, Cloudflare Tunnel error.

Conclusion: paid product; API host not reachable. Not usable free.

## 5. Borsa (borsa.ashh.me)

- 200, MIT licensed, self-hostable, BYOK, provider fallback.
- Demo limit: 50 requests/day shared across all visitors.
- OpenAPI paths: `/v1/health`, `/v1/stocks`, `/v1/quote/{symbol}`, `/v1/quotes`,
  `/v1/quotes/batch`, `/v1/quote/by-company/{name}`, `/v1/status`,
  `/demo/quote/{symbol}`.

Conclusion: quote-only; no historical/intraday/order-book endpoint. Not a 1m
source.

## 6. Yahoo Finance

Requested `COMI.CA` for 2023-01-01..2024-12-31 with `interval=1m`, `5m` and
`1d`.

- All three returned the same 483 daily rows, 2023-01-02..2024-12-30.
- `meta.dataGranularity` was `1d`.
- `meta.instrumentType` was `MUTUALFUND`.

Conclusion: the free chart endpoint returned daily data even for 1m/5m requests;
no EGX 1m 2023-2024.

## 7. Official disclosures: financial statements and recommendations

Source: `egx_official_disclosures_2022_2026_2026_10_31.csv` (72,056 rows,
11 sections).

- Financial Results: 6,835 rows.
- Rows mentioning "financial statement": 2,863.
- English "recommend": 10 rows; all are board/audit-committee/AGM
  recommendations, not broker recommendations.
- "target price": 0 rows.
- "analyst": 0 rows.
- Arabic "توصية": 1 row (AGM invitation).
- Arabic "سعر مستهدف": 0 rows.
- Arabic "قوائم مالية": 12 rows.
- Arabic "محلل": 0 rows.

Conclusion: no structured official financial statements archive and no broker
recommendation/target-price series. Financial Results disclosures exist, but they
are news items/attachments, not a clean historical statement dataset.

## 8. Trading notices (free official halt/resume timeline)

Parsed from the official disclosures:

- 979 notices: 469 suspensions, 28 suspension continuations, 475 resumes, 7 other.
- 169 symbols; 451 suspensions paired with a resume; 17 unresolved; 23 orphan
  resumes; 308 same-day pairs.
- Median halt 0 calendar days / 1 session; maximum 405 calendar days / 266
  sessions (IDHC, 2022-04-21..2023-05-31).

Impact audit against the saved S6-14:00 selected ledger (7,413 rows):

- 18 rows (0.24%) fall inside a halt using content times.
- 20 rows (0.27%) fall inside a halt using publication times.
- Most blocked rows are MOED during a notice labelled `SMEs Market`; Mubasher
  shows MOED trading heavily in that period. The notice may refer to a specific
  segment, so the count is an upper bound and was not applied to the strategy
  results.

## 9. What remains unavailable for free

- 1m bars for 2023-2024.
- Historical bid/ask or order book.
- Historical intraday snapshots before 2026-10-29.
- Structured official financial statements archive.
- Official broker recommendations/target prices.
- The user's 5-10 real trades (not provided).

## 10. What would unlock it

- Paid EGX.news 1m history, or another licensed EGX intraday vendor.
- A broker/Thndr API or exported fills for real execution checks.
- A paid/entitled Level 2 feed for historical bid/ask.
- Official financial statement PDFs/structured data from EGX or a licensed
  vendor.
- A broker research feed for recommendations/target prices.

All results are source checks; real fills are unverified.
