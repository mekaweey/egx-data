# -*- coding: utf-8 -*-
"""Quick validation of the 2026-11-03 delivery before docs/upload."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import pandas as pd

D = Path(__file__).resolve().parents[1] / "strategy-lab" / "outputs" / "egx_2026_11_03"
DATA = D / "data"

print("--- universe summary ---")
print((DATA / "universe" / "universe_summary.json").read_text(encoding="utf-8"))
u = pd.read_csv(DATA / "universe" / "universe_all.csv", low_memory=False)
print("universe", u.shape)
print({c: int(u[c].sum()) for c in ["in_clean_union_248", "in_official_C", "in_halal_97", "in_top100_liquidity", "in_daily_323"]})
print("with 1m/5m/60m/bidask", u["1m_rows"].notna().sum(), u["5m_rows"].notna().sum(), u["60m_rows"].notna().sum(), u["bidask_rows"].notna().sum())
print("missing 1m in clean", sorted(set(u.loc[u.in_clean_union_248 == 1, "symbol"]) - set(u.loc[u["1m_rows"].notna(), "symbol"])))
print("missing 1m top100", sorted(set(u.loc[u.in_top100_liquidity == 1, "symbol"]) - set(u.loc[u["1m_rows"].notna(), "symbol"])))
print("missing 1m halal", sorted(set(u.loc[u.in_halal_97 == 1, "symbol"]) - set(u.loc[u["1m_rows"].notna(), "symbol"])))

print("--- macro sources ---")
print(pd.read_csv(DATA / "macro" / "macro_sources.csv").to_string(index=False))
print("--- indices sources ---")
print(pd.read_csv(DATA / "indices" / "indices_sources.csv").to_string(index=False))
print("--- daily quality ---")
print((DATA / "prices" / "daily_quality_summary.json").read_text(encoding="utf-8"))
print("--- live summary ---")
print((DATA / "live" / "live_snapshot_summary.json").read_text(encoding="utf-8"))
print("--- investor summary ---")
print((DATA / "official" / "investor_cumulative_summary.json").read_text(encoding="utf-8"))
print((DATA / "official" / "investor_daily_latest_available_summary.json").read_text(encoding="utf-8"))
print("--- sqlite ---")
con = sqlite3.connect(D / "db" / "egx_2026_11_03.sqlite")
for (n,) in con.execute("select name from sqlite_master where type='table' order by name"):
    print(n, con.execute(f'select count(*) from "{n}"').fetchone()[0])
con.close()
print("--- size ---")
print(sum(p.stat().st_size for p in D.rglob("*") if p.is_file()) / 1024 / 1024)
