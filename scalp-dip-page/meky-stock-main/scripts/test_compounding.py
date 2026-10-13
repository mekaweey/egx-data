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

equity = 100000.0
trades = []

for d_idx, d in enumerate(dates[:-6]):
    day_df = df[df['date'] == d]
    cands = day_df[day_df['is_gap_up'] & (day_df['gap_pct'] >= 0.010) & (day_df['gap_pct'] <= 0.035)].copy()
    if len(cands) == 0: continue
    cands = cands[cands['gap_pct'] >= cands['market_avg_gap']]
    if len(cands) == 0: continue
    cands = cands[cands['close_to_high20'] >= -0.08]
    if len(cands) == 0: continue
    
    cands = cands.sort_values('gap_pct', ascending=True).head(4)
    slot_size = equity * 0.10 # 10% of current equity per slot
    
    day_pnl = 0.0
    for cand in cands.itertuples():
        entry_price = cand.open
        shares = max(1, int(slot_size / entry_price))
        exit_bar = price_map.get((cand.symbol, dates[d_idx + 4]))
        exit_price = exit_bar.close if exit_bar else entry_price
        pnl = (exit_price - entry_price) * shares - (entry_price + exit_price) * shares * 0.0015
        day_pnl += pnl
        trades.append({'date': d, 'pnl': pnl, 'equity': equity, 'win': pnl > 0})
    equity += day_pnl

print("=" * 80)
print("COMPOUNDING RESULTS (Reinvesting Profits - 10% Equity per Slot):")
print("=" * 80)
print(f"Starting Capital:  100,000 EGP")
print(f"Ending Capital:    {equity:,.0f} EGP")
net_gain = equity - 100000.0
print(f"Total Net Profit:  {net_gain:+,.0f} EGP (+{net_gain/1000:.1f}%)")
tdf = pd.DataFrame(trades)
tdf['week'] = tdf['date'].dt.isocalendar().week
weekly_avg = tdf.groupby('week')['pnl'].sum().mean()
print(f"Weekly Average PnL: {weekly_avg:+,.0f} EGP / week")
print(f"Profit Factor:      {tdf[tdf['win']]['pnl'].sum() / abs(tdf[~tdf['win']]['pnl'].sum()):.2f}")
print("=" * 80)
