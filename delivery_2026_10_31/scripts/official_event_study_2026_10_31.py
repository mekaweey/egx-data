# -*- coding: utf-8 -*-
"""Focused event study on official EGX disclosures.

This is a *research* event study, not a live-trading result.  It measures what
happened after official disclosures using the Mubasher raw daily close panel.
Every trade is entered only after the disclosure is public (14:00 Cairo cutoff
for same-day entry; otherwise next trading day), and exits at the close after
1 or 5 trading days.

Event families
--------------
* Financial Results
* Treasury-stock purchases (official buyback releases)
* Corporate actions (cash dividend, stock dividend, rights, split)
* M&A / acquisition / merger headlines
* Negative-news headlines (lawsuit, penalty, fraud, suspension, ...)

Outputs
-------
* official_event_study_trades_2026_10_31.csv
* official_event_study_summary_2026_10_31.csv
* official_event_study_summary_2026_10_31.json

Caveats
-------
* Daily close-to-close, no intraday fill, no partial fill, no rejection model.
* Costs use 0.08% commission per side + 0.10% assumed slippage per side
  (0.36% round trip).  The EGP 245/month fixed fee is not allocated per trade.
* Overlapping events and cross-sectional correlation inflate naive t-stats;
  the script also reports a t-stat clustered by entry date.
* This is an execution simulation/backtest, not verified real fills.
"""
from __future__ import annotations

import json
import re
from bisect import bisect_left, bisect_right
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
RAW = DATA / "mubasher" / "mubasher_daily_raw_2022_2026_2026_10_31.parquet"
OFF = DATA / "egx_official" / "egx_official_disclosures_enriched_2022_2026_2026_10_31.csv"
CA = DATA / "egx_official" / "official_corporate_actions_2022_2026_2026_10_31.csv"
MW = DATA / "egx_official" / "egx_official_market_watch_2026_10_31.csv"
OUT = DATA / "egx_official"

COST_ROUND_TRIP = 0.0008 * 2 + 0.0010 * 2  # 0.36%
HORIZONS = (1, 5)


def norm_reuters(value) -> str:
    if not isinstance(value, str):
        return ""
    x = value.strip().upper()
    x = re.sub(r"\.CA$", "", x)
    x = re.sub(r"_R\d+$", "", x)
    x = re.sub(r"[^A-Z0-9].*$", "", x)
    return x


def build_price_maps(raw: pd.DataFrame):
    raw = raw.sort_values(["symbol", "date"])
    dates: dict[str, np.ndarray] = {}
    closes: dict[str, np.ndarray] = {}
    rets = []
    for sym, g in raw.groupby("symbol", sort=False):
        g = g.dropna(subset=["date", "close"]).sort_values("date")
        if g.empty:
            continue
        d = g["date"].to_numpy(dtype="datetime64[D]")
        c = g["close"].astype(float).to_numpy()
        dates[sym] = d
        closes[sym] = c
        r = pd.Series(c).pct_change().to_numpy()
        rets.append(pd.DataFrame({"date": g["date"].to_numpy(), "ret": r}))
    all_rets = pd.concat(rets, ignore_index=True).dropna()
    # Equal-weight market proxy (mean) is the main baseline; the median is a
    # robustness check against outliers / skewness.
    mkt_mean = all_rets.groupby("date")["ret"].mean().sort_index().clip(-0.20, 0.20)
    mkt_median = all_rets.groupby("date")["ret"].median().sort_index().clip(-0.20, 0.20)
    mkt_index = (1.0 + mkt_mean).cumprod()
    mkt_index_median = (1.0 + mkt_median).cumprod()
    return dates, closes, mkt_mean, mkt_index, mkt_index_median


def entry_index(dates: np.ndarray, published: pd.Timestamp, after_close_cutoff: bool = True) -> int | None:
    if pd.isna(published):
        return None
    pub_date = np.datetime64(published.normalize(), "D")
    # Official times are Cairo local.  >= 14:00 -> next trading day close.
    if after_close_cutoff and published.hour * 60 + published.minute >= 14 * 60:
        idx = bisect_right(dates, pub_date)
    else:
        idx = bisect_left(dates, pub_date)
    return idx if idx < len(dates) else None


