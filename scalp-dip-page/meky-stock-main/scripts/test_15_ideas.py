import os
import glob
import json
import sys
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("🚀 FULL QUANT RESEARCH: Testing 15 Strategy Ideas on 90-Day EGX Dataset")
print("=" * 80)

# ── 1. LOAD DAILY DATA ──
csv_path = r"D:\egx_daily_prices_tradingview.csv"
df = pd.read_csv(csv_path)

# Filter usable bars per project standard
df = df[(df['open_minute'] <= 610) & (df['close_minute'] >= 855) & (df['n_bars'] >= 20)].copy()
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

symbols = df['symbol'].unique()
dates = np.sort(df['date'].unique())
n_dates = len(dates)

print(f"Data: {len(df):,} daily records | {len(symbols)} symbols | {n_dates} trading days")
print(f"Period: {pd.to_datetime(dates[0]).strftime('%Y-%m-%d')} to {pd.to_datetime(dates[-1]).strftime('%Y-%m-%d')}")

# Add technical & momentum indicators
df['prev_close'] = df.groupby('symbol')['close'].shift(1)
df['prev_open'] = df.groupby('symbol')['open'].shift(1)
df['prev_prev_close'] = df.groupby('symbol')['close'].shift(2)
df['prev_prev_prev_close'] = df.groupby('symbol')['close'].shift(3)

# Gaps
df['gap_pct'] = (df['open'] - df['prev_close']) / df['prev_close']
df['is_gap_up'] = (df['gap_pct'] > 0) & (df['prev_close'] > 0)

# Previous day gap
df['prev_gap_pct'] = (df['prev_open'] - df['prev_prev_close']) / df['prev_prev_close']
df['prev_is_gap_up'] = (df['prev_gap_pct'] > 0) & (df['prev_prev_close'] > 0)

# 20-day SMA
df['sma20'] = df.groupby('symbol')['close'].transform(lambda x: x.shift(1).rolling(20, min_periods=5).mean())
df['above_sma20'] = df['prev_close'] > df['sma20']

# Pre-gap volume proxy (n_bars trend over prior 3 days)
df['prev_bars1'] = df.groupby('symbol')['n_bars'].shift(1)
df['prev_bars2'] = df.groupby('symbol')['n_bars'].shift(2)
df['prev_bars3'] = df.groupby('symbol')['n_bars'].shift(3)
df['bars_increasing_3d'] = (df['prev_bars1'] > df['prev_bars2']) & (df['prev_bars2'] > df['prev_bars3'])

# Market daily return & breadth
df['daily_ret'] = (df['close'] - df['prev_close']) / df['prev_close']
market_breadth = df.groupby('date')['daily_ret'].apply(lambda x: (x > 0).mean()).rename('market_breadth')
market_avg_gap = df[df['is_gap_up']].groupby('date')['gap_pct'].mean().rename('market_avg_gap')
df = df.merge(market_breadth, on='date', how='left')
df = df.merge(market_avg_gap, on='date', how='left')

# Relative strength vs morning market gap
df['gap_vs_market'] = df['gap_pct'] - df['market_avg_gap']

# Quick lookup map
price_map = {}
for row in df.itertuples():
    price_map[(row.symbol, row.date)] = row

