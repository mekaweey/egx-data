# -*- coding: utf-8 -*-
pairs = [
    ('BASE = r"D:\\EGX_DATA"', 'BASE = r"D:\\EGX_MERGE_DRY"'),
    ('OUT = r"D:\\EGX_AI_PACK2"', 'OUT = r"D:\\EGX_PACK_DRY"'),
    ('zp = r"D:\\EGX_AI_PACK2.zip"', 'zp = r"D:\\EGX_PACK_DRY.zip"'),
    ('LOGD = os.path.join(BASE, "_logs")', 'LOGD = r"C:\\Users\\Mekawey\\AppData\\Local\\Temp\\opencode"'),
]
src_path = r"C:\Users\Mekawey\AppData\Local\Temp\opencode\pack_build.py"
dst_path = r"C:\Users\Mekawey\AppData\Local\Temp\opencode\pack_dry.py"
with open(src_path, encoding="utf-8") as fh:
    src = fh.read()
for old, new in pairs:
    assert old in src, "missing: " + old
    src = src.replace(old, new)
with open(dst_path, "w", encoding="utf-8") as fh:
    fh.write(src)
print("pack dry ready")
