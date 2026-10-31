# -*- coding: utf-8 -*-
"""Check for a stored GitHub credential without printing the secret."""
from __future__ import annotations

import subprocess

inp = "protocol=https\nhost=github.com\n\n"
try:
    p = subprocess.run(
        ["git", "credential", "fill"],
        input=inp,
        text=True,
        capture_output=True,
        timeout=15,
    )
    print("returncode", p.returncode)
    lines = [line for line in p.stdout.splitlines() if line.strip()]
    print("lines", len(lines))
    for line in lines:
        key, _, value = line.partition("=")
        if key == "password":
            print("password_present", bool(value), "length", len(value))
        elif key == "username":
            print("username", value)
        else:
            print(key, value)
    if p.stderr.strip():
        print("stderr", p.stderr.strip()[:500])
except Exception as e:
    print("ERROR", repr(e))