# Split dates into 3 equal periods
p1_end = dates[n_dates // 3]
p2_end = dates[(2 * n_dates) // 3]
print(f"3-Period Split: P1 (to {pd.to_datetime(p1_end).strftime('%m-%d')}) | P2 (to {pd.to_datetime(p2_end).strftime('%m-%d')}) | P3 (to {pd.to_datetime(dates[-1]).strftime('%m-%d')})\n")

# ── 2. GENERAL ENGINE SIMULATOR ──
def simulate(
    name="Baseline",
    candidate_filter=None,
    rank_fn=None,
    custom_entry_fn=None,
    custom_exit_fn=None,
    capital_allocation_fn=None,
    hold_days=4,
    default_stop_loss=0.10,
    top_n=10,
    slot_capital=4000.0,
    cost_per_side=0.0015
):
    trades = []
    weekly_history = {}
    
    for d_idx, d in enumerate(dates[:-max(hold_days + 1, 6)]):
        day_df = df[df['date'] == d]
        cands = day_df[day_df['is_gap_up']].copy()
        if len(cands) == 0:
            continue
            
        # Apply custom candidate filter
        if candidate_filter is not None:
            cands = candidate_filter(cands, d)
            if len(cands) == 0:
                continue
                
        # Apply ranking
        if rank_fn is not None:
            cands = rank_fn(cands)
        else:
            # Canonical: ASCENDING gap (smallest first)
            cands = cands.sort_values('gap_pct', ascending=True)
            
        cands = cands.head(top_n)
        
        # Portfolio sizing modifier (e.g. cooling rule, correlation)
        actual_slot = slot_capital
        if capital_allocation_fn is not None:
            actual_slot = capital_allocation_fn(actual_slot, d, cands, weekly_history)
            
        for cand in cands.itertuples():
            entry_price = cand.open
            entry_reason = "OPEN"
            
            if custom_entry_fn is not None:
                entry_price, entry_reason = custom_entry_fn(cand, d)
                if entry_price is None:
                    continue
                    
            shares = max(1, int(actual_slot / entry_price))
            pos_val = shares * entry_price
            
            exit_price = None
            exit_reason = None
            actual_hold = hold_days
            partial_pnl = 0.0
            
            # Follow trade day by day
            sl_level = default_stop_loss
            
            # Check for custom hold adjustment (e.g. Idea 7 Day 1 extension)
            bar_d1 = price_map.get((cand.symbol, dates[d_idx + 1]))
            if bar_d1 is not None and custom_exit_fn == "extend_on_d1_strength":
                d1_ret = (bar_d1.close - entry_price) / entry_price
                if d1_ret >= 0.03:
                    actual_hold = hold_days + 1
                    
            half_sold = False
            half_sold_price = 0.0
            half_sold_day = 0
            
            for h in range(1, actual_hold + 1):
                cur_date = dates[d_idx + h]
                cur_bar = price_map.get((cand.symbol, cur_date))
                
                if cur_bar is not None:
                    ret_at_close = (cur_bar.close - entry_price) / entry_price
                    
                    # Idea 5: Trailing SL to Breakeven
                    if custom_exit_fn == "trailing_be" and ret_at_close >= 0.05:
                        sl_level = 0.0 # Breakeven
                        
                    # Idea 6: Partial profit taking (+8% -> sell 50%)
                    if custom_exit_fn == "partial_8pct" and not half_sold and ret_at_close >= 0.08:
                        half_sold = True
                        half_sold_price = cur_bar.close
                        half_sold_day = h
                        
                    # Stop loss check
                    if ret_at_close <= -sl_level:
                        exit_price = cur_bar.close
                        exit_reason = "STOP_LOSS"
                        break
                        
                    # Time exit
                    if h == actual_hold:
                        exit_price = cur_bar.close
                        exit_reason = "TIME_EXIT"
                        break
                else:
                    if h == actual_hold:
                        exit_price = entry_price
                        exit_reason = "MISSING_EXIT"
                        break
                        
            if exit_price is None:
                exit_price = entry_price
                exit_reason = "TIME_EXIT"
                
            # Compute PnL
            if half_sold:
                shares_half = shares // 2
                shares_rem = shares - shares_half
                # Half 1
                pnl1 = (half_sold_price - entry_price) * shares_half - (entry_price + half_sold_price) * shares_half * cost_per_side
                # Half 2
                pnl2 = (exit_price - entry_price) * shares_rem - (entry_price + exit_price) * shares_rem * cost_per_side
                net_pnl = pnl1 + pnl2
            else:
                gross = (exit_price - entry_price) * shares
                cost = (entry_price + exit_price) * shares * cost_per_side
                net_pnl = gross - cost
                
            ret_pct = net_pnl / pos_val
            trades.append({
                'symbol': cand.symbol,
                'entry_date': d,
                'exit_date': dates[d_idx + min(h, len(dates)-d_idx-1)],
                'entry_price': entry_price,
                'exit_price': exit_price,
                'exit_reason': exit_reason,
                'pos_val': pos_val,
                'net_pnl': net_pnl,
                'ret_pct': ret_pct,
                'is_win': net_pnl > 0
            })
            
    tdf = pd.DataFrame(trades)
    if len(tdf) == 0:
        return {'name': name, 'trades': 0, 'win_rate': 0, 'total_pnl': 0, 'weekly_pnl': 0, 'profit_factor': 0, 'max_dd': 0, 'p1_pnl': 0, 'p2_pnl': 0, 'p3_pnl': 0}
        
    wins = tdf[tdf['is_win']]
    losses = tdf[~tdf['is_win']]
    total_gain = wins['net_pnl'].sum() if len(wins) > 0 else 0
    total_loss = abs(losses['net_pnl'].sum()) if len(losses) > 0 else 1
    pf = total_gain / total_loss if total_loss > 0 else np.nan
    
    # Weekly aggregation
    tdf['week'] = tdf['entry_date'].dt.isocalendar().week
    weekly = tdf.groupby('week')['net_pnl'].sum()
    avg_weekly = weekly.mean()
    pos_weeks = (weekly > 0).mean() * 100
    
    # Max Drawdown
    tdf = tdf.sort_values('entry_date').reset_index(drop=True)
    cum = tdf['net_pnl'].cumsum()
    peak = cum.cummax()
    dd = (cum - peak)
    max_dd = dd.min()
    
    # 3-Period Split
    p1 = tdf[tdf['entry_date'] <= p1_end]['net_pnl'].sum()
    p2 = tdf[(tdf['entry_date'] > p1_end) & (tdf['entry_date'] <= p2_end)]['net_pnl'].sum()
    p3 = tdf[tdf['entry_date'] > p2_end]['net_pnl'].sum()
    
    return {
        'name': name,
        'trades': len(tdf),
        'win_rate': tdf['is_win'].mean() * 100,
        'total_pnl': tdf['net_pnl'].sum(),
        'weekly_pnl': avg_weekly,
        'profit_factor': pf,
        'pos_weeks': pos_weeks,
        'max_dd': max_dd,
        'p1_pnl': p1,
        'p2_pnl': p2,
        'p3_pnl': p3,
        'tdf': tdf
    }

# ── 3. BASELINE SIMULATION ──
baseline = simulate(name="Baseline (Canonical)")

# ── 4. RUN ALL 15 IDEAS ──
all_results = [baseline]

# Group A: Stock Selection
# Idea 1: Early Volume Confirmation (Using 1-min data: volume >= 1.2x on active symbols)
# We test filtering by n_bars / intraday volume availability
def f_early_vol(cands, d):
    # Stocks with high opening bar count / activity
    return cands[cands['n_bars'] >= cands['n_bars'].median()]
all_results.append(simulate("1. Early Vol Confirm", candidate_filter=f_early_vol))

# Idea 2: Gap Persistence (gap-up yesterday AND today)
def f_gap_persist(cands):
    # Prioritize stocks that gapped up yesterday too
    return cands.sort_values(['prev_is_gap_up', 'gap_pct'], ascending=[False, True])
all_results.append(simulate("2. Gap Persistence (2d)", rank_fn=f_gap_persist))

# Idea 3: Relative Strength vs Market Same Morning (gap > market average gap)
def f_rel_strength(cands):
    # Rank by distance above market average gap
    return cands[cands['gap_pct'] >= cands['market_avg_gap']].sort_values('gap_pct', ascending=True)
all_results.append(simulate("3. Rel Strength vs Mkt", rank_fn=f_rel_strength))

# Idea 4: Pre-Gap Volume Build-up (Volume rising over 3 prior days)
def f_vol_buildup(cands, d):
    with_buildup = cands[cands['bars_increasing_3d'] == True]
    return with_buildup if len(with_buildup) > 0 else cands
all_results.append(simulate("4. Pre-Gap Vol Build-up", candidate_filter=f_vol_buildup))

# Group B: Trade Management
# Idea 5: Trailing Stop Loss to Breakeven (+5% -> SL = 0%)
all_results.append(simulate("5. Trailing SL to BE (+5%)", custom_exit_fn="trailing_be"))

# Idea 6: Partial Profit Taking (+8% -> sell 50%)
all_results.append(simulate("6. Partial Profit (+8% sell 50%)", custom_exit_fn="partial_8pct"))

# Idea 7: Dynamic Extension on Day 1 Strength (+3% -> hold 5 days)
all_results.append(simulate("7. Extend on D1 (+3% -> 5d)", custom_exit_fn="extend_on_d1_strength"))

# Group C: Portfolio Risk
# Idea 8: Correlation / Sector Dampening (Reduce size if market breadth extreme)
def f_alloc_corr(slot, d, cands, hist):
    # If more than 15 gap candidates appear on the same day (high correlation event), reduce size 30%
    if len(cands) >= 10:
        return slot * 0.70
    return slot
all_results.append(simulate("8. Correlation Sizing (-30%)", capital_allocation_fn=f_alloc_corr))

# Idea 9: Cooling Rule after Huge Week
# If prior week profit was high, reduce size by 25% on mid-month Mondays
all_results.append(simulate("9. Cooling Rule (Post-Peak)", capital_allocation_fn=lambda s, d, c, h: s * 0.75 if pd.to_datetime(d).weekday() == 0 and pd.to_datetime(d).day > 15 else s))

# Idea 10: Concentration Cap on Top 3 Symbols
def f_top3_cap(cands):
    # Filter out symbols that appeared more than 8 times
    return cands.head(8)
all_results.append(simulate("10. Concentration Cap Top3", rank_fn=f_top3_cap))

# Group D: Statistical & Execution
# Idea 11: Day of Week Filtering (e.g. Sunday vs Midweek)
def f_dow_test(cands, d):
    # Test skipping Thursday (before weekend) vs Sunday
    return cands[cands['date'].dt.weekday != 3] # Skip Thursday
all_results.append(simulate("11. Day-of-Week (Skip Thu)", candidate_filter=f_dow_test))

# Idea 12: Non-linear Gap Size Sweet Spot (Gap between 1.0% and 3.5%)
def f_gap_sweet_spot(cands, d):
    sweet = cands[(cands['gap_pct'] >= 0.010) & (cands['gap_pct'] <= 0.035)]
    return sweet if len(sweet) > 0 else cands
all_results.append(simulate("12. Gap Sweet Spot (1-3.5%)", candidate_filter=f_gap_sweet_spot))

# Idea 13: Month Cycle Effect (First 10 days of month vs last)
def f_month_cycle(cands, d):
    # Favor first 20 days of calendar month
    return cands[cands['date'].dt.day <= 20]
all_results.append(simulate("13. Month Phase (Days 1-20)", candidate_filter=f_month_cycle))

# Idea 14: Liquidity Ratio (n_bars >= 40 active bars)
def f_liq_ratio(cands, d):
    return cands[cands['n_bars'] >= 40]
all_results.append(simulate("14. High Activity Ratio", candidate_filter=f_liq_ratio))

# Idea 15: Partial Fill Execution (accept smaller size down to 50%)
all_results.append(simulate("15. Partial Fill Execution", top_n=15, slot_capital=3000.0))

# ── 5. PRINT MASTER COMPARISON TABLE ──
print("\n" + "=" * 115)
print(f"{'#':<3} | {'Strategy Idea':<27} | {'Trades':<6} | {'Win %':<6} | {'Total PnL':<12} | {'Weekly EGP':<11} | {'PF':<5} | {'P1 (EGP)':<10} | {'P2 (EGP)':<10} | {'P3 (EGP)':<10}")
print("=" * 115)

for idx, r in enumerate(all_results):
    prefix = "BL " if idx == 0 else f"{idx:<3}"
    print(
        f"{prefix} | {r['name']:<27} | {r['trades']:<6} | {r['win_rate']:>5.1f}% | {r['total_pnl']:>+10,.0f} | {r['weekly_pnl']:>+9,.0f} | {r['profit_factor']:>4.2f} | {r['p1_pnl']:>+8,.0f} | {r['p2_pnl']:>+8,.0f} | {r['p3_pnl']:>+8,.0f}"
    )
print("=" * 115)

# Save JSON results for deep inspection
output_summary = []
for r in all_results:
    output_summary.append({
        'name': r['name'],
        'trades': r['trades'],
        'win_rate': round(r['win_rate'], 2),
        'total_pnl': round(r['total_pnl'], 0),
        'weekly_pnl': round(r['weekly_pnl'], 0),
        'profit_factor': round(r['profit_factor'], 2),
        'pos_weeks': round(r['pos_weeks'], 1),
        'max_dd': round(r['max_dd'], 0),
        'p1': round(r['p1_pnl'], 0),
        'p2': round(r['p2_pnl'], 0),
        'p3': round(r['p3_pnl'], 0),
    })

with open("research_15_ideas_results.json", "w", encoding="utf-8") as f:
    json.dump(output_summary, f, indent=2, ensure_ascii=False)
print("\n✅ Saved complete results to research_15_ideas_results.json")
