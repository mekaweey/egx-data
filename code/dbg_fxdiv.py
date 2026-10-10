# -*- coding: utf-8 -*-
"""Yahoo USDEGP=X test + COMI ratio debug."""
import csv
import requests
print("== yahoo ==", flush=True)
try:
    r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/USDEGP=X",
                     params={"period1": "1577836800", "period2": "1791400000", "interval": "1d"},
                     headers={"User-Agent": "Mozilla/5.0"}, timeout=40)
    print("status:", r.status_code, flush=True)
    if r.status_code == 200:
        d = r.json()["chart"]["result"][0]
        ts = d.get("timestamp", [])
        cl = d["indicators"]["quote"][0].get("close", [])
        print("bars:", len(ts), "first:", ts[0] if ts else None, cl[0] if cl else None,
              "last:", ts[-1] if ts else None, cl[-1] if cl else None, flush=True)
    else:
        print(r.text[:200], flush=True)
except Exception as e:
    print("yahoo FAIL:", str(e)[:200], flush=True)

print("== COMI ratio debug ==", flush=True)
A, B = {}, {}
with open(r"D:\EGX_DATA\01_daily\EGX_COMI.csv", encoding="utf-8", errors="replace", newline="") as fh:
    rd = csv.reader(fh)
    h = [x.strip().lower() for x in next(rd)]
    di, ci = (h.index("date") if "date" in h else h.index("datetime_utc")), h.index("close")
    for row in rd:
        if len(row) > max(di, ci):
            try:
                A[row[di][:10]] = float(row[ci])
            except Exception:
                pass
with open(r"D:\EGX_DATA\02_daily_divadj\EGX_COMI.csv", encoding="utf-8", errors="replace", newline="") as fh:
    rd = csv.reader(fh)
    h = [x.strip().lower() for x in (next(rd, None) or [])]
    try:
        di, ci = (h.index("date") if "date" in h else h.index("datetime_utc")), h.index("close")
    except ValueError:
        print("B header:", h, flush=True)
        raise SystemExit
    for row in rd:
        if len(row) > max(di, ci):
            try:
                B[row[di][:10]] = float(row[ci])
            except Exception:
                pass
print("A n=", len(A), "B n=", len(B), "common=", len(set(A) & set(B)), flush=True)
dates = sorted(set(A) & set(B))
prev = None
shown = 0
for dt in dates:
    if dt < "2022-01-01":
        if A[dt] > 0 and B[dt] > 0:
            prev = B[dt] / A[dt]
        continue
    a, b = A[dt], B[dt]
    if a > 0 and b > 0:
        ratio = b / a
        if prev is not None and abs(ratio - prev) / prev > 0.001:
            print(dt, "A=", a, "B=", b, "ratio %.5f -> %.5f" % (prev, ratio), flush=True)
            shown += 1
            if shown > 15:
                break
        prev = ratio
print("last ratio:", prev, flush=True)
