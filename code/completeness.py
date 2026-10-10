# -*- coding: utf-8 -*-
"""Completion measurement: % files with fresh tails (>=2026-10-08) per folder."""
import os
BASE = r"D:\EGX_DATA"
JOBS = [("01_daily", None), ("05_intraday/1m", None), ("05_intraday/5m", None),
        ("05_intraday/15m", None), ("05_intraday/30m", None),
        ("05_intraday/60m", None), ("05_intraday/240m", None)]
tot_f = tot_t = 0
stale = []
for sub, _ in JOBS:
    d = os.path.join(BASE, sub)
    fs = sorted(f for f in os.listdir(d) if f.startswith("EGX_") and f.endswith(".csv"))
    f = t = 0
    for fn in fs:
        t += 1
        try:
            with open(os.path.join(d, fn), "rb") as fh:
                fh.seek(-300, 2)
                tail = fh.read().decode("utf-8", errors="replace")
            last = [l for l in tail.strip().splitlines() if l.strip()][-1]
            cols = last.split(",")
            dt = cols[1][:10] if len(cols) > 1 else ""
            if dt >= "2026-10-08":
                f += 1
            else:
                if len(stale) < 15:
                    stale.append((sub, fn, dt))
        except Exception:
            pass
    tot_f += f
    tot_t += t
    print("%s fresh=%d/%d" % (sub, f, t), flush=True)
print("TOTAL fresh=%d/%d = %.1f%%" % (tot_f, tot_t, tot_f / max(tot_t, 1) * 100), flush=True)
print("stale sample:", stale[:15], flush=True)
