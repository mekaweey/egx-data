# -*- coding: utf-8 -*-
"""Inspect the stored GitHub credential's account/scopes without printing the secret."""
from __future__ import annotations

import subprocess

import requests


def token() -> str:
    p = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        text=True,
        capture_output=True,
        timeout=15,
    )
    for line in p.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1]
    raise RuntimeError("no password in git credential")


def main() -> None:
    t = token()
    s = requests.Session()
    s.headers.update({"Authorization": f"token {t}", "Accept": "application/vnd.github+json"})
    r = s.get("https://api.github.com/user", timeout=30)
    print("user status", r.status_code)
    print("scopes", r.headers.get("x-oauth-scopes"))
    if r.status_code == 200:
        j = r.json()
        print("login", j.get("login"))
        print("name", j.get("name"))
    for name in ["egx-mubasher-news-2026-10-31", "egx-mubasher-news"]:
        rr = s.get(f"https://api.github.com/repos/mekaweey/{name}", timeout=30)
        print(name, rr.status_code)
        if rr.status_code == 200:
            print("  private", rr.json().get("private"), "url", rr.json().get("html_url"))


if __name__ == "__main__":
    main()
