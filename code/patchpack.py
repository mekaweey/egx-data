# -*- coding: utf-8 -*-
p = r"C:\Users\Mekawey\AppData\Local\Temp\opencode\pack_build.py"
with open(p, encoding="utf-8") as fh:
    lines = fh.read().splitlines(keepends=True)
out = []
for ln in lines:
    s = ln.lstrip(" ")
    if s.startswith("cp(") and "def cp" not in ln and "shutil.copy" not in ln:
        indent = ln[: len(ln) - len(s)]
        ln = indent + "try" + s[2:]
    out.append(ln)
with open(p, "w", encoding="utf-8") as fh:
    fh.writelines(out)
print("patched calls to trycp")
