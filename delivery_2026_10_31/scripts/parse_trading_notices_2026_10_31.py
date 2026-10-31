# -*- coding: utf-8 -*-
"""Parse official EGX Trading Notices into suspension/resume intervals.

The official disclosures file has a `Trading Notices` section with 979 rows
(2022-01-02..2026-10-29).  Most are suspension/resume notices; a few are other
trading notices.  This script:

1. classifies each notice as suspension / resume / other,
2. extracts the symbol and the effective/resume datetime where the text gives
   one (otherwise falls back to the publication time),
3. pairs each suspension with the next resume for the same symbol,
4. writes an auditable CSV and a summary JSON.

It does not modify the source disclosures and does not place orders.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, time
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
DEFAULT_SRC = DATA / "egx_official" / "egx_official_disclosures_2022_2026_2026_10_31.csv"
DEFAULT_OUT = DATA / "egx_official" / "official_trading_notices_parsed_2022_2026_2026_10_31.csv"
DEFAULT_SUMMARY = DATA / "egx_official" / "official_trading_notices_summary_2026_10_31.json"
DEFAULT_FEATURES = ROOT / "strategy-audit" / "data_derived" / "features_v3_71.parquet"

CAIRO = ZoneInfo("Africa/Cairo")
MARKET_OPEN = time(9, 30)
CUTOFF = time(14, 0)

SYMBOL_RE = re.compile(r"\(([A-Z0-9_]{2,12})\.CA\)", re.I)
DATE_RE = re.compile(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b")
TIME_RE = re.compile(r"\b(\d{1,2}):(\d{2})\s*([AP]M)\b", re.I)


def classify(heading: str) -> str:
    h = (heading or "").lower()
    if "continuation" in h and ("suspend" in h or "suspension" in h):
        return "suspension_continuation"
    if "suspend" in h or "suspension" in h or "stop trading" in h:
        return "suspension"
    if "resume" in h or "resumption" in h or "reopen" in h:
        return "resume"
    return "other"


def extract_symbol(row: pd.Series) -> str:
    sym = str(row.get("reuters_code") or "").strip().upper()
    if sym and sym.lower() != "nan":
        return sym
    m = SYMBOL_RE.search(str(row.get("heading") or ""))
    return m.group(1).upper() if m else ""


def parse_effective_date(text: str, published: datetime) -> tuple[datetime | None, str]:
    """Pick the content date closest to the publication date.

    Content dates are mostly DD/MM/YYYY, but at least one notice uses
    MM/DD/YYYY.  We parse both and choose the one within +/- 10 days of the
    publication date; if both are equally close, prefer day-first.
    """
    candidates: list[tuple[datetime, str]] = []
    for m in DATE_RE.finditer(text or ""):
        a, b, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        for dayfirst, label in ((True, "day_first"), (False, "month_first")):
            try:
                if dayfirst:
                    dt = datetime(y, b, a, tzinfo=CAIRO)
                else:
                    dt = datetime(y, a, b, tzinfo=CAIRO)
            except ValueError:
                continue
            delta = abs((dt.date() - published.date()).days)
            if delta <= 10:
                candidates.append((dt, label))
    if not candidates:
        return None, "no_content_date"
    # Prefer day-first on ties; otherwise the closest date.
    candidates.sort(key=lambda x: (abs((x[0].date() - published.date()).days), 0 if x[1] == "day_first" else 1))
    dt, label = candidates[0]
    note = label
    if len({c[0].date() for c in candidates}) > 1:
        note += "_ambiguous"
    return dt, note


def parse_time(text: str) -> time | None:
    m = TIME_RE.search(text or "")
    if not m:
        return None
    hour, minute, ampm = int(m.group(1)), int(m.group(2)), m.group(3).upper()
    if hour == 12:
        hour = 0
    if ampm == "PM":
        hour += 12
    if hour > 23 or minute > 59:
        return None
    return time(hour, minute)


def at_time(dt: datetime, t: time | None, default: time) -> datetime:
    return dt.replace(hour=(t or default).hour, minute=(t or default).minute, second=0, microsecond=0)


def reason_text(text: str) -> str:
    s = re.sub(r"\s+", " ", str(text or "")).strip()
    # Keep the human reason, not the repeated company/ISIN header.
    m = re.search(r"Content\s*:\s*(.+)$", s, re.I)
    if m:
        s = m.group(1).strip()
    return s[:500]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=str(DEFAULT_SRC))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--summary", default=str(DEFAULT_SUMMARY))
    ap.add_argument("--features", default=str(DEFAULT_FEATURES))
    args = ap.parse_args()

    usecols = ["code", "published_cairo", "published_utc", "heading", "section", "reuters_code", "content_text"]
    df = pd.read_csv(args.source, usecols=usecols)
    tn = df[df["section"].eq("Trading Notices")].copy()
    tn["published_cairo"] = pd.to_datetime(tn["published_cairo"], errors="coerce", utc=True).dt.tz_convert(CAIRO)
    tn["published_utc"] = pd.to_datetime(tn["published_utc"], errors="coerce", utc=True)
    tn = tn.dropna(subset=["published_cairo"]).sort_values(["published_cairo", "code"]).reset_index(drop=True)

    records: list[dict] = []
    for _, row in tn.iterrows():
        heading = str(row["heading"] or "")
        text = str(row["content_text"] or "")
        event_type = classify(heading)
        symbol = extract_symbol(row)
        published = row["published_cairo"].to_pydatetime()
        eff_date, date_note = parse_effective_date(text, published)
        resume_time = parse_time(text) if event_type == "resume" else None
        # For suspension, the notice usually says "effective DD/MM/YYYY" without
        # a time.  Use market open on that date unless the notice was published
        # intraday on the same date, in which case the publication time is the
        # earliest defensible halt time.
        if event_type == "suspension":
            if eff_date is None:
                eff_dt = published
                date_note = "no_content_date_use_published"
            elif eff_date.date() == published.date() and published.time() > MARKET_OPEN:
                eff_dt = published
                date_note += "_intraday_published"
            else:
                eff_dt = at_time(eff_date, None, MARKET_OPEN)
            resume_dt = None
        elif event_type == "resume":
            if eff_date is None:
                eff_dt = published
                date_note = "no_content_date_use_published"
            else:
                eff_dt = at_time(eff_date, resume_time, published.time())
            resume_dt = eff_dt
        else:
            eff_dt = published
            resume_dt = None

        records.append(
            {
                "notice_code": int(row["code"]),
                "symbol": symbol,
                "event_type": event_type,
                "published_cairo": published.isoformat(),
                "published_utc": row["published_utc"].isoformat() if pd.notna(row["published_utc"]) else "",
                "effective_datetime_cairo": eff_dt.isoformat() if eff_dt else "",
                "resume_datetime_cairo": resume_dt.isoformat() if resume_dt else "",
                "heading": heading,
                "reason": reason_text(text),
                "date_parse_note": date_note,
                "paired_notice_code": "",
                "halt_calendar_days": "",
                "halt_sessions": "",
                "unresolved": "",
            }
        )

    out = pd.DataFrame(records)
    # These columns start as empty strings but later hold ints/bools.
    for c in ["paired_notice_code", "halt_calendar_days", "halt_sessions", "unresolved"]:
        out[c] = out[c].astype(object)
    # A suspension with no parsed symbol cannot be paired safely.
    out.loc[
        out["event_type"].eq("suspension") & out["symbol"].fillna("").astype(str).str.strip().eq(""),
        "unresolved",
    ] = True
    # Pair suspensions with the next resume for the same symbol.
    out = out.sort_values(["symbol", "published_cairo", "notice_code"]).reset_index(drop=True)
    open_suspensions: dict[str, list[int]] = {}
    for idx, row in out.iterrows():
        if not row["symbol"]:
            continue
        if row["event_type"] == "suspension":
            stack = open_suspensions.setdefault(row["symbol"], [])
            if stack:
                # A repeated suspension notice while the stock is already
                # halted is a continuation, not a new interval.
                out.at[idx, "event_type"] = "suspension_continuation"
                out.at[idx, "unresolved"] = False
                out.at[idx, "date_parse_note"] = (str(out.at[idx, "date_parse_note"]) + "_continuation_duplicate").strip("_")
            else:
                stack.append(idx)
        elif row["event_type"] == "suspension_continuation":
            out.at[idx, "unresolved"] = False
        elif row["event_type"] == "resume":
            stack = open_suspensions.get(row["symbol"], [])
            if stack:
                s_idx = stack.pop(0)
                out.at[s_idx, "paired_notice_code"] = int(row["notice_code"])
                out.at[idx, "paired_notice_code"] = int(out.at[s_idx, "notice_code"])
                start = pd.Timestamp(out.at[s_idx, "effective_datetime_cairo"])
                end = pd.Timestamp(row["effective_datetime_cairo"])
                if end < start:
                    end = pd.Timestamp(row["published_cairo"])
                    out.at[s_idx, "date_parse_note"] = (
                        str(out.at[s_idx, "date_parse_note"]) + "_resume_before_start_use_published_end"
                    ).strip("_")
                out.at[s_idx, "halt_calendar_days"] = max(0, (end.date() - start.date()).days)
                out.at[s_idx, "unresolved"] = False
            else:
                out.at[idx, "date_parse_note"] = (str(out.at[idx, "date_parse_note"]) + "_orphan_resume").strip("_")
    for sym, stack in open_suspensions.items():
        for s_idx in stack:
            out.at[s_idx, "unresolved"] = True

    # Session counts from the 71-symbol feature calendar (unique trading dates).
    sessions: list[pd.Timestamp] = []
    if Path(args.features).exists():
        try:
            feat = pd.read_parquet(args.features, columns=["date"])
            sessions = sorted(pd.to_datetime(feat["date"].dropna().unique()))
        except Exception:
            sessions = []
    if sessions:
        sess = pd.Series(sessions)
        for idx, row in out.iterrows():
            if row["event_type"] != "suspension":
                continue
            if not str(row["symbol"]).strip():
                continue
            if str(row["unresolved"]).strip().lower() == "true":
                continue
            start = pd.Timestamp(row["effective_datetime_cairo"])
            pair = row["paired_notice_code"]
            if pd.isna(pair) or str(pair).strip() == "":
                end = pd.Timestamp.max.tz_localize(None)
            else:
                end = pd.Timestamp(out.loc[out["notice_code"].eq(int(pair)), "effective_datetime_cairo"].iloc[0])
            start_day = start.normalize().tz_localize(None)
            end_day = end.normalize().tz_localize(None)
            out.at[idx, "halt_sessions"] = int(((sess >= start_day) & (sess <= end_day)).sum())

    # Link continuation notices to the original suspension interval.
    cont = out[out["event_type"].eq("suspension_continuation")]
    for idx, row in cont.iterrows():
        prior = out[
            out["symbol"].eq(row["symbol"])
            & out["event_type"].eq("suspension")
            & (out["published_cairo"] <= row["published_cairo"])
            & out["paired_notice_code"].astype(str).str.strip().ne("")
        ]
        if not prior.empty:
            p = prior.iloc[-1]
            out.at[idx, "paired_notice_code"] = p["paired_notice_code"]
            out.at[idx, "halt_calendar_days"] = p["halt_calendar_days"]
            out.at[idx, "halt_sessions"] = p["halt_sessions"]
            out.at[idx, "date_parse_note"] = (
                str(out.at[idx, "date_parse_note"]) + f"_continuation_of_{int(p['notice_code'])}"
            ).strip("_")

    # Order columns for readability.
    cols = [
        "notice_code", "symbol", "event_type", "published_cairo", "published_utc",
        "effective_datetime_cairo", "resume_datetime_cairo", "paired_notice_code",
        "halt_calendar_days", "halt_sessions", "unresolved", "heading", "reason",
        "date_parse_note",
    ]
    out = out[cols].sort_values(["published_cairo", "notice_code"]).reset_index(drop=True)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False, encoding="utf-8-sig")

    susp = out[out["event_type"].eq("suspension")]
    cont = out[out["event_type"].eq("suspension_continuation")]
    res = out[out["event_type"].eq("resume")]
    other = out[~out["event_type"].isin(["suspension", "suspension_continuation", "resume"])]
    paired = susp[susp["paired_notice_code"].astype(str).str.strip().ne("")]
    unresolved = susp[susp["unresolved"].astype(str).str.lower().eq("true")]
    same_day = paired[paired["halt_calendar_days"].astype(str).eq("0")]
    summary = {
        "source": str(Path(args.source)),
        "output": str(Path(args.out)),
        "rows": int(len(out)),
        "suspensions": int(len(susp)),
        "suspension_continuations": int(len(cont)),
        "resumes": int(len(res)),
        "other_notices": int(len(other)),
        "symbols": int(out["symbol"].replace("", pd.NA).dropna().nunique()),
        "paired_suspensions": int(len(paired)),
        "unresolved_suspensions": int(len(unresolved)),
        "continuations_linked": int(cont["paired_notice_code"].astype(str).str.strip().ne("").sum()),
        "orphan_resumes": int(out["date_parse_note"].astype(str).str.contains("orphan_resume").sum()),
        "same_day_pairs": int(len(same_day)),
        "halt_calendar_days_median": float(paired["halt_calendar_days"].astype(float).median()) if len(paired) else None,
        "halt_calendar_days_max": int(paired["halt_calendar_days"].astype(float).max()) if len(paired) else None,
        "halt_sessions_median": float(paired["halt_sessions"].astype(float).median()) if len(paired) else None,
        "halt_sessions_max": int(paired["halt_sessions"].astype(float).max()) if len(paired) else None,
        "resume_time_parsed": int(res["effective_datetime_cairo"].astype(str).str.contains(r"T\d{2}:\d{2}").sum()),
        "suspension_date_from_content": int(susp["date_parse_note"].astype(str).str.contains("day_first|month_first").sum()),
        "date_parse_notes": out["date_parse_note"].value_counts().head(20).to_dict(),
        "top_longest": paired.sort_values("halt_calendar_days", ascending=False)[
            ["symbol", "published_cairo", "halt_calendar_days", "halt_sessions", "heading"]
        ].head(15).to_dict(orient="records"),
        "note": (
            "Official Trading Notices only. Times are Cairo local. Suspension start uses the "
            "content effective date at 09:30, or the publication time if the notice was published "
            "intraday on that date; resume uses the content time when present, otherwise the "
            "publication time. This is a halt/resume timeline, not a complete limit-up/down model."
        ),
        "generated_at_cairo": datetime.now(CAIRO).isoformat(),
    }
    Path(args.summary).write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
