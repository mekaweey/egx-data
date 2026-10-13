-- Audit Oct-4 (task 3b + task 4): prevent double-selected paper positions.
-- STATUS: PROPOSED ONLY. DO NOT APPLY without the user's explicit approval
-- (applying rewrites production constraints; existing duplicate rows from
-- the 3-Oct deploy-transition double-scan must be reviewed first, never
-- silently merged or deleted).
--
-- Rationale: on 2026-10-03 two overlapping scans persisted selected rows for
-- the same entry week (GPIM/MMAT/UEFM selected twice under two scan_dates),
-- and morning fills bought both batches. One selectable position per
-- (symbol, entry week) must exist.
--
-- NOTE: entry_date is stored as timestamptz Cairo-midnight (21:00Z display).
-- ISO weeks run Mon-Sun, so every Sunday opens a new ISO week number and
-- plain IYYY-IW on the Cairo date buckets entry Sundays 1:1.
-- DEPLOY STEPS (after approval): (1) backfill review of duplicates,
-- (2) run this file via supabase db push, (3) re-run audit test (b).

-- Guard: at most one selected row per symbol per Sunday-anchored entry week.
CREATE UNIQUE INDEX IF NOT EXISTS uq_weekly_selected_symbol_entryweek
  ON momentum_weekly_signals (symbol, (to_char(entry_date AT TIME ZONE 'Africa/Cairo', 'IYYY-IW')))
  WHERE selected IS TRUE;
