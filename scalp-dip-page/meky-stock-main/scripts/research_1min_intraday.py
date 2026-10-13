import os
import glob
import pandas as pd
import numpy as np
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 70)
print("🔬 INTRADAY 1-MINUTE ANALYSIS: Testing 10:00-10:15 Opening Direction")
print("=" * 70)

tv_dir = r"D:\TradingView data"
csv_files = glob.glob(os.path.join(tv_dir, "EGX_DLY_*, 1.csv"))
print(f"Found {len(csv_files)} symbol 1-minute files in {tv_dir}")

# Sample top 30 active symbols to test first
top_symbols = ['COMI', 'TMGH', 'FWRY', 'SWDY', 'EKHO', 'HRHO', 'ETEL', 'ESRS', 'ORAS', 'AMOC',
               'SKPC', 'ABUK', 'MFPC', 'ISPH', 'JUFO', 'DOMP', 'MNHD', 'PHDC', 'ORWE', 'HELI']

results = []

for sym in top_symbols:
    fpath = os.path.join(tv_dir, f"EGX_DLY_{sym}, 1.csv")
    if not os.path.exists(fpath):
        continue
        
    try:
        d = pd.read_csv(fpath)
        d['dt'] = pd.to_datetime(d['time'], unit='s')
        # Cairo time is UTC+2 or UTC+3
        # Group into daily sessions
        d['date'] = d['dt'].dt.date
        
        days = []
        for dt_date, grp in d.groupby('date'):
            if len(grp) < 30:
                continue
            grp = grp.sort_values('time').reset_index(drop=True)
            
            day_open = grp.iloc[0]['open']
            day_close = grp.iloc[-1]['close']
            
            # First 15 bars (10:00 - 10:15)
            first_15 = grp.iloc[:min(15, len(grp))]
            p_15 = first_15.iloc[-1]['close']
            vol_15 = first_15['Volume'].sum()
            
            # Direction in first 15 mins
            is_green_15 = p_15 >= day_open
            ret_15 = (p_15 - day_open) / day_open
            
            days.append({
                'date': dt_date,
                'open': day_open,
                'close': day_close,
                'p_15': p_15,
                'is_green_15': is_green_15,
                'ret_15': ret_15,
                'vol_15': vol_15
            })
            
        ddf = pd.DataFrame(days).sort_values('date').reset_index(drop=True)
        if len(ddf) < 10:
            continue
            
        ddf['prev_close'] = ddf['close'].shift(1)
        ddf['gap_pct'] = (ddf['open'] - ddf['prev_close']) / ddf['prev_close']
        ddf['is_gap_up'] = ddf['gap_pct'] > 0
        
        # Next 4-day exit price
        ddf['exit_4d'] = ddf['close'].shift(-4)
        
        # Flawed Look-ahead: using open price when confirmation happened 15m later
        ddf['ret_4d_lookahead'] = (ddf['exit_4d'] - ddf['open']) / ddf['open']
        
        # REALISTIC RULE-COMPLIANT: Entry at actual confirmation moment (p_15)
        ddf['ret_4d_realistic'] = (ddf['exit_4d'] - ddf['p_15']) / ddf['p_15']
        
        gap_ups = ddf[ddf['is_gap_up'] & ddf['ret_4d_lookahead'].notna()].copy()
        gap_ups['symbol'] = sym
        results.append(gap_ups)
    except Exception as e:
        pass

if results:
    all_gaps = pd.concat(results, ignore_index=True)
    print(f"Total Gap-Up events analyzed with 1-min data: {len(all_gaps):,}")
    
    # Compare First 15m Green vs First 15m Red
    green_15 = all_gaps[all_gaps['is_green_15'] == True]
    red_15 = all_gaps[all_gaps['is_green_15'] == False]
    
    print("\n" + "=" * 85)
    print("⚠️ COMPARISON: Realistic Entry (@ p_15 confirmation) vs Flawed Look-Ahead (@ Open)")
    print("=" * 85)
    print(f"{'Condition & Entry Mode':<42} | {'Trades':<7} | {'Win Rate':<10} | {'Avg 4D Return':<14}")
    print("-" * 85)
    print(f"{'All Gap-Ups (Baseline @ Open)':<42} | {len(all_gaps):<7} | {(all_gaps['ret_4d_lookahead'] > 0).mean()*100:5.1f}%    | {all_gaps['ret_4d_lookahead'].mean()*100:+6.2f}%")
    print("-" * 85)
    print(f"{'First 15m GREEN [LOOK-AHEAD: Entry @ Open]':<42} | {len(green_15):<7} | {(green_15['ret_4d_lookahead'] > 0).mean()*100:5.1f}%    | {green_15['ret_4d_lookahead'].mean()*100:+6.2f}% (INVALID: includes free 15m gain)")
    print(f"{'First 15m GREEN [REALISTIC:  Entry @ p_15]':<42} | {len(green_15):<7} | {(green_15['ret_4d_realistic'] > 0).mean()*100:5.1f}%    | {green_15['ret_4d_realistic'].mean()*100:+6.2f}% (VALID: actual execution)")
    print("-" * 85)
    print(f"{'First 15m RED   [LOOK-AHEAD: Entry @ Open]':<42} | {len(red_15):<7} | {(red_15['ret_4d_lookahead'] > 0).mean()*100:5.1f}%    | {red_15['ret_4d_lookahead'].mean()*100:+6.2f}%")
    print(f"{'First 15m RED   [REALISTIC:  Entry @ p_15]':<42} | {len(red_15):<7} | {(red_15['ret_4d_realistic'] > 0).mean()*100:5.1f}%    | {red_15['ret_4d_realistic'].mean()*100:+6.2f}%")
    print("=" * 85)
