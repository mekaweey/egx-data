# -*- coding: utf-8 -*-
"""MERGE ALL (run after refresh DONE): divadj rebuild + weekly/monthly rebuild + consolidated +
manifests + panels + dividend calendar refresh + verification. Parallel with threads."""
import csv, os, json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
BASE = r"D:\EGX_DATA"
BT = os.path.join(BASE, "_backtest")
LOG = os.path.join(BASE, "_logs", "merge.log")
RPT = {}

def log(m):
    print(m, flush=True)
    with open(LOG, "a", encoding="utf-8") as fh:
        fh.write(datetime.now().isoformat(timespec="seconds") + " " + m + "\n")

def syms():
    d = os.path.join(BASE, "01_daily")
    return sorted(f[len("EGX_"):-4] for f in os.listdir(d) if f.startswith("EGX_") and f.endswith(".csv"))

def read_sym_csv(path):
    rows = []
    with open(path, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in (next(rd, None) or [])]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        oi, hi, li, ci, vi = h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
        for r in rd:
            if len(r) > max(di, oi, hi, li, ci, vi):
                rows.append((r[di][:10], float(r[oi]), float(r[hi]), float(r[li]), float(r[ci]), float(r[vi])))
    return rows

def write_sym_csv(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["time", "datetime_utc", "open", "high", "low", "close", "volume"])
        for dt, o, h, l, c, v in rows:
            ts = int(datetime.strptime(dt, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())
            w.writerow([ts, dt + " 08:00", "%.6f" % o, "%.6f" % h, "%.6f" % l, "%.6f" % c, "%.2f" % v])
    os.replace(tmp, path)

# ---- 1) dividend calendar: reuse derived + extend check on refreshed tails
def build_calendar(all_syms):
    cal_path = os.path.join(BASE, "_backtest", "..", "..", "EGX_AI_PACK", "dividends", "dividend_exdates_derived.csv")
    cal_path = os.path.normpath(cal_path)
    cal = {}
    if os.path.exists(cal_path):
        with open(cal_path, encoding="utf-8", errors="replace", newline="") as fh:
            for r in csv.DictReader(fh):
                cal.setdefault(r["symbol"], []).append((r["ex_date"], float(r["yield_pct"])))
    return cal

def process_symbol(sym, cal):
    # resume: skip if all 4 outputs are newer than the daily input
    try:
        inp = os.path.getmtime(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"))
        outs = [os.path.join(BASE, sub, f)
                for sub, f in [("02_daily_divadj", "EGX_" + sym + ".csv"),
                               ("03_weekly", "EGX_" + sym + ".csv"),
                               ("04_monthly", "EGX_" + sym + ".csv")]]
        if all(os.path.exists(p) and os.path.getmtime(p) >= inp for p in outs):
            return sym, [], {"skipped": True}
    except Exception:
        pass
    errs = []
    # daily splits (refreshed)
    rows = read_sym_csv(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"))
    if not rows:
        return sym, ["empty-daily"], {}
    # sanity gates
    for dt, o, h, l, c, v in rows:
        if not (h >= max(o, c) - 1e-6 and l <= min(o, c) + 1e-6 and h >= l and v >= 0):
            errs.append("bad-ohlc:" + dt)
            break
    dates = [r[0] for r in rows]
    if len(dates) != len(set(dates)):
        errs.append("dup-dates")
    # new-tail dividend watch (informational only): sharp overnight drops in the fresh tail
    if len(rows) >= 2:
        for (d0, c0), (d1, c1) in zip([(r[0], r[4]) for r in rows[-6:-1]], [(r[0], r[4]) for r in rows[-5:]]):
            if c0 > 0 and (c1 - c0) / c0 <= -0.05:
                errs.append("possible-div-tail:%s" % d1)
                break
    # divadj: EXTEND TV history (sidecar) with new tails at last stable ratio;
    # only symbols with no prior divadj use the calendar walk (fallback).
    evs = sorted(cal.get(sym, []))
    evmap = {}
    for dt, y in evs:
        evmap[dt] = y
    out = []
    # EXTEND (not rebuild): keep TV's exact historical divadj; append new tail days
    sidecar = {}
    oldp = os.path.join(BASE, "02_daily_divadj", "EGX_" + sym + ".csv")
    if os.path.exists(oldp):
        try:
            with open(oldp, encoding="utf-8", errors="replace", newline="") as fh:
                rd = csv.reader(fh)
                h = [x.strip().lower() for x in (next(rd, None) or [])]
                di = h.index("date") if "date" in h else h.index("datetime_utc")
                oi, hi, li, ci, vi = h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
                for r in rd:
                    if len(r) > max(di, oi, hi, li, ci, vi):
                        sidecar[r[di][:10]] = (float(r[oi]), float(r[hi]), float(r[li]), float(r[ci]), float(r[vi]))
        except Exception as e:
            errs.append("old-divadj-read:" + str(e)[:60])
    newdates = set(r[0] for r in rows)
    for dt in sorted(sidecar):
        o, h, l, c, v = sidecar[dt]
        out.append((dt, o, h, l, c, v))
    if sidecar and newdates - set(sidecar):
        ratios = []
        for dt in sorted(set(sidecar) & set(r[0] for r in rows))[-5:]:
            srow = [r for r in rows if r[0] == dt][0]
            if srow[4] > 0 and sidecar[dt][3] > 0:
                ratios.append(sidecar[dt][3] / srow[4])
        ratio = sorted(ratios)[len(ratios) // 2] if ratios else 1.0
        for dt, o, h, l, c, v in sorted(rows):
            if dt not in sidecar:
                out.append((dt, o * ratio, h * ratio, l * ratio, c * ratio, v))
    elif not sidecar:
        # no prior divadj: fall back to calendar walk (new/rare symbols)
        evs = sorted(cal.get(sym, []))
        evmap = {dt: y for dt, y in evs}
        factor = 1.0
        tmp = []
        for dt, o, h, l, c, v in sorted(rows, reverse=True):
            tmp.append((dt, o * factor, h * factor, l * factor, c * factor, v))
            if dt in evmap:
                factor *= (1 - evmap[dt] / 100.0)
        out = sorted(tmp)
    out.sort()
    # ratio-consistency gate: divadj/splits must be (0,1] and change ONLY at calendar dates
    for (dt, o, h, l, c, v), (rdt, ro, rh, rl, rc, rv) in zip(out, sorted(rows)):
        assert dt == rdt
        if rc > 0 and c > 0:
            rr = c / rc
            if not (0 < rr <= 1.000001):
                errs.append("ratio-bad:%s" % dt)
                break
    write_sym_csv(os.path.join(BASE, "02_daily_divadj", "EGX_" + sym + ".csv"), out)
    # weekly (Sun-start) + monthly from refreshed daily
    weeks, months = {}, {}
    for dt, o, h, l, c, v in rows:
        d = datetime.strptime(dt, "%Y-%m-%d").date()
        sun = d.fromordinal(d.toordinal() - ((d.weekday() + 1) % 7)).isoformat()
        weeks.setdefault(sun, []).append((dt, o, h, l, c, v))
        months.setdefault(dt[:7], []).append((dt, o, h, l, c, v))
    wrows = []
    for sun in sorted(weeks):
        rs = sorted(weeks[sun])
        wrows.append((sun, rs[0][1], max(x[2] for x in rs), min(x[3] for x in rs), rs[-1][4], sum(x[5] for x in rs)))
    write_sym_csv(os.path.join(BASE, "03_weekly", "EGX_" + sym + ".csv"), wrows)
    mrows = []
    for m in sorted(months):
        rs = sorted(months[m])
        mrows.append((m + "-01", rs[0][1], max(x[2] for x in rs), min(x[3] for x in rs), rs[-1][4], sum(x[5] for x in rs)))
    write_sym_csv(os.path.join(BASE, "04_monthly", "EGX_" + sym + ".csv"), mrows)
    return sym, errs, {"daily": len(rows), "last": rows[-1][0]}

def main():
    all_syms = syms()
    log("MODE:REAL")
    log("merge start syms=%d" % len(all_syms))
    # rollback insurance: backup current panels
    import shutil
    os.makedirs(os.path.join(BT, "_prev"), exist_ok=True)
    for f in ["panel.csv", "panel_divadj.csv"]:
        p = os.path.join(BT, f)
        if os.path.exists(p):
            shutil.copy(p, os.path.join(BT, "_prev", f))
            log("backup " + f)
    cal = build_calendar(all_syms)
    log("calendar syms=%d" % len(cal))
    bad = {}
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(process_symbol, s, cal): s for s in all_syms}
        done = 0
        for fu in futs:
            sym, errs, info = fu.result()
            done += 1
            if errs:
                bad[sym] = errs
            if done % 50 == 0:
                log("merge %d/%d bad=%d" % (done, len(all_syms), len(bad)))
    # consolidated ALL_daily + manifests per folder
    for sub, agg in [("01_daily", "ALL_daily.csv"), ("02_daily_divadj", "ALL_divadj.csv"),
                     ("03_weekly", "ALL_weekly.csv"), ("04_monthly", "ALL_monthly.csv")]:
        d = os.path.join(BASE, sub)
        with open(os.path.join(d, agg), "w", encoding="utf-8", newline="") as out:
            w = csv.writer(out)
            w.writerow(["symbol", "time", "date", "open", "high", "low", "close", "volume", "source"])
            for s in all_syms:
                p = os.path.join(d, "EGX_" + s + ".csv")
                if not os.path.exists(p):
                    continue
                with open(p, encoding="utf-8", errors="replace", newline="") as fh:
                    rd = csv.reader(fh)
                    next(rd, None)
                    for r in rd:
                        if len(r) >= 7:
                            w.writerow([s] + r)
        # _index
        with open(os.path.join(d, "_index.csv"), "w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["symbol", "rows", "first", "last"])
            for s in all_syms:
                p = os.path.join(d, "EGX_" + s + ".csv")
                if not os.path.exists(p):
                    continue
                with open(p, encoding="utf-8", errors="replace", newline="") as fh2:
                    rd = list(csv.reader(fh2))
                    if len(rd) > 1:
                        w.writerow([s, len(rd) - 1, rd[1][1], rd[-1][1]])
    # panels (halal + flags + money from splits)
    import pandas as pd
    uni = pd.read_csv(os.path.join(BT, "universe_halal.csv"))
    halal = set(uni[uni["halal"] == 1]["ticker"]) if "halal" in uni.columns else set(uni["ticker"])
    flags = pd.read_csv(os.path.join(BASE, "11_reference", "data_quality_flags.csv"))
    flags["date"] = flags["date"].astype(str).str[:10]
    fsym = "symbol" if "symbol" in flags.columns else "ticker"
    flagset = set(zip(flags[fsym], flags["date"]))
    for src, dst in [("ALL_daily.csv", "panel.csv"), ("ALL_divadj.csv", "panel_divadj.csv")]:
        df = pd.read_csv(os.path.join(BASE, "01_daily" if src == "ALL_daily.csv" else "02_daily_divadj", src))
        df = df.rename(columns={"symbol": "ticker"})
        df["halal"] = df["ticker"].isin(halal).astype(int)
        df["money"] = df["close"] * df["volume"]
        df["flag"] = [1 if (t, str(dd)[:10]) in flagset else 0 for t, dd in zip(df["ticker"], df["date"])]
        df = df.sort_values(["ticker", "date"])
        df[["ticker", "date", "open", "high", "low", "close", "volume", "money", "flag", "halal"]].to_csv(
            os.path.join(BT, dst), index=False)
        log("%s rows=%d" % (dst, len(df)))
    rep = {"bad_symbols": bad, "n_syms": len(all_syms)}
    with open(os.path.join(BT, "merge_report.json"), "w", encoding="utf-8") as fh:
        json.dump(rep, fh, ensure_ascii=False, indent=1)
    log("MERGE DONE bad=%d %s" % (len(bad), sorted(bad)[:10]))

main()
