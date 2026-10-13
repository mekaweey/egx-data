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

# Technical features
df['prev_close'] = df.groupby('symbol')['close'].shift(1)
df['prev_open'] = df.groupby('symbol')['open'].shift(1)
df['prev_high'] = df.groupby('symbol')['high'].shift(1)
df['prev_low'] = df.groupby('symbol')['low'].shift(1)

# Gaps
df['gap_pct'] = (df['open'] - df['prev_close']) / df['prev_close']
df['is_gap_up'] = (df['gap_pct'] > 0) & (df['prev_close'] > 0)

# 20-day High & SMA20
df['high20'] = df.groupby('symbol')['high'].transform(lambda x: x.shift(1).rolling(20, min_periods=5).max())
df['close_to_high20'] = (df['prev_close'] - df['high20']) / df['high20'] # near 0 means near 20d high
df['sma20'] = df.groupby('symbol')['close'].transform(lambda x: x.shift(1).rolling(20, min_periods=5).mean())
df['above_sma20'] = df['prev_close'] > df['sma20']

# Range compression (Prior 5-day range / SMA20)
df['range5'] = df.groupby('symbol')['high'].transform(lambda x: x.shift(1).rolling(5).max()) - df.groupby('symbol')['low'].transform(lambda x: x.shift(1).rolling(5).min())
df['norm_range5'] = df['range5'] / df['sma20']

# Pre-gap candle shape: Prev day green & closed in top 25% of its daily range
prev_range = df['prev_high'] - df['prev_low']
df['prev_close_pos'] = np.where(prev_range > 0, (df['prev_close'] - df['prev_low']) / prev_range, 0.5)
df['prev_strong_close'] = df['prev_close_pos'] >= 0.70

# Market wide metrics
market_avg_gap = df[df['is_gap_up']].groupby('date')['gap_pct'].mean().rename('market_avg_gap')
market_pct_above_sma = df.groupby('date')['above_sma20'].mean().rename('market_breadth_sma')
df = df.merge(market_avg_gap, on='date', how='left')
df = df.merge(market_pct_above_sma, on='date', how='left')

