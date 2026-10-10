# -*- coding: utf-8 -*-
"""Refresh fundamentals snapshot via HTTP scanner (no auth needed). Saves fund_wide_live.csv."""
import csv, os, time
import requests
BASE = r"D:\EGX_DATA"
SYMS = sorted(f[len("EGX_"):-4] for f in os.listdir(os.path.join(BASE, "01_daily"))
              if f.startswith("EGX_") and f.endswith(".csv"))
FIELDS = ["close", "volume", "market_cap_basic", "price_earnings_ttm",
          "earnings_per_share_basic_ttm", "total_debt", "debt_to_equity",
          "total_revenue", "net_income", "dividends_yield_current",
          "dividend_payout_ratio", "ex_dividend_date", "dividends_per_share",
          "total_shares_outstanding", "return_on_equity", "gross_margin"]
rows, fails = [], []
for k, s in enumerate(SYMS):
    ok = False
    for att in range(3):
        try:
            r = requests.get("https://scanner.tradingview.com/symbol",
                             params={"symbol": "EGX:" + s, "fields": ",".join(FIELDS)},
                             headers={"User-Agent": "Mozilla/5.0"}, timeout=25)
            if r.status_code == 200:
                d = r.json()
                rows.append({"symbol": s, "time": int(time.time()), **{f: d.get(f) for f in FIELDS}})
                ok = True
                break
        except Exception:
            pass
        time.sleep(1 + att)
    if not ok:
        fails.append(s)
    time.sleep(0.4)
    if (k + 1) % 50 == 0:
        print("progress %d/%d fails=%d" % (k + 1, len(SYMS), len(fails)), flush=True)
out = os.path.join(BASE, "07_fundamentals", "fund_wide_live.csv")
with open(out, "w", encoding="utf-8", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["symbol", "time"] + FIELDS)
    w.writeheader()
    w.writerows(rows)
print("DONE rows=%d fails=%d %s" % (len(rows), len(fails), fails[:10]), flush=True)
