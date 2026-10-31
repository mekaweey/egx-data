# -*- coding: utf-8 -*-
"""Build the final Mubasher news package: unique articles, links, coverage, metadata."""
from __future__ import annotations

import json
import zipfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
NEWS_DIR = ROOT / "deliverables_2026_10_31" / "news"
FULL = NEWS_DIR / "mubasher_news_full_2026_10_31.csv"
PARTS = ROOT / "strategy-lab" / "outputs" / "mubasher_news_parts"
ALL_SYMS = ROOT / "strategy-lab" / "outputs" / "all_symbols_2026_10_31.txt"


def main() -> None:
    df = pd.read_csv(FULL)
    df["published_utc"] = pd.to_datetime(df["published_utc"], utc=True, errors="coerce")
    # published_cairo carries mixed +02:00/+03:00 offsets; keep it as text.
    df["category"] = df["category"].fillna("غير مصنف").replace("", "غير مصنف")
    df = df.sort_values(["published_utc", "symbol", "news_id"]).reset_index(drop=True)

    # One row per article, with all linked symbols.
    def join_unique(values: pd.Series) -> str:
        return ",".join(sorted({str(v) for v in values if pd.notna(v)}))

    unique = (
        df.groupby("news_id", as_index=False)
        .agg(
            published_utc=("published_utc", "first"),
            published_cairo=("published_cairo", "first"),
            category=("category", "first"),
            title=("title", "first"),
            first_paragraph=("first_paragraph", "first"),
            url=("url", "first"),
            symbols=("symbol", join_unique),
            n_symbols=("symbol", "nunique"),
        )
        .sort_values("published_utc")
    )
    unique.to_csv(NEWS_DIR / "mubasher_news_unique_2026_10_31.csv", index=False, encoding="utf-8-sig")

    links = df[["symbol", "news_id", "published_utc", "category", "title", "url"]].copy()
    links.to_csv(NEWS_DIR / "mubasher_news_symbol_links_2026_10_31.csv", index=False, encoding="utf-8-sig")

    coverage = (
        df.groupby("symbol")
        .agg(
            rows=("news_id", "size"),
            unique_news=("news_id", "nunique"),
            first_utc=("published_utc", "min"),
            last_utc=("published_utc", "max"),
            categories=("category", lambda s: s.nunique()),
        )
        .reset_index()
        .sort_values("rows", ascending=False)
    )
    coverage.to_csv(NEWS_DIR / "news_symbol_coverage_2026_10_31.csv", index=False, encoding="utf-8-sig")

    cats = df.groupby("category", dropna=False).size().reset_index(name="rows").sort_values("rows", ascending=False)
    cats.to_csv(NEWS_DIR / "news_category_counts_2026_10_31.csv", index=False, encoding="utf-8-sig")

    years = df.groupby(df.published_utc.dt.year).size().reset_index(name="rows")
    years.columns = ["year", "rows"]
    years.to_csv(NEWS_DIR / "news_year_counts_2026_10_31.csv", index=False, encoding="utf-8-sig")

    # Requested symbols, aliases, and unresolved pages.
    requested = [s.strip().upper() for s in ALL_SYMS.read_text(encoding="utf-8").splitlines() if s.strip()]
    present = set(df.symbol.astype(str).str.upper())
    aliases = pd.DataFrame(
        [
            ("AIH", "AIHC", "resolved_alias", "Mubasher uses AIHC for Arabia Investments Holding; AIH page returns 500"),
            ("LKGP", "HCFI", "resolved_alias", "Lakah Group is HCFI on Mubasher; LKGP page returns 500"),
            ("EIUD", "GPIM", "resolved_alias", "GPI Urban Growth is GPIM on Mubasher; EIUD page returns 500"),
            ("GOUR", "", "unresolved", "Gourmet Egypt listed Jan 2026; Mubasher per-company news page returns 500 and search returns no EGX match"),
            ("AMII", "", "unresolved", "No EGX Mubasher company page; companySearch returns only MSM (Oman) AMII"),
        ],
        columns=["requested_symbol", "mubasher_symbol", "status", "note"],
    )
    aliases.to_csv(NEWS_DIR / "news_symbol_aliases_2026_10_31.csv", index=False, encoding="utf-8-sig")

    (NEWS_DIR / "news_symbols_2026_10_31.txt").write_text(
        "\n".join(sorted(present)) + "\n", encoding="utf-8"
    )
    (NEWS_DIR / "requested_symbols_2026_10_31.txt").write_text(
        "\n".join(requested) + "\n", encoding="utf-8"
    )

    # Compressed copies.
    df.to_csv(NEWS_DIR / "mubasher_news_full_2026_10_31.csv.gz", index=False, encoding="utf-8-sig", compression="gzip")
    unique.to_csv(NEWS_DIR / "mubasher_news_unique_2026_10_31.csv.gz", index=False, encoding="utf-8-sig", compression="gzip")

    # Zip the corrected per-symbol parts for reproducibility.
    with zipfile.ZipFile(NEWS_DIR / "mubasher_news_parts_corrected_2026_10_31.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(PARTS.glob("*.csv")):
            z.write(p, arcname=p.name)

    # Metadata.
    meta = {
        "source": "Mubasher per-company news pages",
        "scraped_at_utc": "2026-10-31",
        "rows_symbol_article_links": int(len(df)),
        "unique_articles": int(len(unique)),
        "symbols": int(df.symbol.nunique()),
        "requested_symbols": len(requested),
        "present_symbols": len(present),
        "date_min_utc": str(df.published_utc.min()),
        "date_max_utc": str(df.published_utc.max()),
        "null_published_utc": int(df.published_utc.isna().sum()),
        "null_first_paragraph": int(df.first_paragraph.isna().sum()),
        "empty_first_paragraph": int((df.first_paragraph.fillna("").astype(str).str.strip() == "").sum()),
        "null_url": int(df.url.isna().sum()),
        "duplicate_symbol_news_links": int(df.duplicated(["symbol", "news_id"]).sum()),
        "categories": int(df.category.nunique(dropna=False)),
        "rows_by_year": {str(int(k)): int(v) for k, v in years.set_index("year")["rows"].items()},
        "aliases": aliases.to_dict(orient="records"),
        "timestamp_verification": {
            "old_snapshot_rows": 5810,
            "old_unique_ids": 5810,
            "old_ids_found_in_new": 5566,
            "old_ids_missing_from_new_general_news": 244,
            "exact_timestamp_matches": 5559,
            "title_url_mismatches": 1,
            "note": "The displayed list time is Cairo local; the first scraper subtracted one hour by mistake. Rebuilt from published_list_dt.",
        },
        "caveats": [
            "first_paragraph is the free list excerpt; paid articles may be truncated with an ellipsis and the full body is not available without a Mubasher subscription.",
            "GOUR and AMII have no usable Mubasher EGX news page; AIH/LKGP/EIUD are aliases of AIHC/HCFI/GPIM.",
            "News ends 2026-10-29; 2026-10-30/31 are weekend days.",
            "One old snapshot article (id 4659336) has a different title/URL in the per-company page (H1 vs Q1 wording); timestamp is identical.",
        ],
    }
    (NEWS_DIR / "news_metadata_2026_10_31.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    readme = f"""# حزمة أخبار مباشر — البورصة المصرية

- تاريخ السحب: ٣١ أكتوبر ٢٠٢٦.
- المصدر: صفحات أخبار الشركات في مباشر.
- عدد الصفوف (ربط سهم-خبر): {len(df):,}.
- عدد الأخبار الفريدة: {len(unique):,}.
- عدد الرموز: {df.symbol.nunique()}.
- المدى الزمني: {df.published_utc.min()} إلى {df.published_utc.max()} (UTC).
- لا توجد قيم ناقلة في الوقت أو الرابط أو الفقرة الأولى (لكن بعض الفقرات قد تكون مقطوعة).

## الملفات

- `mubasher_news_full_2026_10_31.csv`: كل ربط سهم-خبر (صف لكل سهم لكل خبر).
- `mubasher_news_unique_2026_10_31.csv`: خبر واحد لكل صف، مع قائمة الرموز المرتبطة به.
- `mubasher_news_symbol_links_2026_10_31.csv`: جدول ربط مبسط.
- `news_symbol_coverage_2026_10_31.csv`: تغطية كل رمز.
- `news_category_counts_2026_10_31.csv`: توزيع التصنيفات.
- `news_year_counts_2026_10_31.csv`: توزيع السنوات.
- `news_symbol_aliases_2026_10_31.csv`: الرموز البديلة وغير المحلولة.
- `verification_vs_old_snapshot_2026_10_31.csv`: التحقق مقابل ملف مباشر العام القديم.
- `mubasher_news_parts_corrected_2026_10_31.zip`: الأجزاء الخام المصححة لكل رمز.
- `news_metadata_2026_10_31.json`: البيانات الوصفية.

## الأعمدة

- `symbol`: رمز السهم في مباشر.
- `news_id`: معرف الخبر.
- `published_list_raw`: الوقت كما ظهر في القائمة.
- `published_list_dt`: الوقت الظاهر كوقت محلي بالقاهرة (بدون منطقة زمنية).
- `published_cairo`: وقت القاهرة مع الإزاحة.
- `published_utc`: وقت UTC.
- `category`: تصنيف الخبر.
- `title`: العنوان.
- `first_paragraph`: الفقرة الأولى/المقتطف المجاني.
- `url`: رابط الخبر.
- `page`: صفحة القائمة.

## التحقق الزمني

الوقت الظاهر في القائمة هو وقت القاهرة المحلي. النسخة الأولى من الساحب طرحت ساعة بالخطأ، ثم أُعيد بناء كل الأوقات من `published_list_dt`. مقابل ملف مباشر العام القديم:

- ٥٥٥٩ معرفاً تطابق وقتها بالثانية.
- معرف واحد (4659336) وقته مطابق لكن العنوان/الرابط يختلفان (النصف الأول مقابل الربع الأول).
- ٢٤٤ خبراً عاماً قديماً غير موجود في صفحات الشركات لأنه غير مرتبط بسهم.

## القيود

- الفقرة الأولى هي مقتطف القائمة المجاني، وليست النص الكامل. الأخبار المدفوعة قد تنتهي بعلامة «…» ولا يمكن جلب نصها الكامل بدون اشتراك.
- `GOUR` (جورميه) ليس لها صفحة أخبار عاملة على مباشر، و`AMII` ليس لها صفحة في البورصة المصرية. `AIH` و`LKGP` و`EIUD` رموز قديمة تقابل `AIHC` و`HCFI` و`GPIM`.
- آخر خبر ٢٩ أكتوبر ٢٠٢٦؛ يوم ٣٠ و٣١ أكتوبر نهاية أسبوع.
"""
    (NEWS_DIR / "news_readme_ar.md").write_text(readme, encoding="utf-8")

    print("rows", len(df), "unique", len(unique), "symbols", df.symbol.nunique())
    print("date", df.published_utc.min(), df.published_utc.max())
    print("null utc", int(df.published_utc.isna().sum()), "null para", int(df.first_paragraph.isna().sum()), "null url", int(df.url.isna().sum()))
    print("categories", df.category.nunique(dropna=False))
    print("wrote package to", NEWS_DIR)


if __name__ == "__main__":
    main()
