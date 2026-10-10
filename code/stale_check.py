# -*- coding: utf-8 -*-
"""For 18 recently-stale symbols: does TV have newer bars (missed fetch) or not (suspended)?"""
import sys, time, datetime
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars
SYMS = ["DCRC", "EPPK", "FCMD", "GPPL", "GTEX", "GTHE", "HALN", "ICLE", "IRAX",
        "MISR", "MMAT", "SAIB", "SMPP", "SPHT", "WATP", "ACRO", "BIDI", "EITP"]
for s in SYMS:
    try:
        bars, meta = fetch_bars("EGX:" + s, res="1D", count=30, timeout=60)
        ts = sorted(bars)
        if ts:
            last = datetime.datetime.fromtimestamp(ts[-1], datetime.timezone.utc).date().isoformat()
            print("%s tv-last=%s n=%d resolved=%s" % (s, last, len(ts), meta.get("resolved")), flush=True)
        else:
            print("%s NO-BARS resolved=%s err=%s" % (s, meta.get("resolved"), str(meta.get("error"))[:70]), flush=True)
    except Exception as e:
        print("%s EXC %s" % (s, str(e)[:70]), flush=True)
    time.sleep(8)
print("STALE-CHECK DONE", flush=True)
