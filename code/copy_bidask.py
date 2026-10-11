# -*- coding: utf-8 -*-
"""Copy ALL bid/ask-related data to D:\BIDASK_DATA (read-only on source).
Steps: snapshot source hashes+mtimes -> copy -> verify identical -> verify source untouched."""
import csv, hashlib, json, os, shutil

SRC_TICKS = r"D:\meky-stock-main\meky-stock-main\public\rich_data_export"
DST = r"D:\BIDASK_DATA"
os.makedirs(os.path.join(DST, "ticks"), exist_ok=True)
os.makedirs(os.path.join(DST, "quotes_only"), exist_ok=True)
os.makedirs(os.path.join(DST, "collector"), exist_ok=True)

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for ch in iter(lambda: fh.read(4 * 1024 * 1024), b""):
            h.update(ch)
    return h.hexdigest()

# 1) snapshot source
snap = {}
for f in sorted(os.listdir(SRC_TICKS)):
    p = os.path.join(SRC_TICKS, f)
    if os.path.isfile(p):
        st = os.stat(p)
        snap[f] = {"sha": sha(p), "mtime": st.st_mtime, "size": st.st_size}
print("source files:", len(snap), flush=True)

# 2) find collector code (ws bridge / tick collector, outside node_modules)
coll = []
for dp, dns, fns in os.walk(r"D:\meky-stock-main"):
    if "node_modules" in dp or ".output" in dp:
        continue
    for fn in fns:
        if fn.endswith((".ts", ".js", ".ps1", ".xml", ".md")) and any(
                k in (dp + fn).lower() for k in ["ws-bridge", "websocket", "rich_data", "tick", "scalp", "momentum-weekly"]):
            coll.append(os.path.join(dp, fn))
print("collector candidates:", len(coll), flush=True)

# 3) copy ticks (exact) + verify hash
for f, info in snap.items():
    dst = os.path.join(DST, "ticks", f)
    shutil.copy2(os.path.join(SRC_TICKS, f), dst)
    assert sha(dst) == info["sha"], "COPY MISMATCH " + f
print("ticks copied+verified:", len(snap), flush=True)

# 4) copy collector files (keep relative structure, max 200 files)
for p in coll[:200]:
    rel = os.path.relpath(p, r"D:\meky-stock-main")
    dst = os.path.join(DST, "collector", rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(p, dst)
print("collector files copied:", min(len(coll), 200), flush=True)

# 5) verify source untouched (hash + mtime identical)
bad = []
for f, info in snap.items():
    p = os.path.join(SRC_TICKS, f)
    st = os.stat(p)
    if sha(p) != info["sha"] or st.st_mtime != info["mtime"]:
        bad.append(f)
print("source untouched:", "YES" if not bad else bad, flush=True)

# 6) quotes-only extracts (bid/ask rows) in NEW folder only
qtot = 0
for f in sorted(os.listdir(os.path.join(DST, "ticks"))):
    n = 0
    with open(os.path.join(DST, "ticks", f), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.DictReader(fh)
        rows = [r for r in rd if (r.get("bid") or "").strip() or (r.get("ask") or "").strip()]
    if rows:
        with open(os.path.join(DST, "quotes_only", f), "w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=rows[0].keys())
            w.writeheader()
            w.writerows(rows)
        n = len(rows)
    qtot += n
print("quotes_only rows total:", qtot, flush=True)

# 7) manifest
man = {"source": SRC_TICKS, "files": len(snap),
       "sha256": {f: v["sha"] for f, v in snap.items()},
       "quotes_rows": qtot}
with open(os.path.join(DST, "MANIFEST.json"), "w", encoding="utf-8") as fh:
    json.dump(man, fh, ensure_ascii=False, indent=1)
with open(os.path.join(DST, "README.md"), "w", encoding="utf-8") as fh:
    fh.write("# BIDASK_DATA (copy, source untouched)\n\n- ticks/: exact daily tick files (bid/ask where present)\n"
             "- quotes_only/: rows with bid or ask only\n- collector/: code that collected the ticks\n"
             "- MANIFEST.json: sha256 per file for verification\n")
print("DONE", flush=True)
