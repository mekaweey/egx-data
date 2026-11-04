# Remote upload verification - egx_2026_11_03

- Repository: `https://github.com/mekaweey/egx-data`
- Branch: `main`
- Data commit: `dd7d018f90583937a4612461ceec28834a347916`
- Manifest commit: `a9e8c7b12d48fd85829bb10a098026b5c71c3532`
- Remote head at verification: `a9e8c7b12d48fd85829bb10a098026b5c71c3532`
- Verified at (Cairo): `2026-11-04T12:18:37+02:00`
- Dataset folder: `egx_2026_11_03/`

## Result

The data commit and the manifest-normalization commit were pushed to `main`.
The remote tree was verified **before** adding these two status files:

- Manifest files: **70**
- Manifest total bytes: **277,133,195**
- Remote tree before status files: **71 files / 277,144,797 bytes**
  (70 manifest files + `MANIFEST.csv`).
- Remote file count after the follow-up status commit: 73.

## Checks

| Check | Result |
|---|---|
| Remote `main` head equals local head at verification | PASS (`a9e8c7b12d48fd85829bb10a098026b5c71c3532`) |
| Git index blob SHA1 vs remote tree blob SHA1 | PASS (71/71) |
| Manifest SHA256 vs remote blob content | PASS (70/70) |
| Remote tree byte sum vs local folder | PASS (277,144,797) |
| Only `egx_2026_11_03/` changed since `46e53e8` | PASS |
| `slippage_2026_11_01` unchanged since `46e53e8` | PASS (no diff) |
| No `2026_11_04` data filenames in the remote folder | PASS |
| Daily 2026-11-03 completeness | PASS (309 rows; all `is_partial=0`) |
| Live snapshots labelled reconstructed, bid/ask null | PASS (245 / 232 / 232) |
| Investor 2026-11-03 daily report | MISSING (documented; no fabrication) |
| Exact T0 216 | UNVERIFIED (248 clean union used) |
| Actual fills | NONE CLAIMED |

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

- The 2026-11-03 official daily investor report was not available at build
  time. The cumulative snapshot is labelled `cumulative_or_period_unspecified`
  and assumed through 2026-11-03; the latest official daily report included is
  2026-11-02 and is clearly labelled.
- The 2026-11-03 snapshots are reconstructed, not live captures. The 09:55 file
  uses 2026-11-02 daily OHLCV because there is no 1m bar before the 10:00 open.
- No 2026-11-03 bid/ask exists in the delivered sources; nulls are used.
- The exact T0 216 list was not found; the 248-symbol clean union is a
  documented superset.
- No actual fills are present or claimed.

**التنفيذات الحقيقية غير متحققة.**
