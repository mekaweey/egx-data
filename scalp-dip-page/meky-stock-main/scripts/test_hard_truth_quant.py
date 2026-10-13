import pandas as pd
import numpy as np
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 90)
print("🔬 RIGOROUS QUANT AUDIT: Testing Hard Truth Hypotheses (Zero Illusions)")
print("=" * 90)

# Load data
csv_path = r'D:\egx_daily_prices_tradingview.csv'
df = pd.read_csv(csv_path)
df = df[(df['open_minute'] <= 610) & (df['close_minute'] >= 855) & (df['n_bars'] >= 20)].copy()
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

symbols = df['symbol'].unique()
dates = np.sort(df['date'].unique())
n_dates = len(dates)

# Technical Indicators
df['prev_close'] = df.groupby('symbol')['close'].shift(1)
df['prev_open'] = df.groupby('symbol')['open'].shift(1)
df['prev_high'] = df.groupby('symbol')['high'].shift(1)
df['prev_low'] = df.groupby('symbol')['low'].shift(1)

# Gaps
df['gap_pct'] = (df['open'] - df['prev_close']) / df['prev_close']
df['is_gap_up'] = (df['gap_pct'] > 0) & (df['prev_close'] > 0)

# 20-day High & Close proximity
df['high20'] = df.groupby('symbol')['high'].transform(lambda x: x.shift(1).rolling(20, min_periods=5).max())
df['close_to_high20'] = (df['prev_close'] - df['high20']) / df['high20']

# ATR 14
prev_tr1 = df['prev_high'] - df['prev_low']
prev_tr2 = (df['prev_high'] - df.groupby('symbol')['close'].shift(2)).abs()
prev_tr3 = (df['prev_low'] - df.groupby('symbol')['close'].shift(2)).abs()
prev_tr = pd.concat([prev_tr1, prev_tr2, prev_tr3], axis=1).max(axis=1)
df['atr14'] = df.groupby('symbol').apply(lambda g: prev_tr.loc[g.index].rolling(14, min_periods=5).mean()).reset_index(level=0, drop=True)
df['atr_pct'] = df['atr14'] / df['prev_close']
df['gap_atr_ratio'] = df['gap_pct'] / df['atr_pct']

# Turnover proxy: close * Volume (if volume available) or n_bars
df['activity_score'] = df['n_bars'] # high bar count = high liquidity

# Morning market average gap
market_avg_gap = df[df['is_gap_up']].groupby('date')['gap_pct'].mean().rename('market_avg_gap')
df = df.merge(market_avg_gap, on='date', how='left')

price_map = {(r.symbol, r.date): r for r in df.itertuples()}

