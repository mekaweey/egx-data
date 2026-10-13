import os
from supabase import create_client

def load_env(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env(r"D:\meky-stock-main\meky-stock-main\.env")
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

tables = [
    "stocks",
    "daily_candles",
    "intraday_candles",
    "live_ticks",
    "marketwatch_snapshots",
    "scalp_signal_log",
    "news_sentiment",
    "stock_snapshots",
    "fundamentals",
    "daily_intelligence",
    "scalp_feasibility_report",
    "pick_notifications",
    "scans",
    "daily_picks",
    "market_snapshots",
    "macro_indicators",
    "ensemble_votes",
    "walk_forward_runs",
    "strategy_settings",
    "extension_config",
    "execution_quality_log",
    "seed_depth_imbalance",
    "seed_news_sentiment",
    "seed_opening_range",
    "seed_paper_trades_analytics",
    "seed_signal_reversal_check",
    "seed_strategy_overview",
    "seed_strategy_symbol_ranking",
    "seed_symbol_vwap_daily",
]

print(f"{'Table Name':32} | {'Live Row Count':>15}")
print("-" * 52)
grand_total = 0
for t in tables:
    try:
        res = sb.table(t).select("*", count="exact").limit(1).execute()
        cnt = res.count or 0
        grand_total += cnt
        print(f"{t:32} | {cnt:15,}")
    except Exception as e:
        print(f"{t:32} | ERROR: {e}")

print("-" * 52)
print(f"{'GRAND TOTAL':32} | {grand_total:15,}")
