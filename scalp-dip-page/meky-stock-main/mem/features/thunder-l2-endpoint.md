---
name: Thunder Level-2 Order Book Endpoint
description: Exact URL, response shape, sort order, and safe passive-interception rules for Thunder's market-depth API used by v4.1.64+
type: feature
---

# Thunder L2 (Market Depth) — Passive Interception Only

**Endpoint (confirmed 2026-07-01):**
`GET https://prod.thndr.app/assets-service/market-depth/{asset_uuid}`

Thunder itself calls this whenever the user has the "معلومات السوق عن المستوى الثاني" panel open. We **NEVER** trigger it ourselves — the extension reads Thunder's own responses passively via the existing `window.fetch` + XHR hook in `page-script.js`. Zero new network activity, zero DOM interaction, zero detection surface.

## Response shape (verified with full sample)
```json
{
  "bids_per_price": [ { "order_price": 202.4, "volume_traded": 100, "total_bids": 5713, "split": 1, "volume_traded_cum_sum": 100 }, ... ],
  "asks_per_price": [ { "order_price": 205.0, "volume_traded": 26,  "total_ask":  22418, "split": 1, "volume_traded_cum_sum": 26  }, ... ],
  "total_bids_and_asks": { "total_bids": 5713, "total_asks": 22418 }
}
```
- `bids_per_price` is sorted DESCENDING (best bid = `[0]`).
- `asks_per_price` is sorted ASCENDING (best ask = `[0]`).
- Always **self-sort defensively** anyway (min for asks, max for bids). Don't trust Thunder's ordering.
- Field name inside asks entries is `total_ask` (singular). Inside bids entries it is `total_bids` (plural). The summary object is `total_bids_and_asks`.

## Rules (non-negotiable, safety-first)
1. **Passive only.** The extension MUST NOT initiate a market-depth request. It only reads what Thunder already fetched. Anything else risks bot detection.
2. **Cache TTL = 10 s max.** After 10 s a snapshot is stale — fall back to the safety-floor logic (`breakEven * 1.005`), don't use bestBid.
3. **Fallback is silent.** If no fresh L2 exists (user hasn't opened the depth panel for this symbol), keep the old behavior — never fail an order because L2 is missing.
4. **Sell-side use only (for now).** When selling, if `bestBid >= safety_floor`, set limit_price = `bestBid` → marketable limit → instant fill against top buyer. Never sell below the safety floor even if bestBid is lower.
5. **UUID is the only key.** The URL is the source of truth for the asset id; do not correlate by symbol.

## Implementation locations
- Interception + parsing: `extension-v4/page-script.js` → `scanMarketDepth()` + `MARKET_DEPTH_RE`.
- Cache: `extension-v4/content.js` → `latestL2ByUuid` + `getFreshL2(uuid, maxAgeMs)`.
- Consumer: `extension-v4/content.js` → `ensureSafeLimitPrice({ refPrice, qty, uuid })`.

## First shipped in
v4.1.64 (2026-07-01).