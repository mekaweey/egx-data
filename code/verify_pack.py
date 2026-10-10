# -*- coding: utf-8 -*-
"""Pack verification: (A) zip contents; (B) Yahoo independent closes; (C) live scanner fundamentals."""
import os, csv, zipfile

ZP = r"D:\EGX_AI_PACK.zip"
print("== A) zip contents ==", flush=True)
z = zipfile.ZipFile(ZP)
names = z.namelist()
print("files in zip:", len(names), flush=True)
for prefix in ["EGX_AI_PACK/intraday/1m/", "EGX_AI_PACK/intraday/60m/",
               "EGX_AI_PACK/fundamentals/", "EGX_AI_PACK/indices/",
               "EGX_AI_PACK/fx/", "EGX_AI_PACK/dividends/", "EGX_AI_PACK/MANIFEST.md"]:
    hit = [n for n in names if n.startswith(prefix)]
    print(prefix, "->", len(hit), "files", flush=True)
must = ["EGX_AI_PACK/MANIFEST.md",
        "EGX_AI_PACK/fx/USDEGP_daily_yahoo.csv",
        "EGX_AI_PACK/dividends/dividend_exdates_derived.csv",
        "EGX_AI_PACK/dividends/splits_bonuses_derived.csv",
        "EGX_AI_PACK/indices/EGX30_daily.csv",
        "EGX_AI_PACK/indices/EGX70EWI_daily.csv",
        "EGX_AI_PACK/fundamentals/fundamentals_wide.csv",
        "EGX_AI_PACK/fundamentals/dividends_summary.csv"]
for m in must:
    print(("OK  " if m in names else "MISS") + " " + m, flush=True)

print("== B) Yahoo independent closes vs our daily ==", flush=True)
import requests
ours = {}
for sym in ["COMI", "EAST", "ABUK", "FWRY", "TMGH"]:
    p = os.path.join("D:", "EGX_DATA", "01_daily", "EGX_" + sym + ".csv")
    if not os.path.exists(p):
        print(sym, "no local file", flush=True)
        continue
    dd = {}
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
    ours[sym] = dd
for sym, ysym in [("COMI", "COMI.CA"), ("EAST", "EAST.CA"), ("ABUK", "ABUK.CA"), ("FWRY", "FWRY.CA")]:
    try:
        r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/" + ysym,
                         params={"period1": "1640995200", "period2": "1791400000", "interval": "1d"},
                         headers={"User-Agent": "Mozilla/5.0"}, timeout=40)
        if r.status_code != 200:
            print(ysym, "HTTP", r.status_code, flush=True)
            continue
        d = r.json()["chart"]["result"][0]
        from datetime import datetime, timezone
        ts = d.get("timestamp", [])
        cl = d["indicators"]["quote"][0].get("close", [])
        n = m = 0
        devs = []
        for i, t in enumerate(ts):
            dt = datetime.fromtimestamp(t, tz=timezone.utc).date().isoformat()
            yc = cl[i]
            oc = ours.get(sym, {}).get(dt)
            if yc and oc and oc > 0:
                n += 1
                dev = abs(yc - oc) / oc
                devs.append(dev)
                if dev > 0.02:
                    m += 1
        devs.sort()
        med = devs[len(devs) // 2] if devs else -1
        print("%s: compared %d days, median dev %.4f, days>2%%: %d" % (ysym, n, med, m), flush=True)
    except Exception as e:
        print(ysym, "FAIL", str(e)[:120], flush=True)

print("== C) live scanner vs snapshot fundamentals ==", flush=True)
fields = "close,volume,market_cap_basic,price_earnings_ttm,dividends_yield_current,total_debt,net_income,total_revenue"
snap = {}
with open(os.path.join("D:", "EGX_DATA", "07_fundamentals", "fundamentals_wide.csv"), encoding="utf-8", errors="replace", newline="") as fh:
    for row in csv.DictReader(fh):
        snap[row["symbol"]] = row
for sym in ["EGX:COMI", "EGX:ABUK", "EGX:EAST", "EGX:FWRY", "EGX:HRHO"]:
    try:
        r = requests.get("https://scanner.tradingview.com/symbol",
                         params={"symbol": sym, "fields": fields},
                         headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
        print(sym, r.status_code, r.text[:400], flush=True)
    except Exception as e:
        print(sym, "FAIL", str(e)[:120], flush=True)
