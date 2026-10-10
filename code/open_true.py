# -*- coding: utf-8 -*-
"""Build TRUE opens: first bar of day from 240m (2013+) then 60m (2021+).
Output: per-symbol open_true map + coverage stats. No network."""
import csv, os
from datetime import datetime, timezone
from collections import defaultdict
BASE = r"D:\EGX_DATA"
OUT = os.path.join(BASE, "_backtest", "open_true.csv")

def first_bars(tf):
    m = {}
    d = os.path.join(BASE, "05_intraday", tf)
    for f in sorted(os.listdir(d)):
        if not (f.startswith("EGX_") and f.endswith(".csv")):
            continue
        sym = f[len("EGX_"):-4]
        per = {}
        with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
            rd = csv.DictReader(fh)
            for r in rd:
                try:
                    ts = int(float(r["time"]))
                    o = float(r["open"])
                except Exception:
                    continue
                dt = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
                if dt not in per or ts < per[dt][0]:
                    per[dt] = (ts, o)
        for dt, (_, o) in per.items():
            m[(sym, dt)] = o
    return m

print("loading 240m...", flush=True)
m240 = first_bars("240m")
print("240m cells:", len(m240), flush=True)
print("loading 60m...", flush=True)
m60 = first_bars("60m")
print("60m cells:", len(m60), flush=True)
# 60m wins where both exist (finer)
m240.update(m60)
print("total true-open cells:", len(m240), flush=True)
with open(OUT, "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["ticker", "date", "open_true", "tf_source"])
    for (s, dt) in sorted(m240):
        src = "60m" if (s, dt) in m60 else "240m"
        w.writerow([s, dt, m240[(s, dt)], src])
print("saved open_true.csv", flush=True)
# coverage on halal panel dates
import pandas as pd
panel = pd.read_csv(os.path.join(BASE, "_backtest", "panel.csv"), usecols=["ticker", "date", "halal"])
hal = panel[panel["halal"] == 1]
hal["hit"] = [1 if (t, d[:10]) in m240 else 0 for t, d in zip(hal["ticker"], hal["date"])]
hal["yr"] = hal["date"].str[:4]
g = hal.groupby("yr")["hit"].agg(["mean", "count"])
g["mean"] = (g["mean"] * 100).round(1)
print(g.to_string(), flush=True)
