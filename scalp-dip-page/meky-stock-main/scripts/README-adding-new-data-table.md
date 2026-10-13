# Adding a New Data Table

How to add a new Supabase table to the data collection / archive / export
pipeline without breaking anything.

## Steps

1. **Create the table** — add a SQL file under `supabase/migrations/` with the
   `CREATE TABLE` (and enable RLS + grant `service_role` — every public table
   MUST have RLS enabled; the Supabase Advisor flags any that don't).
2. **Register it in `src/lib/data-tables.config.ts`** — this is the single
   source of truth used by the export UI, the backend `runExport`, and the
   daily archive script. At minimum set `timestampCol`; add `priceCol` /
   `volumeCol` / `bidCol` / `askCol` mappings if the unified export should
   carry those values.
3. **If the table is archived daily** (older rows moved to
   `D:\1All Data\<table>\<YYYY-MM-DD>.csv(.gz)`), it is automatically included
   by `scripts/daily-archive.ts` and `src/lib/archive-runner.server.ts` — both
   iterate over `DATA_TABLES` from the config. No extra code needed.
4. **Add the ingest endpoint** under `src/routes/api/public/hooks/` if the
   Thunder X extension will write to it (copy the pattern from
   `thunder-quotes.ts`: `x-thunder-token` auth, zod schema, insert).
5. **Add the extension-side capture** in `extension/extension/cdp-module.js`
   (and mirror it in the outer `extension/cdp-module.js`) only if the new data
   type is visible in the attached tab's network traffic.

## Known limitations — read before assuming a "bug"

### L2 orderbook (`orderbook_snapshots`) is SINGLE-SYMBOL by design

L2 depth data is only captured for the symbol whose trade page
(`/workspaces/<id>/trade`) is open in the attached Thunder tab. This is NOT a
bug and must not be "fixed" silently. Verified Sep 1, 2026:

- `prod.thndr.app/assets-service/market-depth/{uuid}` returns **401
  "Missing token"** without thndr's Authorization header, so direct
  background polling is impossible without the user's auth token.
- Capturing that token was **deliberately disabled** in
  `background.js` (`"auth_token_capture_disabled"`) for account-safety
  reasons — polling thndr's API on a real trading account could look like
  suspicious activity.
- Multi-tab CDP attach was reviewed as an alternative and intentionally
  deferred.

If multi-symbol L2 coverage becomes a requirement, discuss with the owner
FIRST. Do not enable token capture or multi-tab attach on your own.

### Marketwatch cadence is set by thndr, not by us

The extension captures marketwatch snapshots **passively** from the thndr
page's own polling (~20–53s between snapshots). There is no interval in our
code to "tighten" — the 4s forward-throttle is just a minimum, and the
watchdog only reloads the tab when data is staler than 45s. Any faster
cadence would require active polling of thndr's API (same auth-token problem
as L2 above).

### The 14:15–14:24 closing-auction silence is normal market behavior

EGX runs a closing call auction in that window; thndr stops pushing
continuous data during it. Do not add code that treats it as an error.

## 5. smart_exit_log & thunder_auth_events — EXPECTED TO BE EMPTY (NOT A BUG)

**These 2 tables will always be empty in this project and must NOT be flagged
as a data-collection failure in any future audit.**

They belong to the dormant live-trading execution engine
(`src/lib/smart-exit.ts`, `src/lib/paper-trader.ts`), which was never
deployed/activated in this project — confirmed Sep 3, 2026. They are part of
`DATA_TABLES` only so the archive/export pipeline can handle them
automatically IF that engine is ever turned on. Until then:

- smart_exit_log: 0 rows across all days — **expected**
- thunder_auth_events: 0 rows across all days — **expected**

---

# DATA COLLECTION STATUS — confirmed verdicts (Sep 2, 2026)

Single source of truth for what each live data type ACTUALLY does, based on
real evidence (DB audits, HAR capture of live thndr traffic, code reading,
and the CSV-vs-MKB2 cross-checks of Aug 31–Sep 2).

## 1. marketwatch_snapshots — ✅ WORKING CORRECTLY

