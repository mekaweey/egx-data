# Daily Archive — Setup Notes

## Task Scheduler scope

The Windows Task Scheduler entry (`SupabaseDailyArchive`) is **tied to this specific Windows installation**. It is stored in the Windows registry, not the project. The expected lifetimes are:

- **Reinstalling Windows** → the task is wiped; you must recreate it.
- **Moving the project to a new machine** → the task does not travel with the code; recreate it on the new host.
- **Renaming the project folder or moving `D:\1All Data`** → the scheduled command line is an absolute path, so the task will fail until the action path is updated.

## Task backup / restore

A portable backup of the scheduled task definition is kept at:

```
D:\1All Data\_task_backup.xml
```

To re-import it on any Windows machine that has the same `bun`/`node` runtime and the same `D:\meky-stock-main\meky-stock-main` and `D:\1All Data` paths:

```powershell
schtasks /create /tn "SupabaseDailyArchive" /xml "D:\1All Data\_task_backup.xml"
```

This recreates the task with all of its triggers, actions, and settings. Re-export after any change with:

```powershell
schtasks /query /xml /tn "SupabaseDailyArchive" > "D:\1All Data\_task_backup.xml"
```

## Self-healing script

`scripts/daily-archive.ts` is **idempotent and self-healing**. The cutoff it uses is "older than today" (the script computes `now - 2 days` by default; check `cutoffDate` near the top of the file to confirm the exact rule you set), which means:

- **Run it after any gap** — even a week, a month, or longer — and it will safely catch up on everything that should have been archived.
- **It never re-archives** rows that are already on disk: the dedup key is the primary key (`id`), so rows that already exist in a daily CSV are skipped.
- **It never deletes without a verified backup**: the export-then-verify-then-rename-then-log-then-delete pipeline refuses to remove any row from Supabase until the corresponding IDs are confirmed to exist in a `.tmp` archive file, and the list of deleted IDs is written to `D:\1All Data\_exports_log.csv` and a per-run JSON file before any `DELETE` fires.
- **The cutoff is "everything older than today"**, not "just yesterday". So whether the last run was 6 hours ago or 6 weeks ago, the next run will simply archive whatever is still older than the cutoff.

This means missed scheduled runs are safe — just run the script manually (or wait for the next scheduled run) and the archive will catch up automatically. The only thing a long gap costs you is the Supabase storage growth during the gap, which is bounded by the rate at which the live data tables are being written.

## `--export-only` mode (added Sep 2, 2026 — export snapshot, never delete)

```powershell
bun scripts/daily-archive.ts --export-only
```

A general-purpose **partial export with NO deletion**, for mid-session flexibility
(not needed for the normal 5PM flow):

- **Cutoff = NOW** (not start-of-today): exports every row up to the current
  moment, including today's still-accumulating data, into the matching
  `D:\1All Data\<table>\<YYYY-MM-DD>.csv` partitions.
- **NEVER deletes from Supabase** in this mode (no ID log, no DELETE).
- **Safe to run repeatedly**: the existing ID-based dedup-on-append means the
  day's CSV ends up as the union of all runs with zero duplicate ids.
- **Merges cleanly with the normal `--live` run later**: the end-of-day
  archive for the same day goes through the same dedup, so
  export-only-then-archive produces one correct CSV.

Verified Sep 2 (real run): `--export-only` exported 9,859 live_quotes rows to
`2026-09-02.csv` with **0 duplicate ids** in the final file and **zero
deletions** from Supabase (DB count identical before/after).

Note: a full pass fetches ALL tables (including the big marketwatch_snapshots)
page-by-page via PostgREST, which can take several minutes and load the
Supabase transaction pooler. If you only need a quick mid-session snapshot,
be aware of that cost; the pooler may briefly refuse new connections right
after a very large export.

## Historical cutoff note

`cutoffDate` uses "start of today" (everything strictly before 00:00 local
today gets archived+deleted; today's rows stay live). An earlier draft of
this README described it as "now - 2 days" — the current rule is start-of-today.

