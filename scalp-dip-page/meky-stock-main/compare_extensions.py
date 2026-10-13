#!/usr/bin/env python3
import os, json

# Project extension folder
proj_path = r'D:\\meky-stock-main\\meky-stock-main\\extension'
proj_mf = os.path.join(proj_path, 'manifest.json')
if os.path.exists(proj_mf):
    with open(proj_mf, encoding='utf-8') as f:
        proj_data = json.load(f)
    print("PROJECT EXTENSION MANIFEST:")
    print(f"  name: {proj_data.get('name')}")
    print(f"  version: {proj_data.get('version')}")

# F: extension folder
f_path = r'F:\\thunder-extension-v4.6.2'
f_mf = os.path.join(f_path, 'manifest.json')
if os.path.exists(f_mf):
    with open(f_mf, encoding='utf-8') as f:
        f_data = json.load(f)
    print("\nF: EXTENSION MANIFEST:")
    print(f"  name: {f_data.get('name')}")
    print(f"  version: {f_data.get('version')}")

# Compare
print("\n--- Comparison ---")
if proj_data.get('name') == f_data.get('name') and proj_data.get('version') == f_data.get('version'):
    print("✓ Manifests match!")
else:
    print("✗ Manifests differ!")