def event_date_index(dates: np.ndarray, event_date: pd.Timestamp) -> int | None:
    if pd.isna(event_date):
        return None
    d = np.datetime64(event_date.normalize(), "D")
    idx = bisect_left(dates, d)
    return idx if idx < len(dates) else None


def market_return_between(mkt_index: pd.Series, d0: pd.Timestamp, d1: pd.Timestamp) -> float:
    try:
        a = mkt_index.loc[pd.Timestamp(d0).normalize()]
        b = mkt_index.loc[pd.Timestamp(d1).normalize()]
        return float(b / a - 1.0)
    except KeyError:
        return 0.0


def dedupe_events(df: pd.DataFrame, date_col: str, symbol_col: str = "symbol", min_days: int = 5) -> pd.DataFrame:
    """Keep the first event per symbol per ``min_days`` calendar days."""
    if df.empty:
        return df
    out = []
    for sym, g in df.sort_values(date_col).groupby(symbol_col, sort=False):
        last = None
        for _, r in g.iterrows():
            d = pd.Timestamp(r[date_col])
            if last is None or (d - last).days >= min_days:
                out.append(r)
                last = d
    return pd.DataFrame(out) if out else df.iloc[0:0]


def add_trades(
    events: pd.DataFrame,
    event_type: str,
    sample: str,
    dates: dict[str, np.ndarray],
    closes: dict[str, np.ndarray],
    mkt_index: pd.Series,
    mkt_index_median: pd.Series | None = None,
    entry_mode: str = "published",
    horizons=HORIZONS,
) -> list[dict]:
    rows: list[dict] = []
    for _, ev in events.iterrows():
        sym = str(ev.get("symbol") or "").strip().upper()
        if not sym or sym not in dates:
            continue
        d = dates[sym]
        c = closes[sym]
        if entry_mode == "published":
            idx = entry_index(d, pd.Timestamp(ev["published_cairo"]), after_close_cutoff=True)
        else:
            idx = event_date_index(d, pd.Timestamp(ev["event_date"]))
        if idx is None or idx >= len(d):
            continue
        entry_date = pd.Timestamp(d[idx])
        entry_close = float(c[idx])
        if not np.isfinite(entry_close) or entry_close <= 0:
            continue
        for h in horizons:
            j = idx + h
            if j >= len(d):
                continue
            exit_date = pd.Timestamp(d[j])
            exit_close = float(c[j])
            if not np.isfinite(exit_close) or exit_close <= 0:
                continue
            trade_ret = exit_close / entry_close - 1.0
            mkt_ret = market_return_between(mkt_index, entry_date, exit_date)
            mkt_ret_med = market_return_between(
                mkt_index_median if mkt_index_median is not None else mkt_index,
                entry_date,
                exit_date,
            )
            abnormal = (1.0 + trade_ret) / (1.0 + mkt_ret) - 1.0
            abnormal_med = (1.0 + trade_ret) / (1.0 + mkt_ret_med) - 1.0
            net_ret = trade_ret - COST_ROUND_TRIP
            net_abnormal = (1.0 + net_ret) / (1.0 + mkt_ret) - 1.0
            net_abnormal_med = (1.0 + net_ret) / (1.0 + mkt_ret_med) - 1.0
            rows.append(
                {
                    "event_type": event_type,
                    "sample": sample,
                    "symbol": sym,
                    "published_cairo": ev.get("published_cairo"),
                    "event_date": ev.get("event_date", pd.NaT),
                    "entry_date": entry_date.date().isoformat(),
                    "exit_date": exit_date.date().isoformat(),
                    "horizon": h,
                    "entry_close": entry_close,
                    "exit_close": exit_close,
                    "trade_return": trade_ret,
                    "market_return": mkt_ret,
                    "market_return_median": mkt_ret_med,
                    "abnormal_return": abnormal,
                    "abnormal_return_median": abnormal_med,
                    "net_return": net_ret,
                    "net_abnormal_return": net_abnormal,
                    "net_abnormal_return_median": net_abnormal_med,
                    "heading": ev.get("heading", ""),
                }
            )
    return rows


