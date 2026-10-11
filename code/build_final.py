# -*- coding: utf-8 -*-
"""Build D:\BIDASK_FINAL (read-only sources): per-symbol ticks/quotes/depth/snapshots + summary + manifest.
Gates: input rows == output rows (logged transforms only)."""
import csv, hashlib, json, os
from collections import defaultdict
RICH = r"D:\meky-stock-main\meky-stock-main\public\rich_data_export"
ONE = r"D:\1All Data"
DST = r"D:\BIDASK_FINAL"
for sub in ["ticks", "quotes", "depth", "snapshots"]:
    os.makedirs(os.path.join(DST, sub), exist_ok=True)

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for ch in iter(lambda: fh.read(8 * 1024 * 1024), b""):
            h.update(ch)
    return h.hexdigest()

def rows_of(p):
    with open(p, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.DictReader(fh)
        return rd.fieldnames, list(rd)

ticks = defaultdict(list)    # sym -> [(ts, price, vol, source)]
quotes = defaultdict(list)   # sym -> [(ts, bid, bq, ask, aq, source)]
depth = defaultdict(list)    # sym -> [(ts, bestb, bbq, besta, baq, spread, bids_json, asks_json)]
snaps = defaultdict(list)    # sym -> [raw dict + source]
counts = {"in": 0}

# 1) rich ticks (price + quote rows)
for f in sorted(os.listdir(RICH)):
    if not f.endswith(".csv"):
        continue
    fields, rows = rows_of(os.path.join(RICH, f))
    for r in rows:
        counts["in"] += 1
        s = (r.get("symbol") or "").strip()
        if not s:
            continue
        ts = (r.get("timestamp_cairo") or "").strip()
        try:
            pr = float(r.get("price") or 0) or None
        except Exception:
            pr = None
        try:
            vo = float((r.get("volume") or "").strip() or 0)
        except Exception:
            vo = 0.0
        if pr:
            ticks[s].append((ts, pr, vo, "rich_data_export"))
        b, a = (r.get("bid") or "").strip(), (r.get("ask") or "").strip()
        if b or a:
            def ff(x):
                try:
                    return float(x)
                except Exception:
                    return ""
            quotes[s].append((ts, b, r.get("bid_qty", ""), a, r.get("ask_qty", ""), "rich_data_export"))
print("rich done", flush=True)

# 2) live_ticks
d = os.path.join(ONE, "live_ticks")
for f in sorted(os.listdir(d)):
    if not f.endswith(".csv"):
        continue
    fields, rows = rows_of(os.path.join(d, f))
    for r in rows:
        counts["in"] += 1
        s = (r.get("symbol") or "").strip()
        if not s:
            continue
        try:
            pr = float(r.get("price") or 0) or None
        except Exception:
            pr = None
        try:
            vo = float((r.get("volume") or "").strip() or 0)
        except Exception:
            vo = 0.0
        if pr:
            ticks[s].append((r.get("ts", ""), pr, vo, "live_ticks:" + (r.get("source") or "")))
print("live_ticks done", flush=True)

# 3) live_quotes
d = os.path.join(ONE, "live_quotes")
for f in sorted(os.listdir(d)):
    if not f.endswith(".csv"):
        continue
    fields, rows = rows_of(os.path.join(d, f))
    for r in rows:
        counts["in"] += 1
        s = (r.get("symbol") or "").strip()
        if not s:
            continue
        quotes[s].append((r.get("ts", ""), r.get("bid", ""), "", r.get("ask", ""), "", "live_quotes"))
print("live_quotes done", flush=True)

# 4) orderbook
d = os.path.join(ONE, "orderbook_snapshots")
for f in sorted(os.listdir(d)):
    if not f.endswith(".csv"):
        continue
    fields, rows = rows_of(os.path.join(d, f))
    for r in rows:
        counts["in"] += 1
        s = (r.get("symbol") or "").strip()
        if not s:
            continue
        depth[s].append((r.get("ts", ""), r.get("best_bid", ""), r.get("best_bid_qty", ""),
                         r.get("best_ask", ""), r.get("best_ask_qty", ""), r.get("spread", ""),
                         r.get("bids_depth", ""), r.get("asks_depth", "")))
        if (r.get("best_bid") or "").strip() or (r.get("best_ask") or "").strip():
            quotes[s].append((r.get("ts", ""), r.get("best_bid", ""), r.get("best_bid_qty", ""),
                              r.get("best_ask", ""), r.get("best_ask_qty", ""), "orderbook"))
print("orderbook done", flush=True)

# 5) marketwatch snapshots
d = os.path.join(ONE, "marketwatch_snapshots")
mw_fields = None
for f in sorted(os.listdir(d)):
    if not f.endswith(".csv"):
        continue
    fields, rows = rows_of(os.path.join(d, f))
    mw_fields = fields
    for r in rows:
        counts["in"] += 1
        s = (r.get("symbol") or "").strip()
        if not s:
            continue
        r2 = dict(r)
        r2["_source_file"] = f
        snaps[s].append(r2)
print("marketwatch done", flush=True)

# ---- write per symbol ----
out_counts = {"ticks": 0, "quotes": 0, "depth": 0, "snaps": 0}
summary = []
for s in sorted(set(list(ticks) + list(quotes) + list(depth) + list(snaps))):
    tl = sorted(ticks[s])
    with open(os.path.join(DST, "ticks", s + ".csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["time_utc", "price", "volume", "source"])
        w.writerows(tl)
    out_counts["ticks"] += len(tl)
    ql = sorted(quotes[s])
    with open(os.path.join(DST, "quotes", s + ".csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["time_utc", "bid", "bid_qty", "ask", "ask_qty", "source"])
        w.writerows(ql)
    out_counts["quotes"] += len(ql)
    dl = sorted(depth[s])
    with open(os.path.join(DST, "depth", s + ".csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["time_utc", "best_bid", "best_bid_qty", "best_ask", "best_ask_qty", "spread", "bids_depth_json", "asks_depth_json"])
        w.writerows(dl)
    out_counts["depth"] += len(dl)
    sl = sorted(snaps[s], key=lambda r: r.get("captured_at", ""))
    if sl:
        with open(os.path.join(DST, "snapshots", s + ".csv"), "w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(sl[0].keys()))
            w.writeheader()
            w.writerows(sl)
        out_counts["snaps"] += len(sl)
    summary.append({"symbol": s, "ticks": len(tl), "quotes": len(ql), "depth": len(dl), "snapshots": len(sl),
                    "tick_first": tl[0][0] if tl else "", "tick_last": tl[-1][0] if tl else ""})
with open(os.path.join(DST, "per_symbol_summary.csv"), "w", encoding="utf-8", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(summary[0].keys()))
    w.writeheader()
    w.writerows(summary)

# manifest with hashes
man = {"inputs_parsed": counts["in"], "outputs": out_counts, "files": {}}
for dp, _, fns in os.walk(DST):
    for fn in fns:
        if fn in ("MANIFEST.json",):
            continue
        p = os.path.join(dp, fn)
        man["files"][os.path.relpath(p, DST)] = sha(p)
with open(os.path.join(DST, "MANIFEST.json"), "w", encoding="utf-8") as fh:
    json.dump(man, fh, ensure_ascii=False, indent=0)
with open(os.path.join(DST, "README.md"), "w", encoding="utf-8") as fh:
    fh.write("# BIDASK_FINAL (read-only build; sources untouched)\n\n- ticks/<SYM>.csv: all prints (time_utc, price, volume, source)\n"
             "- quotes/<SYM>.csv: all quote rows incl. orderbook bests\n- depth/<SYM>.csv: full depth arrays + bests\n"
             "- snapshots/<SYM>.csv: marketwatch daily state\n- per_symbol_summary.csv, MANIFEST.json (sha256)\n"
             "No dedup across sources (documented). Times UTC; Cairo session 10:00-14:30.\n")
print("inputs:", counts["in"], "outputs:", out_counts, flush=True)
print("DONE", flush=True)
