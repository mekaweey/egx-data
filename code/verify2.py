# -*- coding: utf-8 -*-
"""Spot-check COMI/EAST raw values + snapshot-vs-live fundamentals."""
import csv, requests

def ours(sym):
    dd = {}
    with open(r"D:\EGX_DATA\01_daily\EGX_" + sym + ".csv", encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        oi, ci = h.index("open"), h.index("close")
        for r in rd:
            if len(r) > max(di, oi, ci):
                dd[r[di][:10]] = (r[oi], r[ci])
    return dd

for sym, ysym in [("COMI", "COMI.CA"), ("EAST", "EAST.CA")]:
    o = ours(sym)
    r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/" + ysym,
                     params={"period1": "1654041600", "period2": "1791400000", "interval": "1d"},
                     headers={"User-Agent": "Mozilla/5.0"}, timeout=40).json()["chart"]["result"][0]
    from datetime import datetime, timezone
    ts = r.get("timestamp", [])
    cl = r["indicators"]["quote"][0].get("close", [])
    op = r["indicators"]["quote"][0].get("open", [])
    yd = {}
    for i, t in enumerate(ts):
        yd[datetime.fromtimestamp(t, tz=timezone.utc).date().isoformat()] = (op[i], cl[i])
    for dt in ["2025-01-12", "2025-06-01", "2025-09-01", "2026-01-11", "2026-06-01", "2026-10-01", "2026-10-05"]:
        print(sym, dt, "ours(O,C)=", o.get(dt), "yahoo(O,C)=", yd.get(dt), flush=True)

print("== snapshot vs live ==", flush=True)
snap = {}
with open(r"D:\EGX_DATA\07_fundamentals\fundamentals_wide.csv", encoding="utf-8", errors="replace", newline="") as fh:
    for row in csv.DictReader(fh):
        snap[row["symbol"]] = row
fields = "close,price_earnings_ttm,dividends_yield_current,market_cap_basic"
for sym in ["EGX:COMI", "EGX:ABUK", "EGX:EAST", "EGX:FWRY"]:
    r = requests.get("https://scanner.tradingview.com/symbol", params={"symbol": sym, "fields": fields},
                     headers={"User-Agent": "Mozilla/5.0"}, timeout=20).json()
    s = snap.get(sym, {})
    print(sym, flush=True)
    for f in fields.split(","):
        print("  " + f + ": snapshot=" + str(s.get(f)) + " live=" + str(r.get(f)), flush=True)
