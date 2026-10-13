import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
from test_hard_truth_quant import run_simulation

tdf = run_simulation('Audit_Export', hold_days=5, sl_pct=0.10, close_to_high_max=-0.07, atr_filter=lambda c: c[c['gap_atr_ratio'] >= 0.35])

# Export all trades to CSV
csv_path = r'd:\meky-stock-main\meky-stock-main\ultimate_strategy_trade_log.csv'
tdf.to_csv(csv_path, index=False)
print(f"\n✅ Exported {len(tdf)} trades to {csv_path}")

print("\n" + "=" * 75)
print("🔍 SAMPLE WINNING TRADES (Can be checked on TradingView right now):")
print("=" * 75)
sample_wins = tdf[tdf['is_win']].head(5)
for r in sample_wins.itertuples():
    d_str = r.date.strftime("%Y-%m-%d")
    print(f"Date: {d_str} | Symbol: {r.symbol:<6} | Return: {r.ret_pct*100:>+5.1f}% | Net Profit: {r.net_pnl:>+6,.0f} EGP")

print("\n" + "=" * 75)
print("🔍 SAMPLE LOSING TRADES (Honest check of losing days):")
print("=" * 75)
sample_losses = tdf[~tdf['is_win']].head(5)
for r in sample_losses.itertuples():
    d_str = r.date.strftime("%Y-%m-%d")
    print(f"Date: {d_str} | Symbol: {r.symbol:<6} | Loss  : {r.ret_pct*100:>+5.1f}% | Net Loss  : {r.net_pnl:>+6,.0f} EGP")
print("=" * 75)
