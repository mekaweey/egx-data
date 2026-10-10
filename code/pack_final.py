# -*- coding: utf-8 -*-
"""FINAL pack build: FX Yahoo + dividend calendar (fixed direction) + verify + zip."""
import os, csv, shutil
import requests
BT = r"D:\EGX_DATA\_backtest"
OUT = r"D:\EGX_AI_PACK"
os.makedirs(os.path.join(OUT, "fx"), exist_ok=True)
os.makedirs(os.path.join(OUT, "dividends"), exist_ok=True)

# ---- 1) Yahoo USDEGP=X full daily
print("saving USDEGP...", flush=True)
r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/USDEGP=X",
                 params={"period1": "1577836800", "period2": "1791400000", "interval": "1d"},
                 headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
d = r.json()["chart"]["result"][0]
from datetime import datetime, timezone
ts = d.get("timestamp", [])
q = d["indicators"]["quote"][0]
with open(os.path.join(OUT, "fx", "USDEGP_daily_yahoo.csv"), "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["date", "open", "high", "low", "close", "volume", "source"])
    for i, t in enumerate(ts):
        dt = datetime.fromtimestamp(t, tz=timezone.utc).date().isoformat()
        w.writerow([dt, q["open"][i], q["high"][i], q["low"][i], q["close"][i], q["volume"][i], "yahoo-USDEGP=X"])
print("usdegp bars:", len(ts), flush=True)

# ---- 2) dividend calendar: UPWARD ratio jumps (forward in time) + splits log for downward
def load_close(path):
    dd = {}
    with open(path, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in (next(rd, None) or [])]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        ci = h.index("close")
        for row in rd:
            if len(row) > max(di, ci):
                try:
                    dd[row[di][:10]] = float(row[ci])
                except Exception:
                    pass
    return dd

divs, splits = [], []
dA = os.path.join("D:", "EGX_DATA", "01_daily")
dB = os.path.join("D:", "EGX_DATA", "02_daily_divadj")
for f in sorted(os.listdir(dA)):
    if not (f.startswith("EGX_") and f.endswith(".csv")):
        continue
    sym = f[len("EGX_"):-4]
    pB = os.path.join(dB, f)
    if not os.path.exists(pB):
        continue
    A, B = load_close(os.path.join(dA, f)), load_close(pB)
    dates = sorted(set(A) & set(B))
    prev = None
    prevA = None
    for dt in dates:
        a, b = A[dt], B[dt]
        if a > 0 and b > 0:
            ratio = b / a
            if prev is not None and abs(ratio - prev) / prev > 0.001:
                yld = (ratio / prev - 1) * 100
                if yld > 0:
                    divs.append((sym, dt, round(yld, 3), round((prevA or a) * yld / 100, 4)))
                else:
                    splits.append((sym, dt, round(yld, 3)))
            prev = ratio
            prevA = a
divs.sort()
splits.sort()
with open(os.path.join(OUT, "dividends", "dividend_exdates_derived.csv"), "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["symbol", "ex_date", "yield_pct", "amount_egp_est", "method"])
    for s, dt, y, amt in divs:
        w.writerow([s, dt, y, amt, "splits-vs-divadj-ratio-jump"])
with open(os.path.join(OUT, "dividends", "splits_bonuses_derived.csv"), "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["symbol", "date", "ratio_chg_pct", "method"])
    for s, dt, y in splits:
        w.writerow([s, dt, y, "ratio-drop"])
print("div events:", len(divs), "syms:", len(set(e[0] for e in divs)), "splits:", len(splits), flush=True)
# cross-check: symbols with amountRecent>0 should have recent (>=2023) events
recent = {}
with open(os.path.join("D:", "EGX_DATA", "07_fundamentals", "dividends_summary.csv"), encoding="utf-8", errors="replace", newline="") as fh:
    for row in csv.DictReader(fh):
        try:
            amt = float(row.get("amountRecent") or 0)
        except Exception:
            amt = 0
        if amt > 0:
            recent[row["symbol"]] = amt
have = set(e[0] for e in divs if e[1] >= "2023-01-01")
miss = sorted(set(recent) - have)
print("payers:", len(recent), "with 2023+ derived events:", len(set(recent) & have), "missing:", miss[:15], flush=True)
