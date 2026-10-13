import pandas as pd
import numpy as np
import sys
sys.stdout.reconfigure(encoding='utf-8')

csv_path = r'D:\egx_daily_prices_tradingview.csv'
df = pd.read_csv(csv_path)
df = df[(df['open_minute'] <= 610) & (df['close_minute'] >= 855) & (df['n_bars'] >= 20)].copy()
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

symbols = df['symbol'].unique()
dates = np.sort(df['date'].unique())

df['prev_close'] = df.groupby('symbol')['close'].shift(1)
df['gap_pct'] = (df['open'] - df['prev_close']) / df['prev_close']
df['is_gap_up'] = (df['gap_pct'] > 0) & (df['prev_close'] > 0)
df['high20'] = df.groupby('symbol')['high'].transform(lambda x: x.shift(1).rolling(20, min_periods=5).max())
df['close_to_high20'] = (df['prev_close'] - df['high20']) / df['high20']

market_avg_gap = df[df['is_gap_up']].groupby('date')['gap_pct'].mean().rename('market_avg_gap')
df = df.merge(market_avg_gap, on='date', how='left')

price_map = {(r.symbol, r.date): r for r in df.itertuples()}

print("=" * 95)
print(f"{'Configuration':<35} | {'Trades':<6} | {'Win %':<6} | {'Total PnL':<12} | {'Weekly PnL':<11} | {'PF':<5}")
print("=" * 95)

configs = [
    ("25 Slots x 4,000 EGP (High Diversification)", 4000, 10),
    ("12 Slots x 8,000 EGP (Balanced)", 8000, 5),
    ("10 Slots x 10,000 EGP (Active Trader Model)", 10000, 4),
    ("8 Slots x 12,500 EGP (Concentrated Momentum)", 12500, 3),
]

for name, slot_size, top_n in configs:
    trades = []
    for d_idx, d in enumerate(dates[:-6]):
        day_df = df[df['date'] == d]
        cands = day_df[day_df['is_gap_up'] & (day_df['gap_pct'] >= 0.010) & (day_df['gap_pct'] <= 0.035)].copy()
        if len(cands) == 0: continue
        cands = cands[cands['gap_pct'] >= cands['market_avg_gap']]
        if len(cands) == 0: continue
        # Near 20d high
        cands = cands[cands['close_to_high20'] >= -0.08]
        if len(cands) == 0: continue
        
        cands = cands.sort_values('gap_pct', ascending=True).head(top_n)
        for cand in cands.itertuples():
            entry_price = cand.open
            shares = max(1, int(slot_size / entry_price))
            exit_bar = price_map.get((cand.symbol, dates[d_idx + 4]))
            exit_price = exit_bar.close if exit_bar else entry_price
            pnl = (exit_price - entry_price) * shares - (entry_price + exit_price) * shares * 0.0015
            trades.append({'date': d, 'pnl': pnl, 'win': pnl > 0})
    tdf = pd.DataFrame(trades)
    tdf['week'] = tdf['date'].dt.isocalendar().week
    wk_pnl = tdf.groupby('week')['pnl'].sum().mean()
    tot_pnl = tdf['pnl'].sum()
    pos = tdf[tdf['win']]['pnl'].sum()
    neg = abs(tdf[~tdf['win']]['pnl'].sum())
    pf = pos / neg if neg > 0 else 99
    print(f"{name:<35} | {len(tdf):<6} | {tdf['win'].mean()*100:>5.1f}% | {tot_pnl:>+10,.0f} | {wk_pnl:>+9,.0f} | {pf:>4.2f}")
print("=" * 95)
