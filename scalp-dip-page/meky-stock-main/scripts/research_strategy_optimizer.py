import pandas as pd
import numpy as np
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 70)
print("🔍 RESEARCH BACKTEST: Optimizing Gap-Up Strategy Precision on 90 Days TV Data")
print("=" * 70)

# 1. Load Data
csv_path = r"D:\egx_daily_prices_tradingview.csv"
df = pd.read_csv(csv_path)
print(f"Loaded {len(df):,} rows from {csv_path}")

# Filter usable bars per project standard
df = df[(df['open_minute'] <= 610) & (df['close_minute'] >= 855) & (df['n_bars'] >= 20)].copy()
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

symbols = df['symbol'].unique()
dates = np.sort(df['date'].unique())
print(f"Usable clean rows: {len(df):,} | Symbols: {len(symbols)} | Trading dates: {len(dates)}")
print(f"Date range: {pd.to_datetime(dates[0]).strftime('%Y-%m-%d')} to {pd.to_datetime(dates[-1]).strftime('%Y-%m-%d')}")

# Compute previous close, gaps, and prior returns
df['prev_close'] = df.groupby('symbol')['close'].shift(1)
df['prev_open'] = df.groupby('symbol')['open'].shift(1)
df['prev_prev_close'] = df.groupby('symbol')['close'].shift(2)
df['ret_1d_prior'] = (df['prev_close'] - df['prev_prev_close']) / df['prev_prev_close']
df['sma20'] = df.groupby('symbol')['close'].transform(lambda x: x.shift(1).rolling(20, min_periods=5).mean())
df['above_sma20'] = df['prev_close'] > df['sma20']

# Gap calculation
df['gap_pct'] = (df['open'] - df['prev_close']) / df['prev_close']
df['is_gap_up'] = (df['gap_pct'] > 0) & (df['prev_close'] > 0)

# Compute Market Regime: Daily market breadth (% of stocks with positive daily return)
df['daily_ret'] = (df['close'] - df['prev_close']) / df['prev_close']
market_breadth = df.groupby('date')['daily_ret'].apply(lambda x: (x > 0).mean()).rename('market_breadth')
df = df.merge(market_breadth, on='date', how='left')

# Prepare fast lookup dictionary for prices: (symbol, date) -> row
price_dict = {}
for row in df.itertuples():
    price_dict[(row.symbol, row.date)] = row

date_to_idx = {d: i for i, d in enumerate(dates)}