def summarize(trades: pd.DataFrame) -> pd.DataFrame:
    if trades.empty:
        return pd.DataFrame()
    out = []
    for (etype, sample, h), g in trades.groupby(["event_type", "sample", "horizon"], sort=False):
        x = g["trade_return"].astype(float)
        a = g["abnormal_return"].astype(float)
        am = g["abnormal_return_median"].astype(float)
        net = g["net_return"].astype(float)
        if len(x) >= 20:
            lo, hi = x.quantile(0.005), x.quantile(0.995)
            xw = x.clip(lo, hi)
        else:
            xw = x
        t_naive = float(a.mean() / (a.std(ddof=1) / np.sqrt(len(a)))) if len(a) > 2 and a.std(ddof=1) > 0 else np.nan
        by_date = a.groupby(g["entry_date"]).mean()
        t_date = (
            float(by_date.mean() / (by_date.std(ddof=1) / np.sqrt(len(by_date))))
            if len(by_date) > 2 and by_date.std(ddof=1) > 0
            else np.nan
        )
        by_date_med = am.groupby(g["entry_date"]).mean()
        t_date_med = (
            float(by_date_med.mean() / (by_date_med.std(ddof=1) / np.sqrt(len(by_date_med))))
            if len(by_date_med) > 2 and by_date_med.std(ddof=1) > 0
            else np.nan
        )
        out.append(
            {
                "event_type": etype,
                "sample": sample,
                "horizon": int(h),
                "n": int(len(g)),
                "n_symbols": int(g["symbol"].nunique()),
                "n_entry_dates": int(g["entry_date"].nunique()),
                "mean_gross": float(x.mean()),
                "mean_gross_winsor": float(xw.mean()),
                "median_gross": float(x.median()),
                "win_rate": float((x > 0).mean()),
                "mean_net": float(net.mean()),
                "mean_abnormal": float(a.mean()),
                "median_abnormal": float(a.median()),
                "mean_abnormal_median_mkt": float(am.mean()),
                "median_abnormal_median_mkt": float(am.median()),
                "t_naive": t_naive,
                "t_by_entry_date": t_date,
                "t_by_entry_date_median_mkt": t_date_med,
                "date_min": str(g["entry_date"].min()),
                "date_max": str(g["entry_date"].max()),
            }
        )
    return pd.DataFrame(out).sort_values(["event_type", "sample", "horizon"])


