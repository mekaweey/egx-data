# -*- coding: utf-8 -*-
"""Source-vs-repo completeness audit: every source file must exist in repo (or be on the exclusion list)."""
import hashlib, os

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for ch in iter(lambda: fh.read(8 * 1024 * 1024), b""):
            h.update(ch)
    return h.hexdigest()

# (source dir, repo subdir or None to skip-with-reason)
MAP = [
    (r"D:\EGX_DATA\01_daily", "data/01_daily"),
    (r"D:\EGX_DATA\02_daily_divadj", "data/02_daily_divadj"),
    (r"D:\EGX_DATA\03_weekly", "data/03_weekly"),
    (r"D:\EGX_DATA\04_monthly", "data/04_monthly"),
    (r"D:\EGX_DATA\05_intraday", "data/05_intraday"),
    (r"D:\EGX_DATA\07_fundamentals", "data/07_fundamentals"),
    (r"D:\EGX_DATA\08_metadata", "data/08_metadata"),
    (r"D:\EGX_DATA\09_indices", "data/09_indices"),
    (r"D:\EGX_DATA\10_news", "data/10_news"),
    (r"D:\EGX_DATA\11_reference", "data/11_reference"),
    (r"D:\EGX_DATA\12_bonds", "data/12_bonds"),
    (r"D:\EGX_DATA\_backtest", "data/_backtest"),
    (r"D:\EGX_DATA\_fx", "data/_fx"),
    (r"D:\EGX_DATA\_logs", "data/_logs"),
    (r"D:\BIDASK_FINAL", "data/BIDASK_FINAL"),
    (r"D:\EGX_AI_PACK_SRC", "docs/pack_docs"),
    (r"D:\EGX_REVIEW_PACK", "docs/review_pack"),
]
REPO = r"D:\EGX_GH\egx-data"
CODE_SRC = r"C:\Users\Mekawey\AppData\Local\Temp\opencode"
REPO = r"D:\EGX_GH\egx-data"
# intentional exclusions (documented)
SKIP_NAMES = {"supervise_run.ps1", "secrets_scan.py", "stage_push.py"}
SKIP_DIRS = {"__pycache__"}

missing, mismatch, ok = [], [], 0
for src, sub in MAP:
    if sub is None:
        continue
    for dp, dns, fns in os.walk(src):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            if fn in SKIP_NAMES or fn.endswith((".tmp", ".out", ".zip")):
                continue
            sp = os.path.join(dp, fn)
            rel = os.path.relpath(sp, src)
            rp = os.path.join(REPO, sub, rel)
            if not os.path.exists(rp):
                missing.append(os.path.join(sub, rel))
            elif sha(sp) != sha(rp):
                mismatch.append(os.path.join(sub, rel))
            else:
                ok += 1
print("identical:", ok, "missing:", len(missing), "mismatch:", len(mismatch), flush=True)
# Temp code -> repo code/*.py
ncode = 0
for fn in sorted(os.listdir(CODE_SRC)):
    if not fn.endswith(".py") or fn in SKIP_NAMES:
        continue
    sp = os.path.join(CODE_SRC, fn)
    rp = os.path.join(REPO, "code", fn)
    ncode += 1
    if not os.path.exists(rp):
        missing.append("code/" + fn)
    elif sha(sp) != sha(rp):
        mismatch.append("code/" + fn)
    else:
        ok += 1
print("code files checked:", ncode, flush=True)
print("TOTAL identical:", ok, "missing:", len(missing), "mismatch:", len(mismatch), flush=True)
for m in missing[:30]:
    print("MISS:", m, flush=True)
for m in mismatch[:10]:
    print("DIFF:", m, flush=True)
# known intentional gaps
print("--- intentional gaps (documented, not errors): data/06_indicators (985MB, rebuildable), Temp scripts with secrets ---", flush=True)
