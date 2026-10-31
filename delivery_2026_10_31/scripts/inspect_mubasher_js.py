# -*- coding: utf-8 -*-
import re
import requests
from pathlib import Path

u = "https://www.mubasher.info/assets/ui/main.min.js"
r = requests.get(
    u,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
    },
    timeout=60,
)
print("status", r.status_code, "len", len(r.text))
p = Path("deliverables_2026_10_31/tmp_main.min.js")
p.write_text(r.text, encoding="utf-8")
for term in ["PagedTableController", "corporate-actions", "targetApiUrl", "apiBaseUrl", "st-pipe", "fetch"]:
    print("=" * 30, term)
    for m in re.finditer(re.escape(term), r.text):
        print(r.text[max(0, m.start() - 700) : m.start() + 1000])
        print("-" * 60)
        break
