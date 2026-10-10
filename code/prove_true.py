# -*- coding: utf-8 -*-
"""Prove open_true cells are real prints: (1) != prev close, (2) inside daily [L,H], (3) first-bar time ~ session start."""
import csv, os
from datetime import datetime, timezone
from collections import Counter
BASE = r"D:\EGX_DATA"

cells = {}
with open(os.path.join(BASE, "_backtest", "open_true.csv"), encoding="utf-8", errors="replace", newline="") as fh:
    for r in csv.DictReader(fh):
        cells[(r["ticker"], r["date"])] = (float(r["open_true"]), r["tf_source"])
print("cells:", len(cells), flush=True)

# daily map for check 1+2
n1 = n1eq = n2 = n2bad = 0
ex2 = []
d = os.path.join(BASE, "01_daily")
files = sorted(f for f in os.listdir(d) if f.startswith("EGX_") and f.endswith(".csv"))
for f in files:
    sym = f[len("EGX_"):-4]
    rows = []
    with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        oi, hi, li, ci = h.index("open"), h.index("high"), h.index("low"), h.index("close")
        for r in rd:
            if len(r) > max(di, oi, hi, li, ci):
                try:
                    rows.append((r[di][:10], float(r[oi]), float(r[hi]), float(r[li]), float(r[ci])))
                except Exception:
                    pass
    prev = None
    for dt, o, hh, l, c in rows:
        key = (sym, dt)
        if key in cells:
            t, _ = cells[key]
            if prev is not None and prev > 0:
                n1 += 1
                if abs(t - prev) / prev < 0.0001:
                    n1eq += 1
            n2 += 1
            if not (l - 1e-6 <= t <= hh + 1e-6):
                n2bad += 1
                if len(ex2) < 5:
                    ex2.append((sym, dt, t, l, hh))
        if c > 0:
            prev = c
print("check1: true-open == prev-close in %.2f%% (%d/%d) [fake opens were 99%%]" % (n1eq / max(n1, 1) * 100, n1eq, n1), flush=True)
print("check2: outside daily [L,H]: %d/%d = %.3f%%" % (n2bad, n2, n2bad / max(n2, 1) * 100), flush=True)
for e in ex2:
    print("  outlier:", e, flush=True)

# check 3: first-bar UTC hour distribution (60m)
hours = Counter()
dd = os.path.join(BASE, "05_intraday", "60m")
for f in sorted(os.listdir(dd))[:40]:
    if not (f.startswith("EGX_") and f.endswith(".csv")):
        continue
    with open(os.path.join(dd, f), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.DictReader(fh)
        for r in rd:
            try:
                ts = int(float(r["time"]))
            except Exception:
                continue
            hours[datetime.fromtimestamp(ts, tz=timezone.utc).hour] += 1
print("60m bar UTC hours (top):", hours.most_common(6), flush=True)
print("Cairo session 10:00-14:30 = UTC 08:00-12:30 (winter) / 07:00-11:30 (summer)", flush=True)
