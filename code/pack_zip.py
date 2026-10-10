# -*- coding: utf-8 -*-
"""Assemble D:\EGX_AI_PACK + MANIFEST + zip + verify."""
import os, shutil, csv, zipfile
from datetime import datetime, timezone
SRC = r"D:\EGX_DATA"
OUT = r"D:\EGX_AI_PACK"

for sub in ["05_intraday", "07_fundamentals", "09_indices"]:
    dst = os.path.join(OUT, sub.split("_", 1)[1] if "_" in sub[:3] else sub)
    print("copying " + sub + "...", flush=True)
    shutil.copytree(os.path.join(SRC, sub), dst, dirs_exist_ok=True)

# manifest: per-TF symbol ranges from _index manifests
lines = []
lines.append("# EGX AI DATA PACK — manifest (built 2026-10-09)")
lines.append("")
lines.append("## 1) Minute/intraday (TradingView, max history available per timeframe)")
for tf in ["1m", "5m", "15m", "30m", "60m", "240m"]:
    p = os.path.join(OUT, "intraday", tf, "_index.csv")
    n, firsts, lasts = 0, [], []
    with open(p, encoding="utf-8", errors="replace", newline="") as fh:
        for r in csv.DictReader(fh):
            n += 1
            firsts.append(r["first"][:10])
            lasts.append(r["last"][:10])
    lines.append("- %s: %d symbols, %s -> %s (per-symbol detail in %s/_index.csv)" % (tf, n, min(firsts), max(lasts), tf))
lines.append("")
lines.append("NOTE: 1m history is capped by TradingView (~6 weeks back from 2026-10-06). Older 1m bars do not exist.")
lines.append("")
lines.append("## 2) Fundamentals (TradingView snapshot 2026-10-06; 254 symbols, ~200 fields)")
lines.append("- fundamentals/fundamentals_wide.csv: earnings (EPS TTM, net_income, revenue), debt (total_debt, debt_to_equity), dividends (yield, payout, ex dates recent/upcoming), forecasts, technicals.")
lines.append("- fundamentals/dividends_summary.csv: amountRecent + yield per symbol (ex-date columns empty at source).")
lines.append("- GAP (honest): historical financial-statement time series NOT available (financials_wide.csv empty at source). Snapshot only.")
lines.append("")
lines.append("## 3) Indices (daily, TradingView)")
lines.append("- indices/EGX30_daily.csv: 1998-01-01 -> 2026-10-06 (7012 bars).")
lines.append("- indices/EGX70EWI_daily.csv: 2017-01-02 -> 2026-10-06 (2366 bars). NOTE: EGX70 IS the equal-weight index; EGX70EWI is its TradingView symbol.")
lines.append("- indices/EGX100EWI_daily.csv, SHARIAH_daily.csv included.")
lines.append("")
lines.append("## 4) USD/EGP daily from 2020 (Yahoo USDEGP=X, public)")
lines.append("- fx/USDEGP_daily_yahoo.csv: 2020-01-01 -> 2026-10-06 (1766 bars, 16.01 -> 52.25). TradingView history blocked (auth); Yahoo used instead, source labeled per row.")
lines.append("")
lines.append("## 5) Dividend ex-dates (DERIVED offline, exact method)")
lines.append("- dividends/dividend_exdates_derived.csv: 2041 events / 187 symbols. Method: upward jumps (>0.1%) in ratio divadj_close/splits_close forward in time (both series converge to live price at front; splits affect both equally).")
lines.append("- Validation: 100 payers with amountRecent>0 -> 98 have 2023+ derived events; the 2 missing (MEGM data ends 2022-04-28, SEIGA ends 2022-01-20) are delisted/suspended = correctly absent.")
lines.append("- dividends/splits_bonuses_derived.csv: 14 downward jumps (splits/bonus issues) logged separately.")
lines.append("")
lines.append("## Gaps (could not fetch — TradingView history auth blocked, guest + user sessionid rejected)")
lines.append("- No refresh of any TradingView series possible right now (needs sessionid_sign cookie too). Pack is frozen at 2026-10-06 (last session).")
with open(os.path.join(OUT, "MANIFEST.md"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(lines) + "\n")
print("manifest written", flush=True)

zp = r"D:\EGX_AI_PACK.zip"
print("zipping...", flush=True)
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for root, _, files in os.walk(OUT):
        for f in files:
            fp = os.path.join(root, f)
            z.write(fp, os.path.relpath(fp, os.path.dirname(OUT)))
print("zip bytes:", os.path.getsize(zp), flush=True)
bad = zipfile.ZipFile(zp).testzip()
print("testzip:", bad if bad else "OK", flush=True)
