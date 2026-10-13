# FOLLOW-UP REPORT (condensed file copy — full text lives in chat)

## 0) Corrections accepted
- E8 = TRUE (Sep-17-crossing windows invalid).
- A1 shift localized: EGX30 index rows only (2 seeded rows mislabeled by one day) + timestamptz
  signal columns displaying as previous-day 21:00Z. Equity panel correctly dated (Yahoo-verified).
- Authorship: 7dd38f07 (47 files, +15,582) is my overnight deploy; its engine lacks the ≥18/20
  rule and any holiday calendar.

## 1) Verdicts
| Item | Verdict |
|---|---|
| T1 opens trace / gap-filter trust | FAIL — opens are writer composites, not first trades (UEFM 490 < low 500; intraday open moves 5.42→5.69, 490→509.97) |
| T2 27-Sep exits | FAIL/UNRELIABLE — exits print Thursday OPENS (11.9/2.74/14.31/6.73) at 10:06:02–04, below Sunday lows → non-executable |
| T3a frozen 1-Oct → {UEFM} | PASS (22/22 tests) |
| T3b re-scan zero new rows | PASS* (determinism green; DB guarantee = unapplied migration) |
| T3c Oct-3 dupes never a signal | PASS |
| T3d missing session hard-stop+alert | PASS (live send untested — needs Sunday) |
| T3e 4-Oct exit = 11 Oct, shortened | PASS (held [04,05,07,08]) |
| T4 cleanup | PROPOSED ONLY — mark Oct-3 rows + invalid picks with invalid_reason; never delete. Sep-30 313 = 296 scanner + 17 seed-era symbols (indices ACRO/AIHC/DIFC/EHDR/ESAC/ESRS/FCMD/HCFI/KASABF/MKIT/NAPR/UASG…). |
| T5 regime | PASS* — def: close-to-close EW full-universe ≥100/wk, 10-wk product > 0. Oct-4: CC +0.0015%, OO +0.67%. Hysteresis ±1% proposed (0 historical flips either way; stops ±0.1% revisions flipping the live call). Logging implemented, live verification pending. |
| T6 replication v2 | PASS* — 19 common weeks, 15/19 sign agreement. Mine (strict, capwt): 58%, +1.89%, ex-top2 +0.76%. Ledger (permissive): 79%, +2.94%. Drivers: pick sets (18/20 rejects), weighting (empty slots), identical exits. Cited +3.47%/+1.23% ledger NOT FOUND in any searched file. ≥60% under agreed rule: NOT established (58%, wide CI). |
| T7 telegram | PASS, preview only — nothing sent |
| T8 PC-off test | Procedure in chat |
| T9 sharia | Engine uses file-97 (verified). DB=129 (32 extra). 15 file symbols DB-false. Awaiting your canonical declaration + 8-Oct ruling |
| T10 probes | PASS — dry_run/preview implemented, adopted |

## 2) Telegram PREVIEW (not sent)
🔔 [PREVIEW — لم يُرسل] إشعار شراء أسبوعي — 2026-10-04 (النظام: ON +0.00%)
• UEFM | mom +11.1% (6/6 جلسات، سيولة 20/20) | v20 4,066,433 | إغلاق 509 | شراء [493.73 .. 519.18] | مقبول
(الخروج 11-Oct، فترة مختصرة [04,05,07,08])

## 3) Branch + tests
Branch `audit/followup-oct4` (local, no upstream push). Commit 939b71a2 (+396/−33, 5 files).
Tests 22/22 PASS (sessions, frozen-UEFM + 4 reasons, determinism, 6 calendar, 2 hard-stop, 3 exit, telegram line, regime-def). tsc exit 0.

## 4) Approvals needed
1 merge? 2 mark (not delete) Oct-3 rows + invalid picks? 3 apply unique-index migration?
4 entry-price doctrine (first-trade fills vs band entries)? 5 Is 8 Oct an EGX holiday?
6 canonical sharia list (file-97 vs DB-129)? 7 confirm remaining 2026–27 holidays? 8 real-money gates stand.
