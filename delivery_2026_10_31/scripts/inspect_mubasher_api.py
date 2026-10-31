# -*- coding: utf-8 -*-
import re
import requests
from bs4 import BeautifulSoup

u = "https://www.mubasher.info/countries/eg/corporate-action"
r = requests.get(
    u,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
    },
    timeout=40,
)
print("status", r.status_code, "len", len(r.text))
s = BeautifulSoup(r.text, "html.parser")
print("scripts:")
for sc in s.find_all("script", src=True):
    print(sc["src"])
print("\ninline endpoints:")
for m in re.finditer(r"['\"]([^'\"]*(?:api|corporate|action)[^'\"]*)['\"]", r.text, re.I):
    val = m.group(1)
    if len(val) < 300:
        print(val)
print("\nwindow vars:")
for m in re.finditer(r"window\.([A-Za-z0-9_]+)\s*=", r.text):
    print(m.group(1))