def main() -> None:
    raw = pd.read_parquet(RAW)
    raw["date"] = pd.to_datetime(raw["date"])
    dates, closes, mkt, mkt_index, mkt_index_median = build_price_maps(raw)

    off = pd.read_csv(OFF)
    off["symbol"] = off["symbol"].fillna("").astype(str).str.strip().str.upper()
    off["published_cairo"] = (
        pd.to_datetime(off["published_cairo"], errors="coerce", utc=True)
        .dt.tz_convert("Africa/Cairo")
        .dt.tz_localize(None)
    )
    off["pub_date"] = off["published_cairo"].dt.normalize()
    off["heading"] = off["heading"].fillna("")

    all_trades: list[dict] = []

    # ---------- Financial Results ----------
    fr = off[(off["section"].eq("Financial Results")) & (off["symbol"].ne(""))].copy()
    fr = fr.sort_values(["symbol", "published_cairo"])
    # One event per symbol/date; keep the earliest publication, prefer consolidated.
    fr["is_consolidated"] = fr["heading"].str.contains("Consolidated", case=False, regex=False)
    fr = fr.sort_values(["symbol", "pub_date", "is_consolidated", "published_cairo"], ascending=[True, True, False, True])
    fr = fr.drop_duplicates(subset=["symbol", "pub_date"], keep="first")
    fr["event_date"] = fr["pub_date"]
    fr_all = fr.copy()
    fr_dedup = dedupe_events(fr, "pub_date", min_days=5)
    all_trades += add_trades(fr_all, "financial_results", "all", dates, closes, mkt_index, mkt_index_median)
    all_trades += add_trades(fr_dedup, "financial_results", "dedup5", dates, closes, mkt_index, mkt_index_median)

    # ---------- Treasury stock purchases (official buybacks) ----------
    tb = off[
        off["section"].eq("Insider Trading Executions/Treasury Stocks")
        & off["symbol"].ne("")
        & off["heading"].str.contains("purchase of treasury", case=False, regex=False)
    ].copy()
    tb = tb.sort_values(["symbol", "published_cairo"]).drop_duplicates(subset=["symbol", "pub_date"], keep="first")
    tb["event_date"] = tb["pub_date"]
    tb_dedup = dedupe_events(tb, "pub_date", min_days=5)
    all_trades += add_trades(tb, "treasury_buyback", "all", dates, closes, mkt_index, mkt_index_median)
    all_trades += add_trades(tb_dedup, "treasury_buyback", "dedup5", dates, closes, mkt_index, mkt_index_median)

    # Treasury sales: count only (too few for a stable test).
    ts = off[
        off["section"].eq("Insider Trading Executions/Treasury Stocks")
        & off["symbol"].ne("")
        & off["heading"].str.contains("selling of treasury", case=False, regex=False)
    ]
    treasury_sales_count = int(len(ts))

    # ---------- Corporate actions ----------
    ca = pd.read_csv(CA)
    ca["published_cairo"] = (
        pd.to_datetime(ca["published_cairo"], errors="coerce", utc=True)
        .dt.tz_convert("Africa/Cairo")
        .dt.tz_localize(None)
    )
    ca["ex_date"] = pd.to_datetime(ca["ex_date"], errors="coerce")
    ca["entitled_till"] = pd.to_datetime(ca["entitled_till"], errors="coerce")
    code_to_symbol = dict(zip(off["code"], off["symbol"]))
    mw = pd.read_csv(MW)
    reuters_map = {norm_reuters(r): str(s).strip().upper() for r, s in zip(mw["reuters"], mw["symbol"])}
    isin_map = {str(i).strip().upper(): str(s).strip().upper() for i, s in zip(mw["isin"], mw["symbol"])}
    ca["symbol"] = ca["source_code"].map(code_to_symbol)
    missing = ca["symbol"].fillna("").eq("")
    ca.loc[missing, "symbol"] = ca.loc[missing, "reuters_code"].map(lambda x: reuters_map.get(norm_reuters(x), ""))
    missing = ca["symbol"].fillna("").eq("")
    ca.loc[missing, "symbol"] = ca.loc[missing, "isin"].map(lambda x: isin_map.get(str(x).strip().upper(), ""))
    ca["symbol"] = ca["symbol"].fillna("").astype(str).str.strip().str.upper()

    for atype, label in [
        ("cash_dividend", "cash_dividend"),
        ("stock_dividend", "stock_dividend"),
        ("rights", "rights"),
        ("split", "split"),
    ]:
        g = ca[ca["action_type"].eq(atype) & ca["symbol"].ne("")].copy()
        if g.empty:
            continue
        # Event date: enter at the ex-date close (after the mechanical drop).
        # The official "Dividend Date" is the last cum date, so the ex-date is
        # the next trading day.  An explicit "Ex-Dividend Date" is used as-is.
        g["event_date"] = pd.NaT
        for idx, row in g.iterrows():
            sym = row["symbol"]
            if sym not in dates:
                continue
            d = dates[sym]
            base = None
            if atype in ("cash_dividend", "stock_dividend"):
                src = str(row.get("ex_date_source") or "")
                if src == "explicit" and pd.notna(row["ex_date"]):
                    g.at[idx, "event_date"] = row["ex_date"]
                    continue
                if src == "dividend_date" and pd.notna(row["ex_date"]):
                    base = row["ex_date"]
                elif pd.notna(row["entitled_till"]):
                    base = row["entitled_till"]
            elif atype == "rights":
                if pd.notna(row["ex_date"]):
                    g.at[idx, "event_date"] = row["ex_date"]
                    continue
                if pd.notna(row["entitled_till"]):
                    base = row["entitled_till"]
            elif atype == "split":
                if pd.notna(row["ex_date"]):
                    g.at[idx, "event_date"] = row["ex_date"]
                    continue
            if base is not None:
                pos = bisect_right(d, np.datetime64(base.normalize(), "D"))
                if pos < len(d):
                    g.at[idx, "event_date"] = pd.Timestamp(d[pos])
        g = g.dropna(subset=["event_date"])
        g = g.sort_values(["symbol", "event_date", "published_cairo"])
        g = g.drop_duplicates(subset=["symbol", "event_date"], keep="first")
        all_trades += add_trades(g, label, "all", dates, closes, mkt_index, mkt_index_median, entry_mode="event")

    # ---------- M&A headlines ----------
    mna_tokens = ["acquisition", "merger", "takeover", "استحواذ", "اندماج"]
    mna_rx = re.compile("|".join(re.escape(t) for t in mna_tokens), re.I)
    mna = off[off["symbol"].ne("") & off["heading"].map(lambda s: bool(mna_rx.search(s)))].copy()
    mna = mna.sort_values(["symbol", "published_cairo"]).drop_duplicates(subset=["symbol", "pub_date"], keep="first")
    mna["event_date"] = mna["pub_date"]
    mna_dedup = dedupe_events(mna, "pub_date", min_days=5)
    all_trades += add_trades(mna, "mna", "all", dates, closes, mkt_index, mkt_index_median)
    all_trades += add_trades(mna_dedup, "mna", "dedup5", dates, closes, mkt_index, mkt_index_median)

    # ---------- Negative-news headlines ----------
    neg_tokens = [
        "lawsuit",
        "penalt",
        "fine",
        "fraud",
        "bankrupt",
        "suspend",
        "resign",
        "loss",
        "خسائر",
        "غرامة",
        "استقالة",
        "إيقاف",
        "تسوية",
        "شكوى",
    ]
    neg_rx = re.compile("|".join(re.escape(t) for t in neg_tokens), re.I)
    neg = off[off["symbol"].ne("") & off["heading"].map(lambda s: bool(neg_rx.search(s)))].copy()
    neg = neg.sort_values(["symbol", "published_cairo"]).drop_duplicates(subset=["symbol", "pub_date"], keep="first")
    neg["event_date"] = neg["pub_date"]
    neg_dedup = dedupe_events(neg, "pub_date", min_days=5)
    all_trades += add_trades(neg, "negative_news", "all", dates, closes, mkt_index, mkt_index_median)
    all_trades += add_trades(neg_dedup, "negative_news", "dedup5", dates, closes, mkt_index, mkt_index_median)

    trades = pd.DataFrame(all_trades)
    trades_path = OUT / "official_event_study_trades_2026_10_31.csv"
    trades.to_csv(trades_path, index=False, encoding="utf-8-sig")
    summary = summarize(trades)
    summary_path = OUT / "official_event_study_summary_2026_10_31.csv"
    summary.to_csv(summary_path, index=False, encoding="utf-8-sig")

    meta = {
        "trades": int(len(trades)),
        "event_types": trades["event_type"].value_counts().to_dict() if len(trades) else {},
        "samples": trades["sample"].value_counts().to_dict() if len(trades) else {},
        "horizons": list(HORIZONS),
        "cost_round_trip_pct": COST_ROUND_TRIP * 100.0,
        "entry_rule": (
            "Financial/treasury/M&A/negative events: if published at/after 14:00 Cairo, "
            "enter next trading day close; otherwise enter same-day close. Corporate actions: "
            "enter at the ex-date close (or next trading day if the ex-date is not a trading day)."
        ),
        "market_adjustment": "Equal-weight mean cross-sectional daily return of all raw-panel symbols is the main baseline; median and 10% trimmed mean are robustness checks. All are compounded over the holding window.",
        "dedupe": "One event per symbol/date; dedup5 keeps the first event per symbol per 5 calendar days.",
        "treasury_sales_rows": treasury_sales_count,
        "recommendations": (
            "The official disclosures contain no broker recommendation/target-price series "
            "(only one audit-committee 'recommendations' row); the prior Mubasher recommendation "
            "test remains the only recommendation evidence."
        ),
        "caveats": [
            "Event study/backtest, not real execution.",
            "Daily close-to-close; no intraday fill, partial fill, rejection or queue model.",
            "Costs: 0.08%/side commission + 0.10%/side assumed slippage = 0.36% round trip; EGP 245/month not allocated.",
            "Naive t-stats ignore overlapping windows and cross-sectional correlation; use the entry-date-clustered t-stat as descriptive.",
            "Small samples (M&A, rights, splits) are inconclusive.",
        ],
        "generated_at_utc": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (OUT / "official_event_study_summary_2026_10_31.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print("\nsummary")
    print(summary.to_string(index=False))
    print("wrote", trades_path)
    print("wrote", summary_path)


if __name__ == "__main__":
    main()