price_map = {(r.symbol, r.date): r for r in df.itertuples()}
p1_end = dates[n_dates // 3]
p2_end = dates[(2 * n_dates) // 3]

def run_test(name, filter_fn=None, rank_fn=None, exit_mode='fixed_4d', max_trades_day=10):
    trades = []
    slot = 4000.0
    cost = 0.0015
    
    for d_idx, d in enumerate(dates[:-6]):
        day_df = df[df['date'] == d]
        # Base winning foundation: Sweet spot 1-3.5% + Rel Strength
        cands = day_df[day_df['is_gap_up'] & (day_df['gap_pct'] >= 0.010) & (day_df['gap_pct'] <= 0.035)].copy()
        if len(cands) == 0:
            continue
        cands = cands[cands['gap_pct'] >= cands['market_avg_gap']]
        if len(cands) == 0:
            continue
            
        if filter_fn is not None:
            cands = filter_fn(cands, d)
            if len(cands) == 0:
                continue
                
        if rank_fn is not None:
            cands = rank_fn(cands)
        else:
            cands = cands.sort_values('gap_pct', ascending=True)
            
        cands = cands.head(max_trades_day)
        
        for cand in cands.itertuples():
            entry_price = cand.open
            shares = max(1, int(slot / entry_price))
            exit_price = None
            
            sl = 0.10
            for h in range(1, 6):
                cur_bar = price_map.get((cand.symbol, dates[d_idx + h]))
                if cur_bar is not None:
                    ret = (cur_bar.close - entry_price) / entry_price
                    # Stop loss
                    if ret <= -sl:
                        exit_price = cur_bar.close
                        break
                    # Exit logic
                    if exit_mode == 'trailing_prev_low' and h >= 2:
                        prev_bar = price_map.get((cand.symbol, dates[d_idx + h - 1]))
                        if prev_bar and cur_bar.close < prev_bar.low:
                            exit_price = cur_bar.close
                            break
                        if h == 4:
                            exit_price = cur_bar.close
                            break
                    elif exit_mode == 'target_12pct' and ret >= 0.12:
                        exit_price = cur_bar.close
                        break
                    elif h == 4:
                        exit_price = cur_bar.close
                        break
                else:
                    if h == 4:
                        exit_price = entry_price
                        break
            if exit_price is None:
                exit_price = entry_price
            net_pnl = (exit_price - entry_price) * shares - (entry_price + exit_price) * shares * cost
            trades.append({'date': d, 'pnl': net_pnl, 'is_win': net_pnl > 0})
            
    tdf = pd.DataFrame(trades)
    if len(tdf) == 0:
        return
    tdf['week'] = tdf['date'].dt.isocalendar().week
    weekly = tdf.groupby('week')['pnl'].sum().mean()
    p1 = tdf[tdf['date'] <= p1_end]['pnl'].sum()
    p2 = tdf[(tdf['date'] > p1_end) & (tdf['date'] <= p2_end)]['pnl'].sum()
    p3 = tdf[tdf['date'] > p2_end]['pnl'].sum()
    tot = tdf['pnl'].sum()
    win_r = tdf['is_win'].mean() * 100
    pos_wins = tdf[tdf['is_win']]['pnl'].sum()
    neg_loss = abs(tdf[~tdf['is_win']]['pnl'].sum())
    pf = pos_wins / neg_loss if neg_loss > 0 else 99.0
    print(f'{name:<42} | N={len(tdf):<4} | Win={win_r:4.1f}% | Tot={tot:>+8,.0f} | Wk={weekly:>+6,.0f} | PF={pf:4.2f} | P1={p1:>+7,.0f} | P2={p2:>+7,.0f} | P3={p3:>+7,.0f}')

print('=' * 125)
print(f"{'Strategy / Advanced Exploration':<42} | {'Trades':<6} | {'Win %':<6} | {'Total PnL':<10} | {'Wk PnL':<8} | {'PF':<5} | {'P1':<8} | {'P2':<8} | {'P3':<8}")
print('=' * 125)

# Current baseline combo
run_test('0. Current Top Combo (1-3.5% + RelStr)')

# 1. Breakout Momentum: Within 8% of 20-Day High (Resistance-free)
run_test('1. Breakout Proximity (Near 20d High <=8%)', filter_fn=lambda c, d: c[c['close_to_high20'] >= -0.08])

# 2. Trend Confirmation: Stock above SMA20
run_test('2. Trend Alignment (Stock > SMA20)', filter_fn=lambda c, d: c[c['above_sma20'] == True])

# 3. Volatility Squeeze Base: 5-day tight consolidation prior to gap
run_test('3. Volatility Squeeze (Prior 5d Tight Base)', filter_fn=lambda c, d: c[c['norm_range5'] <= c['norm_range5'].median()])

# 4. Pre-Gap Day Strength: Previous day closed in upper 30% of its candle
run_test('4. Prior Day Strong Close (Top 30% of Range)', filter_fn=lambda c, d: c[c['prev_strong_close'] == True])

# 5. Market Regime Filter: Trade only when Market Breadth >= 45% above SMA20
run_test('5. Market Regime Filter (Breadth >= 45%)', filter_fn=lambda c, d: c if c.iloc[0]['market_breadth_sma'] >= 0.45 else c.iloc[:0])

# 6. Composite Score: Rank by (Gap vs Market) * (Distance to 20d High)
def f_composite_rank(cands):
    # Proximity score: closer to 0 is better (e.g. -0.01 is closer to high than -0.20)
    # Higher composite = better
    score = (cands['gap_pct'] - cands['market_avg_gap']) * (1.0 / (abs(cands['close_to_high20']) + 0.05))
    return cands.assign(score=score).sort_values('score', ascending=False)
run_test('6. Composite Momentum Scoring Rank', rank_fn=f_composite_rank)

# 7. Elite Quality: Top 5 Highest Quality Candidates per day instead of 10
run_test('7. Concentrated Elite (Top 5 Slots/day)', max_trades_day=5)

# 8. Dynamic Exit: Trailing below Previous Day Low
run_test('8. Dynamic Exit (Close < Prev Day Low)', exit_mode='trailing_prev_low')

# 9. Dynamic Profit Target (+12% Auto Lock)
run_test('9. Profit Target (+12% Auto Lock)', exit_mode='target_12pct')

print('=' * 125)
