# -*- coding: utf-8 -*-
"""USDEGP from Stooq (public, no auth) + dividend ex-dates derived offline + fundamentals date."""
import os, csv
import requests

OUT = r"D:\EGX_AI_PACK"
os.makedirs(os.path.join(OUT, "fx"), exist_ok=True)
os.makedirs(os.path.join(OUT, "dividends"), exist_ok=True)

# ---- 1) USDEGP daily from Stooq
print("fetching USDEGP...", flush=True)
r = requests.get("https://stooq.com/q/d/l/", params={"s": "usdegp", "i": "d"},
                 headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
print("stooq status:", r.status_code, "bytes:", len(r.content), flush=True)
open(os.path.join(OUT, "fx", "USDEGP_daily_stooq.csv"), "wb").write(r.content)
rows = list(csv.reader(r.text.splitlines()))
print("rows:", len(rows) - 1, "first:", rows[1] if len(rows) > 1 else None,
      "last:", rows[-1] if len(rows) > 1 else None, flush=True)
y2020 = [x for x in rows[1:] if len(x) > 0 and x[0] >= "2020-01-01"]
print("rows>=2020:", len(y2020), "last close:", y2020[-1] if y2020 else None, flush=True)

# ---- 2) dividend ex-dates: splits vs divadj ratio jumps
print("deriving dividend calendar...", flush=True)
A, B = {}, {}
d = os.path.join("D:", "EGX_DATA", "01_daily")
for f in sorted(os.listdir(d)):
    if not (f.startswith("EGX_") and f.endswith(".csv")):
        continue
    sym = f[len("EGX_"):-4]
    dd = {}
    with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in (next(rd, None) or [])]
        try:
            di, ci = h.index("date") if "date" in h else h.index("datetime_utc"), h.index("close")
        except ValueError:
            continue
        for row in rd:
            if len(row) > max(di, ci):
                try:
                    dd[row[di][:10]] = float(row[ci])
                except Exception:
                    pass
    A[sym] = dd
d2 = os.path.join("D:", "EGX_DATA", "02_daily_divadj")
for f in sorted(os.listdir(d2)):
    if not (f.startswith("EGX_") and f.endswith(".csv")):
        continue
    sym = f[len("EGX_"):-4]
    dd = {}
    with open(os.path.join(d2, f), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in (next(rd, None) or [])]
        try:
            di, ci = h.index("date") if "date" in h else h.index("datetime_utc"), h.index("close")
        except ValueError:
            continue
        for row in rd:
            if len(row) > max(di, ci):
                try:
                    dd[row[di][:10]] = (float(row[ci]))
                except Exception:
                    pass
    B[sym] = dd
events = []
for sym in A:
    if sym not in B:
        continue
    dates = sorted(set(A[sym]) & set(B[sym]))
    prev = None
    for dt in dates:
        a, b = A[sym][dt], B[sym][dt]
        if a > 0 and b > 0:
            ratio = b / a
            if prev is not None and abs(ratio - prev) / prev > 0.001 and ratio < prev:
                # dividend Vega: yield% = 1 - ratio/prev ; amount approx = a*(1-ratio/prev)
                events.append((sym, dt, round((1 - ratio / prev) * 100, 3), round(a * (1 - ratio / prev), 4)))
            prev = ratio
events.sort()
with open(os.path.join(OUT, "dividends", "dividend_exdates_derived.csv"), "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["symbol", "ex_date", "yield_pct", "amount_egp_est"])
    w.writerows(events)
print("derived events:", len(events), "syms:", len(set(e[0] for e in events)), flush=True)
# cross-check vs dividends_summary recent dates
chk = {}
with open(os.path.join("D:", "EGX_DATA", "07_fundamentals", "dividends_summary.csv"), encoding="utf-8", errors="replace", newline="") as fh:
    rd = csv.DictReader(fh)
    for r in rd:
        chk[r["symbol"]] = r.get("exDateRecent", "")
hit = sum(1 for (s, dt, _, _) in events if chk.get(s, "")[:10] == dt)
print("recent-date cross-check hits:", hit, "of", len([c for c in chk.values() if c]), flush=True)

# ---- 3) fundamentals snapshot date
with open(os.path.join("D:", "EGX_DATA", "07_fundamentals", "fundamentals_wide.csv"), encoding="utf-8", errors="replace", newline="") as fh:
    rd = csv.DictReader(fh)
    rows = list(rd)
from collections import Counter
print("fundamentals syms:", len(rows), "time values:", Counter(r.get("time", "?") for r in rows).most_common(3), flush=True)
