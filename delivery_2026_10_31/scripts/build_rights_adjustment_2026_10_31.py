# -*- coding: utf-8 -*-
"""Build a conservative, evidence-based rights-issue adjustment.

The Mubasher raw daily panel is *not* uniformly unadjusted: for most rights
issues the vendor has already back-adjusted the series, so there is no visible
ex-date drop.  Applying a theoretical factor to those events would double-adjust
the prices and create artificial jumps.  This script therefore:

1. Matches each Mubasher rights event to official EGX terms (by Reuters code or
   ISIN, within 120 days).
2. Computes the theoretical ex-rights factor:
       TERP   = (M * P_cum + N * S) / (M + N)
       factor = TERP / P_cum
3. Applies the factor **only** when the observed ex-date return is negative and
   consistent with the theoretical drop (absolute difference <= 5 percentage
   points).  Otherwise the raw series is left unchanged and the event is
   labelled ``already_adjusted_no_drop`` / ``partial_drop_not_adjusted`` /
   ``already_adjusted_or_inconsistent``.
4. Caps out-of-the-money rights (factor > 1) at 1.0 (no adjustment).
5. Does not guess unmatched or incomplete events; they are written with a
   status and excluded from the adjusted panel.

The output factors CSV keeps both the theoretical factor and the applied factor
so every decision is auditable.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
DEFAULT_RAW = DATA / "mubasher" / "mubasher_daily_raw_2022_2026_2026_10_31.parquet"
DEFAULT_MUB = DATA / "corporate_actions_unified_2022_2026_2026_10_31.csv"
DEFAULT_OFF = DATA / "egx_official" / "official_rights_terms_all_sections_2022_2026_2026_10_31.csv"
DEFAULT_ADDENDUM = DATA / "egx_official" / "official_rights_terms_listing_addendum_2026_10_31.csv"
DEFAULT_MW = DATA / "egx_official" / "egx_official_market_watch_2026_10_31.csv"
DEFAULT_MACRO = DATA / "macro_daily_2022_2026_2026_10_31.csv"
DEFAULT_OUT = DATA

CONSISTENCY_TOL = 0.05  # 5 percentage points


def next_trading_day(dates: pd.Series, day: pd.Timestamp) -> pd.Timestamp | None:
    later = dates[dates > day]
    return later.min() if len(later) else None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default=str(DEFAULT_RAW))
    ap.add_argument("--mub", default=str(DEFAULT_MUB))
    ap.add_argument("--official", default=str(DEFAULT_OFF))
    ap.add_argument("--addendum", default=str(DEFAULT_ADDENDUM))
    ap.add_argument("--market-watch", default=str(DEFAULT_MW))
    ap.add_argument("--macro", default=str(DEFAULT_MACRO))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    raw = pd.read_parquet(args.raw)
    raw["date"] = pd.to_datetime(raw["date"])
    raw = raw.sort_values(["symbol", "date"]).reset_index(drop=True)

    mub = pd.read_csv(args.mub)
    mub = mub[mub["action_category"].eq("rights")].copy()
    mub["symbol"] = mub["symbol"].astype(str).str.strip()
    mub["mub_date"] = pd.to_datetime(mub["ex_date"], errors="coerce")
    mub = mub.dropna(subset=["mub_date"]).sort_values(["symbol", "mub_date"])

    off = pd.read_csv(args.official)
    off_base_rows = len(off)
    off["terms_source"] = "official_structured_all_sections"
    off["not_applicable_reason"] = ""
    add_path = Path(args.addendum)
    add_rows = 0
    if add_path.exists():
        add = pd.read_csv(add_path)
        add_rows = len(add)
        for c in off.columns:
            if c not in add.columns:
                add[c] = None
        add = add[off.columns]
        off = pd.concat([off, add], ignore_index=True)
        off = off.drop_duplicates(
            subset=["reuters_code", "isin", "entitled_till", "subscription_price", "shares_before", "shares_increase"],
            keep="first",
        )
    off["not_applicable_reason"] = off["not_applicable_reason"].fillna("").astype(str).str.strip()
    off["terms_source"] = off["terms_source"].fillna("official_structured_all_sections")
    off = off[off["action_type"].eq("rights")].copy()
    off["symbol"] = (
        off["reuters_code"].fillna("").astype(str).str.replace(".CA", "", regex=False).str.strip()
    )
    off["entitled_till"] = pd.to_datetime(off["entitled_till"], errors="coerce")
    off["published"] = (
        pd.to_datetime(off["published_cairo"], errors="coerce", utc=True)
        .dt.tz_convert("Africa/Cairo")
        .dt.tz_localize(None)
    )
    off = off.dropna(subset=["entitled_till"]).sort_values(["symbol", "entitled_till", "published"])

    mw = pd.read_csv(args.market_watch)
    isin_map = dict(zip(mw["symbol"], mw["isin"]))
    # Fill missing ISINs from official rows by Reuters symbol.
    for sym in mub["symbol"].unique():
        if sym not in isin_map or pd.isna(isin_map.get(sym)):
            vals = off.loc[off["symbol"].eq(sym), "isin"].dropna()
            if len(vals):
                isin_map[sym] = vals.iloc[0]

    macro = pd.read_csv(args.macro)
    macro["date"] = pd.to_datetime(macro["date"], errors="coerce")
    fx = macro.dropna(subset=["date", "usdegp"]).set_index("date")["usdegp"].sort_index()

    dates_by_symbol = {sym: g["date"].sort_values().reset_index(drop=True) for sym, g in raw.groupby("symbol")}
    close_by_symbol = {sym: g.set_index("date")["close"].sort_index() for sym, g in raw.groupby("symbol")}

    rows = []
    for _, r in mub.iterrows():
        sym = r["symbol"]
        mub_date = r["mub_date"]
        isin = isin_map.get(sym)
        candidates = off[
            (off["symbol"].eq(sym))
            | (off["isin"].fillna("").eq(isin) if isinstance(isin, str) and isin else False)
        ].copy()
        candidates = candidates[
            candidates["entitled_till"].between(
                mub_date - pd.Timedelta(days=120), mub_date + pd.Timedelta(days=120)
            )
        ]
        if candidates.empty:
            rows.append(
                {
                    "symbol": sym,
                    "mub_date": mub_date.date().isoformat(),
                    "status": "unmatched_official_terms",
                    "notes": "No official rights terms for this symbol/ISIN within 120 days.",
                }
            )
            continue

        # Prefer the primary rights notice over an "uncovered portion" or
        # correction row; then the closest entitled date; then the earliest
        # publication.
        candidates["is_uncovered"] = (
            candidates["heading"].fillna("").str.contains("Uncovered Portion", case=False, regex=False)
        )
        candidates["date_gap"] = (candidates["entitled_till"] - mub_date).abs().dt.days
        candidates["pub_gap"] = (candidates["published"] - mub_date).abs().dt.days
        candidates = candidates.sort_values(["is_uncovered", "date_gap", "pub_gap"])
        cand = candidates.iloc[0]

        cum_date = cand["entitled_till"]
        sym_dates = dates_by_symbol.get(sym)
        if sym_dates is None or sym_dates.empty:
            rows.append(
                {
                    "symbol": sym,
                    "mub_date": mub_date.date().isoformat(),
                    "official_published": cand.get("published_cairo"),
                    "official_code": cand.get("source_code"),
                    "official_entitled_till": cand["entitled_till"].date().isoformat(),
                    "official_section": cand.get("section"),
                    "official_heading": cand.get("heading"),
                    "subscription_price": cand.get("subscription_price"),
                    "subscription_currency": cand.get("subscription_currency"),
                    "shares_before": cand.get("shares_before"),
                    "shares_increase": cand.get("shares_increase"),
                    "rights_ratio_new_per_old": (
                        float(cand.get("shares_increase")) / float(cand.get("shares_before"))
                        if pd.notna(cand.get("shares_before"))
                        and pd.notna(cand.get("shares_increase"))
                        and float(cand.get("shares_before"))
                        else np.nan
                    ),
                    "status": "no_price_dates",
                    "notes": "No raw daily prices for this symbol; official terms recorded but no adjustment tested.",
                }
            )
            continue
        cum_candidates = sym_dates[sym_dates <= cum_date]
        if cum_candidates.empty:
            rows.append(
                {
                    "symbol": sym,
                    "mub_date": mub_date.date().isoformat(),
                    "official_published": cand.get("published_cairo"),
                    "official_code": cand.get("source_code"),
                    "official_entitled_till": cand["entitled_till"].date().isoformat(),
                    "official_section": cand.get("section"),
                    "official_heading": cand.get("heading"),
                    "subscription_price": cand.get("subscription_price"),
                    "subscription_currency": cand.get("subscription_currency"),
                    "shares_before": cand.get("shares_before"),
                    "shares_increase": cand.get("shares_increase"),
                    "status": "no_cum_close",
                    "notes": "No close on or before the official entitled date.",
                }
            )
            continue
        cum_date = cum_candidates.max()
        ex_date = next_trading_day(sym_dates, cum_date)
        if ex_date is None:
            rows.append(
                {
                    "symbol": sym,
                    "mub_date": mub_date.date().isoformat(),
                    "official_published": cand.get("published_cairo"),
                    "official_code": cand.get("source_code"),
                    "official_entitled_till": cand["entitled_till"].date().isoformat(),
                    "official_section": cand.get("section"),
                    "official_heading": cand.get("heading"),
                    "subscription_price": cand.get("subscription_price"),
                    "subscription_currency": cand.get("subscription_currency"),
                    "shares_before": cand.get("shares_before"),
                    "shares_increase": cand.get("shares_increase"),
                    "status": "no_ex_date",
                    "notes": "No trading day after the last cum-rights date.",
                }
            )
            continue

        close_s = close_by_symbol[sym]
        p_cum = float(close_s.loc[cum_date])
        p_ex = float(close_s.loc[ex_date])
        raw_ret = p_ex / p_cum - 1.0 if p_cum else np.nan

        M = cand.get("shares_before")
        N = cand.get("shares_increase")
        S = cand.get("subscription_price")
        currency = str(cand.get("subscription_currency") or "EGP").strip().upper()
        not_applicable = str(cand.get("not_applicable_reason") or "").strip()
        status = not_applicable if not_applicable else "ok"
        notes = (
            "Official terms exist but the event is not applicable to all shareholders; "
            "no price adjustment is applied. See addendum parse_notes."
            if not_applicable
            else ""
        )
        factor_theoretical = np.nan
        applied_factor = 1.0
        factor_source = ""
        expected_ret = np.nan
        diff = np.nan
        adjusted_if_applied = np.nan
        s_egp = np.nan

        if not_applicable:
            s_egp = S if currency != "USD" else np.nan
        elif pd.isna(M) or pd.isna(N) or pd.isna(S) or float(M) <= 0 or float(N) <= 0:
            status = "missing_terms"
            notes = "Official terms incomplete."
        else:
            M, N, S = float(M), float(N), float(S)
            if currency == "USD":
                earlier = fx[fx.index <= cum_date]
                if earlier.empty:
                    status = "missing_fx"
                    notes = "Subscription price is in USD and no USD/EGP rate is available."
                else:
                    s_egp = S * float(earlier.iloc[-1])
                    notes = f"USD subscription converted at {float(earlier.iloc[-1]):.4f} EGP/USD."
            else:
                s_egp = S
            if status == "ok":
                terp = (M * p_cum + N * s_egp) / (M + N)
                factor_theoretical = terp / p_cum if p_cum else np.nan
                if not np.isfinite(factor_theoretical) or factor_theoretical <= 0.05:
                    status = "check_factor"
                    notes = "Theoretical factor outside the expected (0.05, 1.0] range."
                elif factor_theoretical > 1.0:
                    status = "out_of_the_money"
                    notes = "Rights subscription price is above the cum-rights price; factor capped at 1.0."
                    factor_theoretical = 1.0
                else:
                    expected_ret = factor_theoretical - 1.0
                    diff = raw_ret - expected_ret
                    # Geometric test: the residual return after applying the
                    # theoretical factor must be small.  A percentage-point
                    # difference is misleading when the factor is far from 1.
                    adjusted_if_applied = (1.0 + raw_ret) / factor_theoretical - 1.0
                    if raw_ret < 0 and abs(adjusted_if_applied) <= CONSISTENCY_TOL:
                        status = "adjusted_consistent"
                        applied_factor = factor_theoretical
                        factor_source = "theoretical"
                    elif raw_ret < 0 and CONSISTENCY_TOL < adjusted_if_applied <= 0.15:
                        status = "partial_drop_not_adjusted"
                        notes = (
                            "Observed ex-date drop leaves a residual of "
                            f"{adjusted_if_applied * 100:.1f}% after the theoretical factor; "
                            "left unchanged to avoid over-adjustment."
                        )
                    elif raw_ret >= 0:
                        status = "already_adjusted_no_drop"
                        notes = (
                            "No negative ex-date drop; the raw series already appears adjusted "
                            "(or the event was not dilutive at the market price)."
                        )
                    else:
                        status = "already_adjusted_or_inconsistent"
                        notes = (
                            "Observed ex-date drop is inconsistent with the theoretical factor "
                            f"(residual {adjusted_if_applied * 100:.1f}%); left unchanged."
                        )

        rows.append(
            {
                "symbol": sym,
                "mub_date": mub_date.date().isoformat(),
                "official_published": cand.get("published_cairo"),
                "official_code": cand.get("source_code"),
                "official_entitled_till": cand["entitled_till"].date().isoformat(),
                "official_section": cand.get("section"),
                "official_heading": cand.get("heading"),
                "cum_date": cum_date.date().isoformat(),
                "ex_date": ex_date.date().isoformat(),
                "subscription_price": S,
                "subscription_currency": currency,
                "subscription_price_egp": s_egp,
                "shares_before": M,
                "shares_increase": N,
                "rights_ratio_new_per_old": (float(N) / float(M)) if (pd.notna(M) and pd.notna(N) and float(M)) else np.nan,
                "p_cum": p_cum,
                "p_ex": p_ex,
                "raw_ex_return": raw_ret,
                "factor_observed": (1.0 + raw_ret) if np.isfinite(raw_ret) else np.nan,
                "expected_ex_return": expected_ret,
                "return_diff": diff,
                "adjusted_return_if_applied": adjusted_if_applied,
                "factor_theoretical": factor_theoretical,
                "applied_factor": applied_factor,
                "factor_source": factor_source,
                "status": status,
                "notes": notes,
            }
        )

    factors = pd.DataFrame(rows)
    factors_path = out / "rights_adjustment_factors_2022_2026_2026_10_31.csv"
    factors.to_csv(factors_path, index=False, encoding="utf-8-sig")

    # Build the adjusted panel.  Only events with a factor strictly below 1.0
    # and status adjusted_consistent are applied.  Volume is put on a
    # post-rights share basis for those events: V_adj = V * (M+N)/M.
    adj = raw.copy()
    for c in ["prev_close", "high", "low", "close"]:
        adj[c] = adj[c].astype(float)
    adj["volume_adj"] = adj["volume"].astype(float)
    applied = factors[factors["status"].eq("adjusted_consistent")].copy()
    applied["cum_date"] = pd.to_datetime(applied["cum_date"])
    applied["applied_factor"] = pd.to_numeric(applied["applied_factor"], errors="coerce")
    applied = applied.dropna(subset=["applied_factor"]).sort_values(["symbol", "cum_date"])
    for sym, evs in applied.groupby("symbol"):
        mask_sym = adj["symbol"].eq(sym)
        for _, ev in evs.iterrows():
            mask = mask_sym & (adj["date"] <= ev["cum_date"])
            for c in ["prev_close", "high", "low", "close"]:
                adj.loc[mask, c] = adj.loc[mask, c] * float(ev["applied_factor"])
            share_ratio = (float(ev["shares_before"]) + float(ev["shares_increase"])) / float(ev["shares_before"])
            adj.loc[mask, "volume_adj"] = adj.loc[mask, "volume_adj"] * share_ratio
    adj_path = out / "mubasher_daily_rights_adjusted_2022_2026_2026_10_31.parquet"
    adj.to_parquet(adj_path, index=False)

    # Validation: raw vs adjusted close-to-close return on the ex-date for
    # every matched event, plus a separate check on the applied events.
    checks = []
    for _, ev in factors[factors["official_entitled_till"].notna()].iterrows():
        sym = ev["symbol"]
        cum = pd.to_datetime(ev["cum_date"])
        g = raw[raw["symbol"].eq(sym)].sort_values("date")
        nxt = g[g["date"] > cum]
        cur = g[g["date"] <= cum]
        if nxt.empty or cur.empty:
            continue
        d0 = cur.iloc[-1]["date"]
        d1 = nxt.iloc[0]["date"]
        raw_ret = g.loc[g["date"].eq(d1), "close"].iloc[0] / g.loc[g["date"].eq(d0), "close"].iloc[0] - 1.0
        a = adj[adj["symbol"].eq(sym)]
        adj_ret = a.loc[a["date"].eq(d1), "close"].iloc[0] / a.loc[a["date"].eq(d0), "close"].iloc[0] - 1.0
        applied_event = ev["status"] == "adjusted_consistent"
        checks.append(
            {
                "symbol": sym,
                "cum_date": d0.date().isoformat(),
                "ex_date": d1.date().isoformat(),
                "status": ev["status"],
                "applied": bool(applied_event),
                "applied_factor": float(ev["applied_factor"]),
                "raw_return_pct": raw_ret * 100.0,
                "adjusted_return_pct": adj_ret * 100.0,
                "raw_abs_gt_15": bool(abs(raw_ret) > 0.15),
                "adjusted_abs_gt_15": bool(abs(adj_ret) > 0.15),
            }
        )
    checks_df = pd.DataFrame(checks)
    checks_path = out / "rights_adjustment_validation_2026_10_31.csv"
    checks_df.to_csv(checks_path, index=False, encoding="utf-8-sig")

    summary = {
        "mubasher_rights_events": int(len(mub)),
        "official_rights_rows": int(len(off)),
        "official_rights_base_rows": int(off_base_rows),
        "official_rights_addendum_rows": int(add_rows),
        "not_applicable_events": int(factors["status"].isin(["restricted_offering_non_selling_shareholders_waived"]).sum()),
        "matched_events": int(factors["official_entitled_till"].notna().sum()),
        "unmatched_events": int(factors["status"].eq("unmatched_official_terms").sum()),
        "status_counts": factors["status"].value_counts().to_dict(),
        "applied_events": int(len(applied)),
        "applied_symbols": sorted(applied["symbol"].unique().tolist()),
        "factor_theoretical_min": float(factors["factor_theoretical"].min()) if factors["factor_theoretical"].notna().any() else None,
        "factor_theoretical_median": float(factors["factor_theoretical"].median()) if factors["factor_theoretical"].notna().any() else None,
        "factor_theoretical_max": float(factors["factor_theoretical"].max()) if factors["factor_theoretical"].notna().any() else None,
        "applied_factor_min": float(applied["applied_factor"].min()) if len(applied) else None,
        "applied_factor_median": float(applied["applied_factor"].median()) if len(applied) else None,
        "applied_factor_max": float(applied["applied_factor"].max()) if len(applied) else None,
        "matched_raw_jumps_gt_15pct": int(checks_df["raw_abs_gt_15"].sum()) if not checks_df.empty else 0,
        "matched_adjusted_jumps_gt_15pct": int(checks_df["adjusted_abs_gt_15"].sum()) if not checks_df.empty else 0,
        "applied_events_abs_gt_15pct": (
            int(checks_df.loc[checks_df["applied"], "adjusted_abs_gt_15"].sum())
            if not checks_df.empty
            else 0
        ),
        "adjusted_rows": int(len(adj)),
        "adjusted_symbols": int(adj["symbol"].nunique()),
        "consistency_tolerance_pp": CONSISTENCY_TOL * 100.0,
        "note": (
            "The Mubasher raw daily panel already appears adjusted for most rights/bonus events "
            "(no ex-date drop).  The theoretical TERP factor is applied only when the observed "
            "ex-date drop is negative and the residual return after applying the factor is within "
            "5% (geometric test); otherwise the raw series is left unchanged and the event is "
            "labelled.  Out-of-the-money rights are capped at 1.0.  Unmatched/incomplete events "
            "are not guessed.  This adjusts rights only; cash dividends and bonus/split actions "
            "are separate."
        ),
        "generated_at_utc": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (out / "rights_adjustment_summary_2026_10_31.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", factors_path)
    print("wrote", adj_path)
    print("wrote", checks_path)


if __name__ == "__main__":
    main()
