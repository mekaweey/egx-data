# -*- coding: utf-8 -*-
"""Scan: where does 240m-intraday basis diverge from splits-adjusted daily? (split events missed by intraday).
Per symbol: fraction of common days with |last240close/dailyClose - 1| > 2%, and max streak. Lists worst symbols."""
import csv, os
from datetime import datetime, timezone
BASE = r"D:\EGX_DATA"
syms = sorted(f[len("EGX_"):-4] for f in os.listdir(os.path.join(BASE, "01_daily"))
              if f.startswith("EGX_") and f.endswith(".csv"))
rep = []
for sym in syms:
    dd = {}
    try:
        with open(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"), encoding="utf-8", errors="replace", newline="") as fh:
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
    except Exception:
        continue
    p240 = os.path.join(BASE, "05_intraday", "240m", "EGX_" + sym + ".csv")
    if not os.path.exists(p240):
        rep.append((sym, "no-240m", 0, 0))
        continue
    last = {}
    try:
        with open(p240, encoding="utf-8", errors="replace", newline="") as fh:
            rd = csv.reader(fh)
            h = [x.strip().lower() for x in next(rd)]
            ti, ci = h.index("time"), h.index("close")
            for r in rd:
                if len(r) <= max(ti, ci):
                    continue
                try:
                    dt = datetime.fromtimestamp(int(float(r[ti])), tz=timezone.utc).date().isoformat()
                    last[dt] = float(r[ci])
                except Exception:
                    pass
    except Exception:
        continue
    n = bad = 0
    worst = []
    for dt in sorted(set(dd) & set(last)):
        if dd[dt] > 0 and last[dt] > 0:
            n += 1
            dev = abs(last[dt] / dd[dt] - 1)
            if dev > 0.02:
                bad += 1
                if len(worst) < 3:
                    worst.append((dt, dd[dt], last[dt]))
    if bad:
        rep.append((sym, "%d/%d" % (bad, n), round(bad / max(n, 1) * 100, 1), worst[:2]))
print("symbols with 240m-vs-daily gaps:", len([r for r in rep if isinstance(r[2], float)]), flush=True)
for r in sorted([x for x in rep if isinstance(x[2], float)], key=lambda x: -x[2])[:25]:
    print(r[0], r[1], str(r[2]) + "%", r[3], flush=True)
print("no-240m:", [r[0] for r in rep if r[1] == "no-240m"], flush=True)