p1_end = dates[n_dates // 3]
p2_end = dates[(2 * n_dates) // 3]

def run_simulation(
    name,
    hold_days=4,
    sl_pct=0.10,
    min_activity=20,
    atr_filter=None,
    close_to_high_max=-0.08,
    slot_size=10000.0,
    top_n=4
):
    trades = []
    cost = 0.0015
    
    for d_idx, d in enumerate(dates[:-max(hold_days + 2, 7)]):
        day_df = df[df['date'] == d]
        
        # Base rules: Gap in sweet spot [1.0% - 3.5%] + Above market gap
        cands = day_df[day_df['is_gap_up'] & (day_df['gap_pct'] >= 0.010) & (day_df['gap_pct'] <= 0.035)].copy()
        if len(cands) == 0: continue
        
        cands = cands[cands['gap_pct'] >= cands['market_avg_gap']]
        if len(cands) == 0: continue
        
        # Proximity to 20d High
        if close_to_high_max is not None:
            cands = cands[cands['close_to_high20'] >= close_to_high_max]
            if len(cands) == 0: continue
            
        # Liquidity / Activity filter
        if min_activity > 20:
            cands = cands[cands['n_bars'] >= min_activity]
            if len(cands) == 0: continue
            
        # ATR filter (e.g. Gap / ATR ratio)
        if atr_filter is not None:
            cands = atr_filter(cands)
            if len(cands) == 0: continue
            
        # Rank by ascending gap
        cands = cands.sort_values('gap_pct', ascending=True).head(top_n)
        
        for cand in cands.itertuples():
            entry_price = cand.open
            shares = max(1, int(slot_size / entry_price))
            exit_price = None
            
            for h in range(1, hold_days + 1):
                cur_bar = price_map.get((cand.symbol, dates[d_idx + h]))
                if cur_bar is not None:
                    ret = (cur_bar.close - entry_price) / entry_price
                    # Stop loss at daily close
                    if ret <= -sl_pct:
                        exit_price = cur_bar.close
                        break
                    # Time exit
                    if h == hold_days:
                        exit_price = cur_bar.close
                        break
                else:
                    if h == hold_days:
                        exit_price = entry_price
                        break
            if exit_price is None:
                exit_price = entry_price
                
            gross = (exit_price - entry_price) * shares
            c_cost = (entry_price + exit_price) * shares * cost
            net_pnl = gross - c_cost
            ret_pct = net_pnl / (shares * entry_price)
            trades.append({
                'date': d,
                'symbol': cand.symbol,
                'entry_price': entry_price,
                'exit_price': exit_price,
                'net_pnl': net_pnl,
                'ret_pct': ret_pct,
                'is_win': net_pnl > 0
            })
            
    tdf = pd.DataFrame(trades)
    if len(tdf) == 0:
        return None
        
    tdf['week'] = tdf['date'].dt.isocalendar().week
    weekly = tdf.groupby('week')['net_pnl'].sum().mean()
    tot = tdf['net_pnl'].sum()
    win_r = tdf['is_win'].mean() * 100
    wins = tdf[tdf['is_win']]['net_pnl']
    losses = tdf[~tdf['is_win']]['net_pnl']
    avg_win = wins.mean() if len(wins) > 0 else 0
    avg_loss = abs(losses.mean()) if len(losses) > 0 else 1
    win_loss_ratio = avg_win / avg_loss if avg_loss > 0 else 0
    pf = wins.sum() / abs(losses.sum()) if abs(losses.sum()) > 0 else 99
    
    p1 = tdf[tdf['date'] <= p1_end]['net_pnl'].sum()
    p2 = tdf[(tdf['date'] > p1_end) & (tdf['date'] <= p2_end)]['net_pnl'].sum()
    p3 = tdf[tdf['date'] > p2_end]['net_pnl'].sum()
    
    print(f"{name:<35} | {len(tdf):<5} | {win_r:>5.1f}% | {win_loss_ratio:>4.2f}x | {tot:>+9,.0f} | {weekly:>+8,.0f} | {pf:>4.2f} | {p1:>+7,.0f} | {p2:>+7,.0f} | {p3:>+7,.0f}")
    return tdf

print(f"{'Experiment Name':<35} | {'Trades':<5} | {'Win %':<6} | {'W/L R':<5} | {'Total PnL':<9} | {'Wk PnL':<8} | {'PF':<5} | {'P1':<7} | {'P2':<7} | {'P3':<7}")
print("-" * 115)

# 1. Base Benchmark
run_simulation("1. Current Baseline (Hold 4d, SL 10%)", hold_days=4, sl_pct=0.10)

# 2. Testing Holding Period: 2, 3, 4, 5, 6 days
run_simulation("2. Hold 2 Days (Fast Swing)", hold_days=2, sl_pct=0.10)
run_simulation("3. Hold 3 Days", hold_days=3, sl_pct=0.10)
run_simulation("4. Hold 5 Days", hold_days=5, sl_pct=0.10)
run_simulation("5. Hold 6 Days (Longer Ride)", hold_days=6, sl_pct=0.10)

# 3. Testing Stop Loss Calibration: 6%, 8%, 10%, 12%
run_simulation("6. Tight SL -6%", hold_days=4, sl_pct=0.06)
run_simulation("7. Moderate SL -8%", hold_days=4, sl_pct=0.08)
run_simulation("8. Wide SL -12%", hold_days=4, sl_pct=0.12)

# 4. Testing Liquidity Filter (Active institutional stocks only: n_bars >= 45)
run_simulation("9. High Liquidity Only (n_bars >=45)", hold_days=4, sl_pct=0.10, min_activity=45)

# 5. Testing Volatility-Adjusted Gap (Gap / ATR >= 0.5 - Meaningful Gaps)
run_simulation("10. ATR Quality (Gap >= 0.4x ATR)", hold_days=4, sl_pct=0.10, atr_filter=lambda c: c[c['gap_atr_ratio'] >= 0.40])

# 6. Ultra Conservative: Near 20d High <= 5% (True Breakouts)
run_simulation("11. True Breakout (Near High <= 5%)", hold_days=4, sl_pct=0.10, close_to_high_max=-0.05)

print("=" * 115)
