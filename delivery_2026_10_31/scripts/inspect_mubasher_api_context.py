# -*- coding: utf-8 -*-
import re
import requests

u = "https://www.mubasher.info/countries/eg/corporate-action"
html = requests.get(
    u,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
    },
    timeout=40,
).text
for term in ["apiBaseUrl", "api-community", "api.tadawuly", "corporate-actions", "apiUrlMapping", "targetApiUrl"]:
    print("=" * 30, term)
    for m in re.finditer(re.escape(term), html):
        print(html[max(0, m.start() - 500) : m.start() + 700])
        print("-" * 60)
        break
