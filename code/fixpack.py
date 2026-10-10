# -*- coding: utf-8 -*-
import re
p = r"C:\Users\Mekawey\AppData\Local\Temp\opencode\pack_build.py"
with open(p, encoding="utf-8") as fh:
    src = fh.read()
src2, n = re.subn(r"(?m)^([ \t]*)try\(", r"\1trycp(", src)
with open(p, "w", encoding="utf-8") as fh:
    fh.write(src2)
print("fixed lines:", n)
import ast
ast.parse(src2)
print("syntax OK")
