# -*- coding: utf-8 -*-
import re
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.8",
}
for u in [
    "https://www.mubasher.info/countries/eg/ipos/capital-increase",
    "https://www.mubasher.info/markets/EGX/stocks/COMI/corporate-action",
    "https://www.mubasher.info/markets/EGX/stocks/COMI/ipos",
    "https://www.mubasher.info/markets/EGX/stocks/COMI/insider-trades",
]:
    r = requests.get(u, headers=HEADERS, timeout=40)
    print("=" * 100)
    print(u, r.status_code, len(r.text))
    for m in re.finditer(r'src="([^"]*?/api/1/[^"]*)"', r.text):
        print("src", m.group(1))
    for m in re.finditer(r'ng-controller="([^"]+)"[^>]*src="([^"]+)"', r.text):
        print("controller", m.group(1), "src", m.group(2))
