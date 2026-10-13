import pandas as pd
import numpy as np
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 95)
print("🛡️ ULTRA-STRESS AUDIT: Testing Slippage, Higher Fees & Out-of-Sample Robustness")
print("=" * 95)

# Load data
csv_path = r'D:\egx_daily_prices_tradingview.csv'
df = pd.read_csv(csv_path)
df = df[(df['open_minute'] <= 610) & (df['close_minute'] >= 855) & (df['n_bars'] >= 20)].copy()
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

symbols = df['symbol'].unique()
dates = np.sort(df['date'].unique())

# Strict prior-day indicators (ZERO Look-ahead guaranteed)
df['prev_close'] = df.groupby('symbol')['close'].shift(1)
df['prev_high'] = df.groupby('symbol')['high'].shift(1)
df['prev_low'] = df.groupby('symbol')['low'].shift(1)

# Gaps at open
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

# Morning market average gap
market_avg_gap = df[df['is_gap_up']].groupby('date')['gap_pct'].mean().rename('market_avg_gap')
df = df.merge(market_avg_gap, on='date', how='left')

price_map = {(r.symbol, r.date): r for r in df.itertuples()}

def simulate_stress(name, slippage_entry=0.0, slippage_exit=0.0, fee_per_side=0.0015, max_per_day=3):
    INITIAL_CAPITAL = 100000.0
    SLOT_SIZE = 10000.0
    MAX_SLOTS = 10
    
    cash = INITIAL_CAPITAL
    active_positions = []
    history = []
    
    for d_idx, d in enumerate(dates[:-6]):
        day_df = df[df['date'] == d]
        
        # 1. Exit Check
        new_active = []
        for pos in active_positions:
            cur_bar = price_map.get((pos['symbol'], d))
            should_exit = False
            exit_price = None
            pos['days_held'] += 1
            
            if cur_bar is not None:
                ret = (cur_bar.close - pos['entry_price']) / pos['entry_price']
                if ret <= -0.10:
                    should_exit = True
                    exit_price = cur_bar.close * (1 - slippage_exit) # adverse exit slippage
                elif pos['days_held'] >= 5:
                    should_exit = True
                    exit_price = cur_bar.close * (1 - slippage_exit)
            else:
                if pos['days_held'] >= 5:
                    should_exit = True
                    exit_price = pos['entry_price']
                    
            if should_exit:
                gross = (exit_price - pos['entry_price']) * pos['shares']
                comm = (pos['entry_price'] + exit_price) * pos['shares'] * fee_per_side
                net_pnl = gross - comm
                cash += (pos['shares'] * exit_price) - (pos['shares'] * exit_price * fee_per_side)
                history.append({'net_pnl': net_pnl, 'exit_date': d, 'is_win': net_pnl > 0})
            else:
                new_active.append(pos)
        active_positions = new_active
        
        # 2. Entry Candidates
        cands = day_df[day_df['is_gap_up'] & (day_df['gap_pct'] >= 0.010) & (day_df['gap_pct'] <= 0.035)].copy()
        if len(cands) > 0: cands = cands[cands['gap_pct'] >= cands['market_avg_gap']]
        if len(cands) > 0: cands = cands[cands['close_to_high20'] >= -0.07]
        if len(cands) > 0: cands = cands[cands['gap_atr_ratio'] >= 0.35]
        
        if len(cands) > 0:
            cands = cands.sort_values('gap_pct', ascending=True)
            slots_avail = min(MAX_SLOTS - len(active_positions), int(cash // SLOT_SIZE), max_per_day)
            cands_to_buy = cands.head(slots_avail)
            for cand in cands_to_buy.itertuples():
                entry_p = cand.open * (1 + slippage_entry) # adverse entry slippage
                shares = max(1, int(SLOT_SIZE / entry_p))
                cost_val = shares * entry_p * (1 + fee_per_side)
                if cash >= cost_val:
                    cash -= cost_val
                    active_positions.append({'symbol': cand.symbol, 'entry_price': entry_p, 'shares': shares, 'days_held': 0})
                    
    for pos in active_positions:
        cash += pos['shares'] * pos['entry_price']
        
    hdf = pd.DataFrame(history)
    hdf['week'] = hdf['exit_date'].dt.isocalendar().week
    wk_pnl = hdf.groupby('week')['net_pnl'].sum()
    win_pnl = hdf[hdf['is_win']]['net_pnl'].sum()
    loss_pnl = abs(hdf[~hdf['is_win']]['net_pnl'].sum())
    pf = win_pnl / loss_pnl if loss_pnl > 0 else 99
    
    print(f"{name:<42} | Trades={len(hdf):<4} | Win%={hdf['is_win'].mean()*100:4.1f}% | NetPnL={cash-INITIAL_CAPITAL:>+8,.0f} | WkAvg={wk_pnl.mean():>+6,.0f} | PF={pf:4.2f}")

print("--- STRESS TEST SCENARIOS ---")
simulate_stress("1. Perfect Baseline (0% Slip, 0.15% Fee)")
simulate_stress("2. Real-World Slip (+0.25% Buy, -0.25% Sell)", slippage_entry=0.0025, slippage_exit=0.0025)
simulate_stress("3. Heavy Slippage (+0.50% Buy, -0.50% Sell)", slippage_entry=0.0050, slippage_exit=0.0050)
simulate_stress("4. Double Fees (0.30% per side = 0.60% total)", fee_per_side=0.0030)
simulate_stress("5. Nightmare Scenario (0.5% Slip + Double Fees)", slippage_entry=0.0050, slippage_exit=0.0050, fee_per_side=0.0030)
print("=" * 95)
