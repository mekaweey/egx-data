# -*- coding: utf-8 -*-
src_path = r"C:\Users\Mekawey\AppData\Local\Temp\opencode\merge_all.py"
dst_path = r"C:\Users\Mekawey\AppData\Local\Temp\opencode\merge_dry.py"
with open(src_path, encoding="utf-8") as fh:
    src = fh.read()
old = 'BASE = r"D:\\EGX_DATA"'
new = 'BASE = r"D:\\EGX_MERGE_DRY"'
assert old in src, "pattern missing"
src = src.replace(old, new)
with open(dst_path, "w", encoding="utf-8") as fh:
    fh.write(src)
print("dry-run script ready")
