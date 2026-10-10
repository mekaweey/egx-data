# -*- coding: utf-8 -*-
"""Yahoo .CA coverage for all 271 symbols (existence + bar count from 2016). Polite."""
import os, time
import requests
BASE = r"D:\EGX_DATA"
syms = sorted(f[len("EGX_"):-4] for f in os.listdir(os.path.join(BASE, "01_daily"))
              if f.startswith("EGX_") and f.endswith(".csv"))
out = []
for k, s in enumerate(syms):
    try:
        r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/" + s + ".CA",
                         params={"period1": "1451606400", "period2": "1791400000", "interval": "1d"},
                         headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
        if r.status_code != 200:
            out.append((s, "HTTP" + str(r.status_code), 0))
        else:
            d = r.json()["chart"]["result"][0]
            ts = d.get("timestamp", [])
            out.append((s, "OK", len(ts)))
    except Exception as e:
        out.append((s, "FAIL", 0))
    if (k + 1) % 50 == 0:
        print("progress %d/%d" % (k + 1, len(syms)), flush=True)
    time.sleep(0.5)
ok = [x for x in out if x[1] == "OK"]
print("Yahoo coverage: %d/%d" % (len(ok), len(syms)), flush=True)
with open(os.path.join(BASE, "_logs", "yahoo_coverage.txt"), "w", encoding="utf-8") as fh:
    for s, st, n in out:
        fh.write("%s %s %d\n" % (s, st, n))
print("SAVED", flush=True)
