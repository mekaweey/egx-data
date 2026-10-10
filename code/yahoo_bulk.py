# -*- coding: utf-8 -*-
"""Bulk Yahoo cross-check: top-30 liquid symbols, last 60 common days. HTTP only (no TV load)."""
import csv, os
import requests
from datetime import datetime, timezone
BASE = r"D:\EGX_DATA"
panel = os.path.join(BASE, "_backtest", "panel.csv")

# top-30 by 2026 money
liq = {}
with open(panel, encoding="utf-8", errors="replace", newline="") as fh:
    for r in csv.DictReader(fh):
        if (r.get("date") or "") >= "2026-01-01" and r.get("halal") == "1":
            try:
                liq[r["ticker"]] = liq.get(r["ticker"], 0.0) + float(r["money"] or 0)
            except Exception:
                pass
top = sorted(liq, key=lambda s: -liq[s])[:30]
print("top30: " + ",".join(top), flush=True)

def ours(sym):
    dd = {}
    p = os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv")
    if not os.path.exists(p):
        return dd
    with open(p, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        ci = h.index("close")
        for r in rd:
            if len(r) > max(di, ci):
                try:
                    dd[r[di][:10]] = float(r[ci])
                except Exception:
                    pass
    return dd

import time
rep = []
for sym in top:
    ysym = sym + ".CA"
    try:
        r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/" + ysym,
                         params={"period1": "1754000000", "period2": "1791400000", "interval": "1d"},
                         headers={"User-Agent": "Mozilla/5.0"}, timeout=40)
        if r.status_code != 200:
            rep.append((sym, "HTTP " + str(r.status_code), 0, 0, []))
            continue
        d = r.json()["chart"]["result"][0]
        ts = d.get("timestamp", [])
        cl = d["indicators"]["quote"][0].get("close", [])
        o = ours(sym)
        devs = []
        worst = []
        for i, t in enumerate(ts):
            dt = datetime.fromtimestamp(t, tz=timezone.utc).date().isoformat()
            yc = cl[i]
            oc = o.get(dt)
            if yc and oc and oc > 0:
                dev = abs(yc - oc) / oc
                devs.append(dev)
                if dev > 0.02:
                    worst.append((dt, oc, round(yc, 4)))
        devs.sort()
        med = devs[len(devs) // 2] if devs else -1
        rep.append((sym, "n=" + str(len(devs)), round(med, 4), len(worst), worst[:5]))
        print(sym + " n=" + str(len(devs)) + " meddev=" + str(round(med, 4)) + " outliers=" + str(len(worst)), flush=True)
    except Exception as e:
        rep.append((sym, "FAIL " + str(e)[:60], 0, 0, []))
    time.sleep(1)
with open(os.path.join(BASE, "_logs", "yahoo_crosscheck.json"), "w", encoding="utf-8") as fh:
    import json
    json.dump(rep, fh, ensure_ascii=False, indent=1)
print("SAVED yahoo_crosscheck.json", flush=True)
