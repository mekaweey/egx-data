# FOLLOW-UP OCT-4 — DELIVERY PACKAGE (branch `audit/followup-oct4`, local only, NOT merged, NOT deployed)

## Files
| File | What |
|---|---|
| momentum-weekly.server.ts | Engine WITH agreed-rule gates (6/6, >=18/20, reasons), official calendar (holidays: 2026-10-06), `bad_signal` hard stop, calendar exits + held/shortened flags, REGIME_DEF, dry-run support, telegram preview formatter |
| momentum-weekly-run.ts | Route WITH `dry_run`/`preview` (zero writes/sends), regime+def in every scan log, hard-stop alert path |
| audit_rule_tests.ts | 22 automatic tests (all green 4 Oct) — needs `oct1_fixture.json` beside it + esbuild bundle to run |
| 20261004000001_weekly_selected_unique.sql | PROPOSED ONLY migration (partial unique index vs double-selected). DO NOT APPLY without approval |
| register-ws-bridge-task.ps1 | One-time admin registrar for the WS bridge device task (Supabase stays the always-on primary) |
| oct1_fixture.json | Frozen 1-Oct snapshot, 97 file-universe symbols (from live DB, read-only dump) |
| BRANCH_FULL_DIFF.patch / BRANCH_DIFF_STAT.txt | Full diff main...audit/followup-oct4 |
| replication_v2_vs_ledger.csv | 19 common weeks: my cap-weighted replication vs FINAL_LEDGER_v1 + sign agreement |
| B2_per_pick_table.csv | The 5 alerted picks: signal/band/mom/sessions/v20/verdict/Oct-4 OHLCV/gap/fill |
| REPORT.md | Verdict tables, test results, approvals needed, questions for the user |

## Test results (4 Oct, branch): 22/22 PASS. tsc --noEmit: exit 0.
## Telegram: NOTHING was sent. Preview format implemented; sample in REPORT.md.
## Approvals needed: merge / cleanup-marking / apply migration / entry-price doctrine /
## 8-Oct holiday? / canonical sharia list / holiday-table completion / real-money gates.
