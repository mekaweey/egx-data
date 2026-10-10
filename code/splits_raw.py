# -*- coding: utf-8 -*-
"""Detect splits/bonus from Yahoo RAW closes: exact-ratio overnight gaps."""
import csv, os
from collections import defaultdict
D = r"D:\EGX_AI_PACK_SRC\daily_raw"
RATIOS = [2.0, 3.0, 1.5, 1.333333, 1.25, 1.2, 1.1, 1.05, 0.5, 0.75, 4.0, 5.0, 10.0, 0.1]
out = []
for f in sorted(os.listdir(D)):
    if not (f.startswith("EGX_") and f.endswith(".csv")):
        continue
    sym = f[len("EGX_"):-4]
    rows = []
    with open(os.path.join(D, f), encoding="utf-8", errors="replace", newline="") as fh:
        for r in csv.DictReader(fh):
            try:
                rows.append((r["date"], float(r["close_raw"])))
            except Exception:
                pass
    rows.sort()
    prev = None
    for dt, c in rows:
        if prev is not None and prev > 0 and c > 0:
            rr = prev / c
            for R in RATIOS:
                if abs(rr - R) / R < 0.005:
                    out.append((sym, dt, round(R, 4), round(prev, 4), round(c, 4)))
                    break
        if c > 0:
            prev = c
with open(os.path.join(D, "..", "dividends", "splits_from_raw.csv"), "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["symbol", "date", "ratio", "prev_close", "new_close"])
    w.writerows(sorted(out))
by = defaultdict(int)
for s, _, _, _, _ in out:
    by[s] += 1
print("split events:", len(out), "syms:", len(by), flush=True)
for s in sorted(by)[:30]:
    print(" ", s, by[s], flush=True)