- **What**: full-market snapshot of every thndr-tracked EGX symbol.
- **Cadence**: one snapshot every ~20–53 seconds. This is **upstream-limited
  (thndr's own page polling), not a bug and not ours to tighten** — the
  extension captures passively; the 4s forward-throttle is only a floor.
- **Coverage**: ~275 symbols per cycle (thndr's full EGX universe — larger
  than our 122-symbol sharia dashboard universe; coverage % on the health
  page measures against the 122).
- **Evidence**: Aug 24–30 archive files 57–91 MB/day; Aug 30 live audit:
  275/122 symbols, 184,713 rows; gaps only where the tab was closed or thndr
  stopped pushing (documented in AREA-3 findings).

## 2. live_ticks — ✅ WORKING (event-driven)

- **What**: per-trade price ticks, event-driven (only when trades occur /
  thndr pushes them).
- **Coverage**: ~88–97 distinct symbols per trading day.
- **Known limitation**: tied to whatever price feed thndr pushes in the
  attached tab. Confirmed via the HAR: today's thndr is **plain REST polling
  of prod.thndr.app — there are NO Firebase WebSocket frames and NO SSE**,
  so anything in the codebase expecting Firebase wire frames
  (`{t:"d", d:{b:{p:...}}}`) sees nothing. Ticks still flow because the
  generic response walker parses REST JSON.

## 3. orderbook_snapshots (L2 depth) — ✅ WORKING, SINGLE-SYMBOL BY DESIGN

- **What**: 5-level bid/ask depth book for ONE symbol at a time.
- **Coverage**: exactly the symbol whose trade page
  (`/workspaces/<id>/trade`) is open in the attached tab (e.g. MCRO
  throughout Aug 23–Sep 2 sessions).
- **Why single-symbol** (confirmed Sep 1):
  - `prod.thndr.app/assets-service/market-depth/{uuid}` returns **401
    "Missing token"** without thndr's Authorization header.
  - Token capture into the background is **deliberately disabled**
    (`"auth_token_capture_disabled"` in background.js) for account safety.
  - Multi-tab CDP attach reviewed and deferred.
- **This is an accepted, documented limitation — NOT a bug.** See the
  KNOWN LIMITATION comment above `recordMarketDepthFromCdp` in both
  cdp-module.js copies.

## 4. live_quotes (top-of-book bid/ask) — ⚠️ PENDING CANARY

- **What**: best bid/ask per symbol.
- **History**: dead for the entire Aug 22–Sep 1 window. Root cause CONFIRMED
  Sep 1 via HAR: thndr serves everything over REST; the legacy
  Firebase-frame parser (`extractFirebaseQuotes`) never matched anything.
- **Fix implemented Sep 1 (commit c9c309b0, additive)**:
  - NEW `extractRestQuotes()` parses bid/ask from the real REST
    `market-depth/{uuid}` responses captured via CDP.
  - New nullable `source` column on `live_quotes`
    (values: `rest` / `marketwatch` / `firebase` / NULL-legacy) with index;
    backend `/thunder-quotes` accepts and stores it (round-trip tested both
    with and without the field).
  - `extractFirebaseQuotes()` left byte-for-byte untouched.
- **Status: awaiting ONE live browser canary** (reload extension → open a
  trade page 5 min → check `SELECT source, count(*) FROM live_quotes ...
  GROUP BY source`). Until that shows `source='rest'` rows, treat
  live_quotes as NOT yet confirmed working.

## Related infrastructure verdicts

- **Unified CSV export**: fixed Aug 31 (streaming k-way merge; the old
  in-memory build OOM-crashed the dev server at 1.24M rows). Real test:
  1,245,198 rows returned over HTTP in 34.5s, all 4 populated tables present.
- **MKB2 binary export**: lossless by construction (round-trip verified
  byte-identical on 18/18 files, 1,245,197 rows); ~30.6 MB for the same
  10-day set that is ~375 MB as raw CSV.
- **Daily archive (export→verify→delete)**: safety-hardened (tmp-file +
  pre-delete ID verification + ID logging). Scheduled task `SupabaseDailyArchive`
  was broken (PATH/bun shim under SYSTEM) — fix steps in
  `fix-archive-task.ps1` (requires Admin).

## DATA QUALITY SYSTEM — see the dedicated doc

Per-symbol-per-day reliability metadata (OPEN/CLOSE/FULL_SESSION_RELIABLE
flags + likely_reason) now ships with every export. Full explanation of
flags, thresholds, the illiquidity-vs-collection-gap evidence rule, and the
chronic thin-trading symbol list: **`scripts/DATA_QUALITY_SYSTEM.md`**.

Also note: the unified export's per-date breakdown now flags suspiciously
thin days as `source="partial"` (under 5% of the median row count of the
range's other days) — e.g. marketwatch 2026-08-27 (4 rows) — so external
analyses stop misreading them as healthy days.

