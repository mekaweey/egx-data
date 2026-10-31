# -*- coding: utf-8 -*-
import re
import requests

u = "https://www.mubasher.info/news/eg/now/announcements"
r = requests.get(
    u,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
    },
    timeout=40,
)
print(r.status_code, len(r.text))
for m in re.finditer(r'src="([^"]*?/api/1/[^"]*)"', r.text):
    print("src", m.group(1))
print("numPages", re.findall(r"numPages\s*=\s*(\d+)", r.text)[:3])
print("api mentions")
for m in re.finditer(r"['\"]([^'\"]*api[^'\"]*)['\"]", r.text, re.I):
    v = m.group(1)
    if len(v) < 250:
        print(v)
