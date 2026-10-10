# egx-data

Egyptian Exchange full dataset + research code (private).

Built 2026-10-06..10 from TradingView (account), Yahoo (cross-checks/FX fallback), FRED (macro).

## Layout
- `data/` full EGX_DATA tree (daily, intraday 6 TFs, indices, FX, fundamentals, news, reference, backtest proofs+logs)
- `code/` fetch/verify/merge/audit scripts
- `docs/pack_docs/` per-folder READMEs + MANIFEST + VERIFICATION + REGULATORY + trader template
- `docs/review_pack/` strategy review + methods inventory

## Integrity
- Every data file passed OHLC write-gates; see docs/pack_docs/VERIFICATION.md
- Known open flags: COMI/EAST vendor adjustment gaps, GRCA Sep-2026 split basis, fake daily opens (use open_true), halal-history gap

## Secrets
- No credentials in this repo (verified by scan before push).
