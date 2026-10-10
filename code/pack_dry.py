# -*- coding: utf-8 -*-
"""Build final v2 pack: EGX_AI_PACK2.zip from staged docs + fresh data. Writes pack.running/done markers."""
import csv, os, shutil, zipfile, datetime
BASE = r"D:\EGX_MERGE_DRY"
SRC = r"D:\EGX_AI_PACK_SRC"
OUT = r"D:\EGX_PACK_DRY"
LOGD = r"C:\Users\Mekawey\AppData\Local\Temp\opencode"

def log(m):
    line = datetime.datetime.now().isoformat(timespec="seconds") + " " + m
    print(line, flush=True)
    with open(os.path.join(LOGD, "pack.log"), "a", encoding="utf-8") as fh:
        fh.write(line + "\n")

def cp(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        shutil.copy(src, dst)

def trycp(src, dst):
    try:
        cp(src, dst)
        return True
    except Exception as e:
        log("SKIP missing " + src + " (" + str(e)[:60] + ")")
        return False
# NOTE: patcher must never rewrite the cp() call inside trycp above

def idx_range(folder):
    p = os.path.join(folder, "_index.csv")
    n, mn, mx = 0, None, None
    try:
        with open(p, encoding="utf-8", errors="replace", newline="") as fh:
            for r in csv.DictReader(fh):
                n += 1
                if mn is None or r["first"] < mn:
                    mn = r["first"]
                if mx is None or r["last"] > mx:
                    mx = r["last"]
    except Exception:
        pass
    return n, mn, mx

def main():
    t0 = datetime.datetime.now()
    log("PACK BUILD start")
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    # static docs + READMEs
    for e in os.listdir(SRC):
        s = os.path.join(SRC, e)
        if os.path.isfile(e if False else s) and e.endswith(".md"):
            shutil.copy(s, os.path.join(OUT, e))
    for sub in ["intraday", "daily_raw", "indices", "fx", "dividends", "fundamentals",
                "universe", "macro", "reference", "news", "regulatory"]:
        s = os.path.join(SRC, sub)
        if os.path.isdir(s):
            for root, _, files in os.walk(s):
                for f in files:
                    if f.endswith(".md") or f.endswith(".txt"):
                        dst = os.path.join(OUT, os.path.relpath(root, SRC), f)
                        os.makedirs(os.path.dirname(dst), exist_ok=True)
                        shutil.copy(os.path.join(root, f), dst)
    # fresh data
    log("copy intraday...")
    trycp(os.path.join(BASE, "05_intraday"), os.path.join(OUT, "intraday", "data"))
    log("copy daily...")
    trycp(os.path.join(BASE, "01_daily"), os.path.join(OUT, "daily_adj", "data"))
    log("copy indices/fx/funds...")
    trycp(os.path.join(BASE, "09_indices"), os.path.join(OUT, "indices", "data"))
    trycp(os.path.join(BASE, "_fx"), os.path.join(OUT, "fx", "tv"))
    trycp(os.path.join(BASE, "07_fundamentals"), os.path.join(OUT, "fundamentals", "data"))
    for f in ["universe_halal.csv"]:
        trycp(os.path.join(BASE, "_backtest", f), os.path.join(OUT, "universe", f))
    trycp(os.path.join(BASE, "11_reference", "data_quality_flags.csv"), os.path.join(OUT, "universe", "data_quality_flags.csv"))
    for f in ["inflation_annual_fred.csv", "cpi_annual_fred.csv", "cpi_reo_fred.csv"]:
        trycp(os.path.join(SRC, "macro", f), os.path.join(OUT, "macro", f))
    nw = os.path.join(BASE, "10_news", "mubasher_all_news.csv")
    if os.path.exists(nw):
        trycp(nw, os.path.join(OUT, "news", "mubasher_all_news.csv"))
    # reference table from fundamentals snapshot
    try:
        with open(os.path.join(OUT, "fundamentals", "data", "fundamentals_wide.csv"), encoding="utf-8", errors="replace", newline="") as fh:
            rd = csv.DictReader(fh)
            with open(os.path.join(OUT, "reference", "sector_float_cap.csv"), "w", encoding="utf-8", newline="") as out:
                w = csv.writer(out)
                w.writerow(["symbol", "sector", "industry", "float_shares_outstanding", "market_cap_basic", "asof"])
                for r in rd:
                    w.writerow([r.get("symbol"), r.get("sector"), r.get("industry"),
                                r.get("float_shares_outstanding"), r.get("market_cap_basic"), r.get("time")])
    except Exception as e:
        log("reference-build: " + str(e)[:100])
    # dividends derived (pack step outputs)
    for f in ["dividend_exdates_derived.csv", "splits_bonuses_derived.csv", "splits_confirmed.csv", "splits_from_raw.csv"]:
        for cand in [os.path.join(SRC, "dividends", f), os.path.join(BASE, "_backtest", f),
                     os.path.join(r"D:\EGX_AI_PACK", "dividends", f)]:
            if os.path.exists(cand):
                trycp(cand, os.path.join(OUT, "dividends", f))
                break
    # yahoo raw + open_true + universe extras
    yd = os.path.join(SRC, "daily_raw")
    if os.path.isdir(yd):
        for f in os.listdir(yd):
            if f.endswith(".csv"):
                trycp(os.path.join(yd, f), os.path.join(OUT, "daily_raw", f))
    trycp(os.path.join(BASE, "_backtest", "open_true.csv"), os.path.join(OUT, "dividends", "open_true.csv"))
    for f in ["goal_proof.json", "merge_report.json", "walkforward_trueopen.json", "deliverable.json"]:
        p = os.path.join(BASE, "_backtest", f)
        if os.path.exists(p):
            trycp(p, os.path.join(OUT, "proofs", f))
    # MANIFEST with real stats
    ml = ["# EGX AI PACK v2 — manifest (built %s)" % datetime.date.today().isoformat(), ""]
    for tf in ["1m", "5m", "15m", "30m", "60m", "240m"]:
        n, mn, mx = idx_range(os.path.join(OUT, "intraday", "data", tf))
        ml.append("- intraday/%s: %d symbols, %s -> %s" % (tf, n, mn, mx))
    n, mn, mx = idx_range(os.path.join(OUT, "daily_adj", "data"))
    ml.append("- daily_adj: %d symbols, %s -> %s (TradingView splits-adjusted; open column NOT real pre-2021, see open_true)" % (n, mn, mx))
    ml.append("- open_true: use D:\\EGX_DATA\\_backtest\\open_true.csv (573k true opens) + panel open_true columns at merge")
    ml.append("- gaps: see VERIFICATION.md + regulatory/REGULATORY.md (halal history, financial history, parallel FX, bid/ask, monthly macro, pre-2013 opens)")
    with open(os.path.join(OUT, "MANIFEST.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(ml) + "\n")
    # zip
    zp = r"D:\EGX_PACK_DRY.zip"
    if os.path.exists(zp):
        os.remove(zp)
    log("zipping...")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for root, _, files in os.walk(OUT):
            for f in files:
                fp = os.path.join(root, f)
                z.write(fp, os.path.relpath(fp, os.path.dirname(OUT)))
    bad = zipfile.ZipFile(zp).testzip()
    import time
    log("zip MB=%.1f testzip=%s secs=%d" % (os.path.getsize(zp) / 1e6, bad or "OK", (datetime.datetime.now() - t0).seconds))
    open(os.path.join(LOGD, "pack.done"), "w").write(datetime.datetime.now().isoformat())
    try:
        os.remove(os.path.join(LOGD, "pack.running"))
    except Exception:
        pass
    log("PACK DONE")

main()
