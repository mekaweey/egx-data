# -*- coding: utf-8 -*-
"""Download Yahoo raw (unadjusted) daily for covered symbols. HTTP only."""
import csv, os, time
import requests
BASE = r"D:\EGX_DATA"
OUT = r"D:\EGX_AI_PACK_SRC\daily_raw"
os.makedirs(OUT, exist_ok=True)
cov = {}
with open(os.path.join(BASE, "_logs", "yahoo_coverage.txt"), encoding="utf-8") as fh:
    for line in fh:
        p = line.split()
        if len(p) >= 3 and p[1] == "OK":
            cov[p[0]] = int(p[2])
print("covered:", len(cov), flush=True)
ok = fail = 0
for k, sym in enumerate(sorted(cov)):
    good = False
    for att in range(2):
        try:
            r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/" + sym + ".CA",
                             params={"period1": "1451606400", "period2": "1791400000", "interval": "1d",
                                     "events": "div,split"},
                             headers={"User-Agent": "Mozilla/5.0"}, timeout=40)
            if r.status_code != 200:
                continue
            d = r.json()["chart"]["result"][0]
            ts = d.get("timestamp", [])
            q = d["indicators"]["quote"][0]
            adj = (d["indicators"].get("adjclose") or [{}])[0].get("adjclose", [])
            from datetime import datetime, timezone
            rows = []
            for i, t in enumerate(ts):
                dt = datetime.fromtimestamp(t, tz=timezone.utc).date().isoformat()
                rows.append([dt, q["open"][i], q["high"][i], q["low"][i], q["close"][i],
                             adj[i] if adj and i < len(adj) else "", q["volume"][i]])
            with open(os.path.join(OUT, "EGX_" + sym + ".csv"), "w", encoding="utf-8", newline="") as fh:
                w = csv.writer(fh)
                w.writerow(["date", "open_raw", "high_raw", "low_raw", "close_raw", "close_adj_yahoo", "volume", "source"])
                w.writerows(rows)
            ok += 1
            good = True
            break
        except Exception:
            time.sleep(2)
    if not good:
        fail += 1
    if (k + 1) % 40 == 0:
        print("progress %d/%d ok=%d fail=%d" % (k + 1, len(cov), ok, fail), flush=True)
    time.sleep(0.5)
# coverage file
with open(os.path.join(OUT, "yahoo_coverage.txt"), "w", encoding="utf-8") as fh:
    fh.write("covered=%d missing=%d\n" % (ok, fail))
print("YAHOO-RAW DONE ok=%d fail=%d" % (ok, fail), flush=True)
