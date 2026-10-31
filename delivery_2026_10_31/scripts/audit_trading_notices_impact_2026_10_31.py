# -*- coding: utf-8 -*-
"""Estimate how many 14:00 entries official Trading Notices would block.

This is an impact audit, not a new strategy result.  It merges the parsed
suspension/resume timeline with the saved S6-14:00 candidate ledger and counts
candidate rows whose 14:00 decision time falls inside a halt.

Two bounds are reported:
  * content: suspension start = max(publication, effective); end = content
    resume time when it is after the start, otherwise publication time.
  * publication: end = resume publication time.  This is more conservative and
    over-blocks when a resume notice was published late.

Rows with inconsistent resume-before-suspension times are counted and shown.
"""
from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
NOTICES = DATA / "egx_official" / "official_trading_notices_parsed_2022_2026_2026_10_31.csv"
CANDIDATES = ROOT / "strategy-audit" / "data_derived" / "signals_all_candidates.csv"
OUT = DATA / "egx_official" / "official_trading_notices_impact_2026_10_31.json"
CAIRO = ZoneInfo("Africa/Cairo")


def main() -> None:
    n = pd.read_csv(NOTICES)
    n["published_cairo"] = pd.to_datetime(n["published_cairo"], errors="coerce", utc=True).dt.tz_convert(CAIRO)
    n["effective_datetime_cairo"] = pd.to_datetime(n["effective_datetime_cairo"], errors="coerce", utc=True).dt.tz_convert(CAIRO)
    n["resume_datetime_cairo"] = pd.to_datetime(n["resume_datetime_cairo"], errors="coerce", utc=True).dt.tz_convert(CAIRO)

    susp = n[n["event_type"].eq("suspension")].copy()
    res = n[n["event_type"].eq("resume")].copy()
    res_by_code = res.set_index("notice_code")

    intervals = []
    for _, s in susp.iterrows():
        start = max(s["published_cairo"], s["effective_datetime_cairo"])
        pair = s["paired_notice_code"]
        end_content = pd.NaT
        end_pub = pd.NaT
        if pd.notna(pair) and str(pair).strip() != "":
            r = res_by_code.loc[int(pair)]
            end_content = r["resume_datetime_cairo"]
            end_pub = r["published_cairo"]
        if pd.isna(end_content) or end_content <= start:
            end_content = end_pub if pd.notna(end_pub) and end_pub > start else start
        if pd.isna(end_pub) or end_pub <= start:
            end_pub = end_content
        intervals.append(
            {
                "symbol": s["symbol"],
                "notice_code": int(s["notice_code"]),
                "start": start,
                "end_content": end_content,
                "end_pub": end_pub,
                "unresolved": bool(str(s["unresolved"]).strip().lower() == "true"),
                "resume_before_start": bool(
                    pd.notna(end_content) and pd.notna(s["resume_datetime_cairo"]) and s["resume_datetime_cairo"] < start
                ),
                "heading": s["heading"],
            }
        )
    iv = pd.DataFrame(intervals)

    c = pd.read_csv(CANDIDATES)
    c["date"] = pd.to_datetime(c["date"])
    c = c[c["selected"].astype(str).str.lower().eq("true")].copy()
    c["decision"] = c["date"].apply(lambda d: pd.Timestamp(d).tz_localize(CAIRO) + timedelta(hours=14))
    c = c[["date", "symbol", "score", "rank", "decision"]]

    hits_content = []
    hits_pub = []
    for _, row in c.iterrows():
        sub = iv[iv["symbol"].eq(row["symbol"])]
        if sub.empty:
            continue
        for _, z in sub.iterrows():
            if z["start"] <= row["decision"] < z["end_content"]:
                hits_content.append((row["date"], row["symbol"], z["notice_code"], z["heading"]))
                break
        for _, z in sub.iterrows():
            if z["start"] <= row["decision"] < z["end_pub"]:
                hits_pub.append((row["date"], row["symbol"], z["notice_code"], z["heading"]))
                break

    out = {
        "candidates_selected": int(len(c)),
        "candidate_dates": int(c["date"].nunique()),
        "candidate_symbols": int(c["symbol"].nunique()),
        "halt_intervals": int(len(iv)),
        "unresolved_intervals": int(iv["unresolved"].sum()),
        "resume_before_start_intervals": int(iv["resume_before_start"].sum()),
        "blocked_content": int(len(hits_content)),
        "blocked_publication": int(len(hits_pub)),
        "blocked_content_pct": round(100 * len(hits_content) / len(c), 4) if len(c) else None,
        "blocked_publication_pct": round(100 * len(hits_pub) / len(c), 4) if len(c) else None,
        "examples_content": [
            {"date": str(d.date()), "symbol": s, "notice_code": int(code), "heading": h}
            for d, s, code, h in hits_content[:20]
        ],
        "examples_publication": [
            {"date": str(d.date()), "symbol": s, "notice_code": int(code), "heading": h}
            for d, s, code, h in hits_pub[:20]
        ],
        "note": (
            "Impact audit only. The candidate ledger is the saved S6-14:00 selected set, "
            "not a fresh backtest. A blocked row means a 14:00 entry would have coincided "
            "with an official suspension; it does not estimate the P&L effect."
        ),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
