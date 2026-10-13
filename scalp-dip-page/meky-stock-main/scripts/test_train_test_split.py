import pandas as pd
import numpy as np
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Load data
csv_path = r'D:\egx_daily_prices_tradingview.csv'
df = pd.read_csv(csv_path)
df = df[(df['open_minute'] <= 610) & (df['close_minute'] >= 855) & (df['n_bars'] >= 20)].copy()
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

symbols = df['symbol'].unique()
dates = np.sort(df['date'].unique())
n_dates = len(dates)

# Strict Split: Train = First 45 days | Test = Last 45 days
train_dates = dates[:n_dates // 2]
test_dates = dates[n_dates // 2:]

print("=" * 85)
print(f"TRAIN PERIOD (In-Sample) : {pd.to_datetime(train_dates[0]).strftime('%Y-%m-%d')} to {pd.to_datetime(train_dates[-1]).strftime('%Y-%m-%d')} ({len(train_dates)} days)")
print(f"TEST PERIOD  (Out-of-Sample): {pd.to_datetime(test_dates[0]).strftime('%Y-%m-%d')} to {pd.to_datetime(test_dates[-1]).strftime('%Y-%m-%d')} ({len(test_dates)} days)")
print("=" * 85)

# Indicators
df['prev_close'] = df.groupby('symbol')['close'].shift(1)
df['prev_high'] = df.groupby('symbol')['high'].shift(1)
df['prev_low'] = df.groupby('symbol')['low'].shift(1)

df['gap_pct'] = (df['open'] - df['prev_close']) / df['prev_close']
df['is_gap_up'] = (df['gap_pct'] > 0) & (df['prev_close'] > 0)

df['high20'] = df.groupby('symbol')['high'].transform(lambda x: x.shift(1).rolling(20, min_periods=5).max())
df['close_to_high20'] = (df['prev_close'] - df['high20']) / df['high20']

prev_tr1 = df['prev_high'] - df['prev_low']
prev_tr2 = (df['prev_high'] - df.groupby('symbol')['close'].shift(2)).abs()
prev_tr3 = (df['prev_low'] - df.groupby('symbol')['close'].shift(2)).abs()
prev_tr = pd.concat([prev_tr1, prev_tr2, prev_tr3], axis=1).max(axis=1)
df['atr14'] = df.groupby('symbol').apply(lambda g: prev_tr.loc[g.index].rolling(14, min_periods=5).mean()).reset_index(level=0, drop=True)
df['atr_pct'] = df['atr14'] / df['prev_close']
df['gap_atr_ratio'] = df['gap_pct'] / df['atr_pct']

market_avg_gap = df[df['is_gap_up']].groupby('date')['gap_pct'].mean().rename('market_avg_gap')
df = df.merge(market_avg_gap, on='date', how='left')

price_map = {(r.symbol, r.date): r for r in df.itertuples()}

def evaluate_on_period(dates_subset, is_complex=False):
    trades = []
    slot = 10000.0
    cost = 0.0015
    hold_days = 5 if is_complex else 4
    
    for d_idx, d in enumerate(dates_subset[:-hold_days-1]):
        day_df = df[df['date'] == d]
        
        if not is_complex:
            # SIMPLE ROBUST BASELINE: Any positive gap up, ascending rank
            cands = day_df[day_df['is_gap_up']].copy()
            cands = cands.sort_values('gap_pct', ascending=True).head(3)
        else:
            # OVER-OPTIMIZED COMPLEX MODEL (4 stacked filters)
            cands = day_df[day_df['is_gap_up'] & (day_df['gap_pct'] >= 0.010) & (day_df['gap_pct'] <= 0.035)].copy()
            if len(cands) > 0: cands = cands[cands['gap_pct'] >= cands['market_avg_gap']]
            if len(cands) > 0: cands = cands[cands['close_to_high20'] >= -0.07]
            if len(cands) > 0: cands = cands[cands['gap_atr_ratio'] >= 0.35]
            cands = cands.sort_values('gap_pct', ascending=True).head(3)
            
        for cand in cands.itertuples():
            entry_p = cand.open
            shares = max(1, int(slot / entry_p))
            # look for exit
            exit_bar = price_map.get((cand.symbol, dates[np.where(dates == d)[0][0] + hold_days]))
            exit_p = exit_bar.close if exit_bar else entry_p
            pnl = (exit_p - entry_p) * shares - (entry_p + exit_p) * shares * cost
            trades.append({'date': d, 'pnl': pnl, 'win': pnl > 0})
            
    tdf = pd.DataFrame(trades)
    if len(tdf) == 0:
        return 0, 0, 0, 0
    tdf['week'] = tdf['date'].dt.isocalendar().week
    wk_avg = tdf.groupby('week')['pnl'].sum().mean()
    tot = tdf['pnl'].sum()
    win_r = tdf['win'].mean() * 100
    pos = tdf[tdf['win']]['pnl'].sum()
    neg = abs(tdf[~tdf['win']]['pnl'].sum())
    pf = pos / neg if neg > 0 else 99
    return len(tdf), win_r, tot, wk_avg, pf

print(f"{'Model':<25} | {'Period':<12} | {'Trades':<6} | {'Win %':<6} | {'Total PnL':<10} | {'Wk Avg':<8} | {'PF':<5}")
print("-" * 85)

n, w, tot, wk, pf = evaluate_on_period(train_dates, is_complex=False)
print(f"{'Simple Baseline':<25} | {'TRAIN (45d)':<12} | {n:<6} | {w:>5.1f}% | {tot:>+9,.0f} | {wk:>+7,.0f} | {pf:>4.2f}")

n, w, tot, wk, pf = evaluate_on_period(test_dates, is_complex=False)
print(f"{'Simple Baseline':<25} | {'TEST (45d)':<12} | {n:<6} | {w:>5.1f}% | {tot:>+9,.0f} | {wk:>+7,.0f} | {pf:>4.2f}")
print("-" * 85)

n, w, tot, wk, pf = evaluate_on_period(train_dates, is_complex=True)
print(f"{'Over-Optimized Complex':<25} | {'TRAIN (45d)':<12} | {n:<6} | {w:>5.1f}% | {tot:>+9,.0f} | {wk:>+7,.0f} | {pf:>4.2f}")

n, w, tot, wk, pf = evaluate_on_period(test_dates, is_complex=True)
print(f"{'Over-Optimized Complex':<25} | {'TEST (45d)':<12} | {n:<6} | {w:>5.1f}% | {tot:>+9,.0f} | {wk:>+7,.0f} | {pf:>4.2f}")
print("=" * 85)
