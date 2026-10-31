# -*- coding: utf-8 -*-
"""Create a private GitHub repo and push the Mubasher news package.

The stored git credential is read in memory only; it is never printed or written
into the repository or the remote URL.  The repo contains public news data only.
"""
from __future__ import annotations

import base64
import shutil
import subprocess
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31"
NEWS = OUT / "news"
REPO_DIR = OUT / "github_repo"
OWNER = "mekaweey"
NAME = "egx-mubasher-news-2026-10-31"
DESC = "Mubasher EGX per-company news dataset (2022-2026, 252 symbols) with corrected Cairo timestamps"

FILES = [
    "mubasher_news_full_2026_10_31.csv",
    "mubasher_news_full_2026_10_31.csv.gz",
    "mubasher_news_unique_2026_10_31.csv.gz",
    "mubasher_news_parts_corrected_2026_10_31.zip",
    "news_metadata_2026_10_31.json",
    "news_readme_ar.md",
    "news_symbol_coverage_2026_10_31.csv",
    "news_category_counts_2026_10_31.csv",
    "news_year_counts_2026_10_31.csv",
    "news_symbol_aliases_2026_10_31.csv",
    "verification_vs_old_snapshot_2026_10_31.csv",
]

EXTRA_FILES = [
    (ROOT / "deliverables_2026_10_31" / "data" / "mubasher_market_announcements_2026_10_31.csv",
     "mubasher_market_announcements_2026_10_31.csv"),
]


def get_token() -> str:
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
    raise RuntimeError("no stored GitHub password/token")


def api(s: requests.Session, method: str, url: str, **kwargs):
    r = s.request(method, url, timeout=60, **kwargs)
    if r.status_code >= 400:
        print(method, url, "->", r.status_code, r.text[:500])
    return r


def main() -> None:
    token = get_token()
    s = requests.Session()
    s.headers.update({"Authorization": f"token {token}", "Accept": "application/vnd.github+json"})

    r = api(s, "GET", f"https://api.github.com/repos/{OWNER}/{NAME}")
    if r.status_code == 404:
        r = api(
            s,
            "POST",
            "https://api.github.com/user/repos",
            json={
                "name": NAME,
                "private": True,
                "description": DESC,
                "has_issues": False,
                "has_wiki": False,
                "auto_init": False,
            },
        )
    if r.status_code not in (200, 201):
        raise SystemExit(f"could not create/find repo: {r.status_code} {r.text[:300]}")
    repo = r.json()
    print("repo", repo.get("html_url"), "private", repo.get("private"))

    REPO_DIR.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        src = NEWS / name
        if not src.exists():
            raise SystemExit(f"missing {src}")
        shutil.copy2(src, REPO_DIR / name)
    for src, dst_name in EXTRA_FILES:
        if not src.exists():
            raise SystemExit(f"missing {src}")
        shutil.copy2(src, REPO_DIR / dst_name)
    # Human-friendly README at repo root.
    shutil.copy2(NEWS / "news_readme_ar.md", REPO_DIR / "README.md")

    def run(args: list[str], **kwargs):
        p = subprocess.run(args, cwd=REPO_DIR, text=True, capture_output=True, **kwargs)
        if p.stdout.strip():
            print(p.stdout.strip()[:1000])
        if p.returncode != 0:
            print("FAILED", " ".join(args[:3]), p.stderr.strip()[:1000])
            raise SystemExit(p.returncode)
        return p

    if not (REPO_DIR / ".git").exists():
        run(["git", "init", "-b", "main"])
    run(["git", "config", "user.name", "mekaweey"])
    run(["git", "config", "user.email", "midoali3928@gmail.com"])
    run(["git", "config", "http.postBuffer", "524288000"])
    run(["git", "add", "-A"])
    # Allow an empty commit only if there is something new; otherwise skip.
    st = subprocess.run(["git", "status", "--porcelain"], cwd=REPO_DIR, text=True, capture_output=True)
    if st.stdout.strip():
        run(["git", "commit", "-m", "Mubasher EGX news dataset 2026-10-31"])
    else:
        print("nothing new to commit")

    remote = f"https://github.com/{OWNER}/{NAME}.git"
    remotes = subprocess.run(["git", "remote"], cwd=REPO_DIR, text=True, capture_output=True).stdout.split()
    if "origin" not in remotes:
        run(["git", "remote", "add", "origin", remote])
    else:
        run(["git", "remote", "set-url", "origin", remote])

    b64 = base64.b64encode(f"{OWNER}:{token}".encode("utf-8")).decode("ascii")
    header = f"AUTHORIZATION: basic {b64}"
    run(
        ["git", "-c", "credential.helper=", "-c", f"http.extraheader={header}", "push", "-u", "origin", "main"],
        env={**__import__("os").environ, "GIT_TERMINAL_PROMPT": "0"},
    )
    print("pushed", repo.get("html_url"))


if __name__ == "__main__":
    main()