# Backtest Engine
def run_simulation(
    gap_max=None,
    require_above_sma20=False,
    min_market_breadth=0.0,
    prior_day_trend=None, # 'green', 'red', None
    hold_days=4,
    stop_loss_pct=0.10,
    top_n=10,
    slot_capital=4000.0,
    cost_per_side=0.0015
):
    trades = []
    
    for d_idx, d in enumerate(dates[:-hold_days]):
        day_df = df[df['date'] == d]
        
        # Candidate filter: gap-up
        cands = day_df[day_df['is_gap_up']].copy()
        if len(cands) == 0:
            continue
            
        # Optional Filter: Gap Max
        if gap_max is not None:
            cands = cands[cands['gap_pct'] <= gap_max]
            
        # Optional Filter: Above SMA20
        if require_above_sma20:
            cands = cands[cands['above_sma20'] == True]
            
        # Optional Filter: Market Breadth
        if min_market_breadth > 0:
            cands = cands[cands['market_breadth'] >= min_market_breadth]
            
        # Optional Filter: Prior day trend
        if prior_day_trend == 'green':
            cands = cands[cands['ret_1d_prior'] > 0]
        elif prior_day_trend == 'red':
            cands = cands[cands['ret_1d_prior'] < 0]
            
        if len(cands) == 0:
            continue
            
        # Canonical order: ASCENDING gap (smallest positive gap first)
        cands = cands.sort_values('gap_pct', ascending=True).head(top_n)
        
        for cand in cands.itertuples():
            entry_price = cand.open
            shares = max(1, int(slot_capital / entry_price))
            pos_val = shares * entry_price
            
            exit_price = None
            exit_reason = None
            exit_day = None
            
            # Follow trade across holding days
            for h in range(1, hold_days + 1):
                cur_date = dates[d_idx + h]
                cur_bar = price_dict.get((cand.symbol, cur_date))
                
                if cur_bar is not None:
                    # Check stop loss on close
                    ret_at_close = (cur_bar.close - entry_price) / entry_price
                    if ret_at_close <= -stop_loss_pct:
                        exit_price = cur_bar.close
                        exit_reason = 'STOP_LOSS'
                        exit_day = h
                        break
                        
                    if h == hold_days:
                        exit_price = cur_bar.close
                        exit_reason = 'TIME_EXIT'
                        exit_day = h
                        break
                else:
                    # Missing bar: use last known
                    if h == hold_days:
                        exit_price = entry_price
                        exit_reason = 'MISSING_EXIT'
                        exit_day = h
                        break
            
            if exit_price is None:
                exit_price = entry_price
                exit_reason = 'TIME_EXIT'
                exit_day = hold_days
                
            # Compute net PnL
            gross_pnl = (exit_price - entry_price) * shares
            costs = (entry_price + exit_price) * shares * cost_per_side
            net_pnl = gross_pnl - costs
            ret_pct = net_pnl / pos_val
            
            trades.append({
                'symbol': cand.symbol,
                'entry_date': d,
                'entry_price': entry_price,
                'exit_price': exit_price,
                'exit_reason': exit_reason,
                'exit_day': exit_day,
                'shares': shares,
                'pos_val': pos_val,
                'net_pnl': net_pnl,
                'ret_pct': ret_pct,
                'is_win': net_pnl > 0
            })
            
    tdf = pd.DataFrame(trades)
    if len(tdf) == 0:
        return {'trades': 0, 'win_rate': 0, 'total_pnl': 0, 'avg_ret': 0, 'profit_factor': 0}
        
    wins = tdf[tdf['is_win']]
    losses = tdf[~tdf['is_win']]
    
    total_gain = wins['net_pnl'].sum() if len(wins) > 0 else 0
    total_loss = abs(losses['net_pnl'].sum()) if len(losses) > 0 else 1
    profit_factor = total_gain / total_loss if total_loss > 0 else np.nan
    
    # Weekly PnL
    tdf['week'] = tdf['entry_date'].dt.isocalendar().week
    weekly = tdf.groupby('week')['net_pnl'].sum()
    pos_weeks = (weekly > 0).mean()
    
    return {
        'trades': len(tdf),
        'win_rate': (tdf['is_win'].mean()) * 100,
        'total_pnl': tdf['net_pnl'].sum(),
        'avg_ret_pct': tdf['ret_pct'].mean() * 100,
        'profit_factor': profit_factor,
        'pos_weeks_pct': pos_weeks * 100,
        'sl_exits': (tdf['exit_reason'] == 'STOP_LOSS').sum(),
        'df': tdf
    }

# 2. Run Baseline
baseline = run_simulation()
print("\n" + "=" * 70)
print(f"📊 1. BASELINE (Canonical 4-Day Hold, Gap ASC, No Extra Filters):")
print(f"  Total Trades:     {baseline['trades']}")
print(f"  Win Rate:         {baseline['win_rate']:.2f}%")
print(f"  Total Net Profit: {baseline['total_pnl']:+,.0f} EGP")
print(f"  Avg Trade Return: {baseline['avg_ret_pct']:+.2f}%")
print(f"  Profit Factor:    {baseline['profit_factor']:.2f}")
print(f"  Positive Weeks:   {baseline['pos_weeks_pct']:.1f}%")
print(f"  Stop Loss Exits:  {baseline['sl_exits']} ({baseline['sl_exits']/baseline['trades']*100:.1f}%)")

# 3. Test Hypothesis A: Gap Cap (Filtering extreme gaps)
print("\n" + "=" * 70)
print("🧪 2. TESTING GAP SIZE LIMITS (Does filtering oversized gaps help?):")
print(f"{'Filter':<22} | {'Trades':<8} | {'Win Rate':<10} | {'Total PnL (EGP)':<16} | {'Profit Factor':<14}")
print("-" * 70)
print(f"{'Uncapped (Baseline)':<22} | {baseline['trades']:<8} | {baseline['win_rate']:.1f}%     | {baseline['total_pnl']:+,.0f} EGP       | {baseline['profit_factor']:.2f}")

for cap in [0.03, 0.04, 0.05, 0.06]:
    res = run_simulation(gap_max=cap)
    print(f"{f'Gap <= {cap*100:.0f}%':<22} | {res['trades']:<8} | {res['win_rate']:.1f}%     | {res['total_pnl']:+,.0f} EGP       | {res['profit_factor']:.2f}")

