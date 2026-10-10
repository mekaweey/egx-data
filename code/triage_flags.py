# -*- coding: utf-8 -*-
"""Check 23 flagged dates vs Yahoo dividend actions + stale-file scan + ORHD ratio."""
import csv, os
import requests
BASE = r"D:\EGX_DATA"
FLAGS = {"ALEX": "2026-09-28", "APPC": "2026-09-30", "DCRC": "2026-09-02", "EGS48271C018-EGP": "2026-09-23",
         "EMFD": "2026-10-01", "EPPK": "2026-09-07", "GTHE": "2026-09-30", "HBCO": "2026-10-06",
         "INEG": "2026-10-06", "KORA": "2026-10-05", "LKGP": "2026-09-28", "MBSC": "2026-10-06",
         "MCQE": "2026-10-05", "MKIT": "2026-09-30", "NBKE": "2026-09-23", "NDRL": "2023-12-14",
         "OFH": "2026-10-01", "ORHD": "2001-05-16", "PRDC": "2026-10-05", "SMPP": "2026-09-30",
         "SNFI": "2026-09-28", "SPHT": "2026-09-03", "TORA": "2026-10-07", "WATP": "2026-09-07"}
print("== Yahoo dividend actions near flagged dates ==", flush=True)
for sym, dt in sorted(FLAGS.items(), key=lambda x: x[1]):
    try:
        r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/" + sym + ".CA",
                         params={"period1": "1754000000", "period2": "1791400000", "interval": "1d",
                                 "events": "div,split"},
                         headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
        ev = r.json()["chart"]["result"][0].get("events", {})
        divs = ev.get("dividends", {})
        spl = ev.get("splits", {})
        near = []
        for k, v in list(divs.items()) + list(spl.items()):
            from datetime import datetime, timezone
            d = datetime.fromtimestamp(int(k), tz=timezone.utc).date().isoformat()
            if abs((datetime.fromisoformat(d) - datetime.fromisoformat(dt)).days) <= 3:
                near.append((d, v))
        print(sym + " " + dt + " -> " + str(near if near else "no-action"), flush=True)
    except Exception as e:
        print(sym + " " + dt + " query-fail", flush=True)
    import time
    time.sleep(0.5)

print("== stale daily files (tail < 2026-10-07) ==", flush=True)
stale = []
d = os.path.join(BASE, "01_daily")
for f in sorted(os.listdir(d)):
    if not (f.startswith("EGX_") and f.endswith(".csv")):
        continue
    with open(os.path.join(d, f), "rb") as fh:
        fh.seek(-300, 2)
        tail = fh.read().decode("utf-8", errors="replace")
    lines = [l for l in tail.strip().splitlines() if l.strip()]
    if not lines:
        stale.append((f, "empty"))
        continue
    dt = lines[-1].split(",")[1][:10] if len(lines[-1].split(",")) > 1 else "?"
    if dt < "2026-10-07":
        stale.append((f, dt))
print("stale count:", len(stale), flush=True)
for s in stale:
    print(" ", s, flush=True)
