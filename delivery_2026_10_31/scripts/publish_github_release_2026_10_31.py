# -*- coding: utf-8 -*-
"""Create/update the GitHub release and upload the full delivery zip.

Uses the credential already stored by Git Credential Manager for github.com.
The token is read with `git credential fill` and never printed.

Usage:
    python publish_github_release_2026_10_31.py path\to\asset.zip
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import requests

OWNER = "mekaweey"
REPO = "egx-data"
TAG = "delivery-2026-10-31"
API = "https://api.github.com"


def get_token() -> str:
    inp = "protocol=https\nhost=github.com\n\n"
    p = subprocess.run(
        ["git", "credential", "fill"],
        input=inp,
        text=True,
        capture_output=True,
        check=False,
    )
    for line in p.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("No GitHub credential found by git credential fill")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: publish_github_release_2026_10_31.py <asset.zip>")
    asset = Path(sys.argv[1]).resolve()
    if not asset.exists():
        raise SystemExit(f"Asset not found: {asset}")

    token = get_token()
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    # Create or reuse the release.
    r = requests.get(f"{API}/repos/{OWNER}/{REPO}/releases/tags/{TAG}", headers=headers, timeout=60)
    if r.status_code == 200:
        release = r.json()
        print(f"release exists: {release['html_url']}")
    elif r.status_code == 404:
        body = {
            "tag_name": TAG,
            "target_commitish": "main",
            "name": "Delivery 2026-10-31 — full raw package",
            "body": (
                "Full raw package for the 2026-10-31 EGX data work. "
                "The organized/compressed subset is committed under `delivery_2026_10_31/` in the repository. "
                "This asset contains the raw files, including the 186.3 MB official-disclosures CSV and the "
                "per-symbol source files, which are too large or too duplicative for the repository tree.\n\n"
                "Real fills are unverified. No paid sources. No personal trades were uploaded."
            ),
            "draft": False,
            "prerelease": False,
        }
        r = requests.post(f"{API}/repos/{OWNER}/{REPO}/releases", headers=headers, json=body, timeout=60)
        if r.status_code not in (200, 201):
            raise SystemExit(f"Create release failed: {r.status_code} {r.text[:500]}")
        release = r.json()
        print(f"release created: {release['html_url']}")
    else:
        raise SystemExit(f"Get release failed: {r.status_code} {r.text[:500]}")

    release_id = release["id"]

    # Remove an existing asset with the same name, if any.
    ar = requests.get(
        f"{API}/repos/{OWNER}/{REPO}/releases/{release_id}/assets",
        headers=headers,
        timeout=60,
    )
    if ar.status_code == 200:
        for a in ar.json():
            if a.get("name") == asset.name:
                dr = requests.delete(a["url"], headers=headers, timeout=60)
                print(f"deleted old asset: {a['name']} ({dr.status_code})")

    size_mb = asset.stat().st_size / (1024 * 1024)
    print(f"uploading {asset.name} ({size_mb:.1f} MiB)...")
    upload_url = (
        f"https://uploads.github.com/repos/{OWNER}/{REPO}/releases/{release_id}/assets"
        f"?name={requests.utils.quote(asset.name)}"
    )
    with asset.open("rb") as f:
        ur = requests.post(
            upload_url,
            headers={
                "Authorization": f"token {token}",
                "Content-Type": "application/zip",
                "Accept": "application/vnd.github+json",
            },
            data=f,
            timeout=1800,
        )
    if ur.status_code not in (200, 201):
        raise SystemExit(f"Upload failed: {ur.status_code} {ur.text[:500]}")
    info = ur.json()
    print(f"asset uploaded: {info.get('browser_download_url')}")
    print(f"asset size: {info.get('size')} bytes")
    print(f"release: {release['html_url']}")


if __name__ == "__main__":
    main()