# 4. Test Hypothesis B: Trend Alignment (Stock above 20-day SMA)
print("\n" + "=" * 70)
print("🧪 3. TESTING TREND FILTER (Stock Above 20-day SMA):")
res_sma = run_simulation(require_above_sma20=True)
print(f"{'Filter':<22} | {'Trades':<8} | {'Win Rate':<10} | {'Total PnL (EGP)':<16} | {'Profit Factor':<14}")
print("-" * 70)
print(f"{'Any Trend (Baseline)':<22} | {baseline['trades']:<8} | {baseline['win_rate']:.1f}%     | {baseline['total_pnl']:+,.0f} EGP       | {baseline['profit_factor']:.2f}")
print(f"{'Above SMA20 Only':<22} | {res_sma['trades']:<8} | {res_sma['win_rate']:.1f}%     | {res_sma['total_pnl']:+,.0f} EGP       | {res_sma['profit_factor']:.2f}")

# 5. Test Hypothesis C: Market Breadth Filter (Avoid entering on bloodbath days)
print("\n" + "=" * 70)
print("🧪 4. TESTING MARKET REGIME (Market Breadth Filter):")
print(f"{'Filter':<22} | {'Trades':<8} | {'Win Rate':<10} | {'Total PnL (EGP)':<16} | {'Profit Factor':<14}")
print("-" * 70)
for mb in [0.30, 0.40, 0.50]:
    res_mb = run_simulation(min_market_breadth=mb)
    print(f"{f'Breadth >= {mb*100:.0f}%':<22} | {res_mb['trades']:<8} | {res_mb['win_rate']:.1f}%     | {res_mb['total_pnl']:+,.0f} EGP       | {res_mb['profit_factor']:.2f}")

# 6. Test Hypothesis D: Prior Day Trend (Did stock pull back yesterday before gap?)
print("\n" + "=" * 70)
print("🧪 5. TESTING PRIOR DAY DYNAMICS:")
res_red = run_simulation(prior_day_trend='red')
res_green = run_simulation(prior_day_trend='green')
print(f"{'Filter':<22} | {'Trades':<8} | {'Win Rate':<10} | {'Total PnL (EGP)':<16} | {'Profit Factor':<14}")
print("-" * 70)
print(f"{'All Prior Days':<22} | {baseline['trades']:<8} | {baseline['win_rate']:.1f}%     | {baseline['total_pnl']:+,.0f} EGP       | {baseline['profit_factor']:.2f}")
print(f"{'Prior Day Red (Dip)':<22} | {res_red['trades']:<8} | {res_red['win_rate']:.1f}%     | {res_red['total_pnl']:+,.0f} EGP       | {res_red['profit_factor']:.2f}")
print(f"{'Prior Day Green (Mom)':<22} | {res_green['trades']:<8} | {res_green['win_rate']:.1f}%     | {res_green['total_pnl']:+,.0f} EGP       | {res_green['profit_factor']:.2f}")

# 7. Test Hypothesis E: Holding Duration (2, 3, 4, 5 days)
print("\n" + "=" * 70)
print("🧪 6. TESTING HOLDING PERIOD DURATION:")
print(f"{'Hold Period':<22} | {'Trades':<8} | {'Win Rate':<10} | {'Total PnL (EGP)':<16} | {'Profit Factor':<14}")
print("-" * 70)
for hp in [2, 3, 4, 5]:
    res_hp = run_simulation(hold_days=hp)
    print(f"{f'{hp} Trading Days':<22} | {res_hp['trades']:<8} | {res_hp['win_rate']:.1f}%     | {res_hp['total_pnl']:+,.0f} EGP       | {res_hp['profit_factor']:.2f}")

# 8. Combined Optimized Strategy
print("\n" + "=" * 70)
print("🏆 7. OPTIMIZED COMBINED TEST:")
# Combine best discoveries: e.g. Above SMA20 + Market Breadth >= 35% + Gap <= 5%
opt = run_simulation(gap_max=0.05, require_above_sma20=True, min_market_breadth=0.35, hold_days=4)
print(f"{'Model':<22} | {'Trades':<8} | {'Win Rate':<10} | {'Total PnL (EGP)':<16} | {'Profit Factor':<14}")
print("-" * 70)
print(f"{'Baseline':<22} | {baseline['trades']:<8} | {baseline['win_rate']:.1f}%     | {baseline['total_pnl']:+,.0f} EGP       | {baseline['profit_factor']:.2f}")
print(f"{'Optimized Model':<22} | {opt['trades']:<8} | {opt['win_rate']:.1f}%     | {opt['total_pnl']:+,.0f} EGP       | {opt['profit_factor']:.2f}")
print("=" * 70)
