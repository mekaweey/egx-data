# -*- coding: utf-8 -*-
"""Shared loader for smart sweeps."""
import pandas as pd, os
def load_all():
    BT = r"D:\EGX_DATA\_backtest"
    panel = pd.read_csv(os.path.join(BT, "panel.csv"))
    hal = panel[panel["halal"] == 1].copy()
    sym_data = {}
    for sym, g in hal.groupby("ticker"):
        df = g.sort_values("date").set_index("date")[["open", "high", "low", "close", "volume", "money", "flag"]]
        sym_data[sym] = df
    cal = sorted(hal["date"].unique())
    return sym_data, cal
