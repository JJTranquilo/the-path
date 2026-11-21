#!/usr/bin/env python3
"""Fetch Mahāsaṅgīti Pali, Sujato English and markup from SuttaCentral's bilara-data for the library.
Usage: fetch_sc.py OUT_DIR"""
import urllib.request, json, os, sys
B = "https://raw.githubusercontent.com/suttacentral/bilara-data/published/"
IDS = """dn31 an4.53 an4.55 an2.33 an4.63 an5.39 an7.36 an7.63
an8.54 an4.61 an4.62 an5.41 an5.177 an6.45 an4.258 an4.256 an5.227 an3.19 an3.20 an4.79 sn3.19 sn3.20 mn135 an7.6 snp2.14
an5.35 an5.148 an7.52 mn142 an4.60
kp5 snp1.6 an3.70 mn41
dn26 dn5 dn16 dn27 an4.70 an5.133 sn3.17 sn3.13 sn3.25""".split()
RANGES = {'an2.33': 'an2.32-41'}
def path(i):
    f = RANGES.get(i, i)
    if i.startswith('dn'): d = 'dn'
    elif i.startswith('mn'): d = 'mn'
    elif i.startswith('an'): d = 'an/' + f.split('.')[0]
    elif i.startswith('snp'): d = 'kn/snp/vagga' + f[3:].split('.')[0]
    elif i.startswith('kp'): d = 'kn/kp'
    elif i.startswith('sn'): d = 'sn/' + f.split('.')[0]
    return d, f
def get(u):
    with urllib.request.urlopen(u, timeout=60) as r: return json.load(r)
out_dir = sys.argv[1] if len(sys.argv) > 1 else 'raw'
os.makedirs(out_dir, exist_ok=True)
for i in IDS:
    d, f = path(i)
    out = {'pli': get(B + f"root/pli/ms/sutta/{d}/{f}_root-pli-ms.json"),
           'en': get(B + f"translation/en/sujato/sutta/{d}/{f}_translation-en-sujato.json"),
           'html': get(B + f"html/pli/ms/sutta/{d}/{f}_html.json")}
    json.dump(out, open(os.path.join(out_dir, i + '.json'), 'w'), ensure_ascii=False)
    print(i, len(out['pli']), flush=True)
