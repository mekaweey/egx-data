# -*- coding: utf-8 -*-
"""Self-test tv_fetch2: COMI 10 bars + USDEGP resolve + EGX70 resolve. Prints counts only."""
import sys, os
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars
from datetime import datetime, timezone
for sym, res, adj in [("EGX:COMI", "1D", "splits"), ("FX:USDEGP", "1D", "splits"), ("EGX:EGX70", "1D", "splits")]:
    bars, meta = fetch_bars(sym, res=res, count=10, adjustment=adj, timeout=90)
    print(sym, "resolved:", meta.get("resolved"), "n:", meta.get("n"), "err:", meta.get("error"), flush=True)
    if bars:
        ts = sorted(bars)
        print("  range:", datetime.fromtimestamp(ts[0], tz=timezone.utc).date(),
              "->", datetime.fromtimestamp(ts[-1], tz=timezone.utc).date(),
              "last close:", bars[ts[-1]][3], flush=True)
