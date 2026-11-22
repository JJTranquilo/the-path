#!/usr/bin/env python3
"""Fetch Mahāsaṅgīti Pali, Sujato English and markup from SuttaCentral's bilara-data for the library.
Usage: fetch_sc.py OUT_DIR [id ...]   (no ids: everything in the library catalogue)"""
import urllib.request, urllib.error, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
B = "https://raw.githubusercontent.com/suttacentral/bilara-data/published/"
RANGES = {'an2.33': 'an2.32-41'}
def dirs(i):
    f = RANGES.get(i, i)
    if i.startswith('dn'): return ['dn'], f
    if i.startswith('mn'): return ['mn'], f
    if i.startswith('an'): return ['an/' + f.split('.')[0]], f
    if i.startswith('snp'): return ['kn/snp/vagga' + f[3:].split('.')[0]], f
    if i.startswith('sn'): return ['sn/' + f.split('.')[0]], f
    if i.startswith('kp'): return ['kn/kp'], f
    if i.startswith('ud'): return ['kn/ud/vagga' + f[2:].split('.')[0]], f
    if i.startswith('iti'): return ['kn/iti/vagga%d' % v for v in range(1, 12)], f
    raise ValueError(i)
def get(u):
    with urllib.request.urlopen(u, timeout=60) as r: return json.load(r)
def fetch(i):
    ds, f = dirs(i)
    for d in ds:
        try: pli = get(B + f"root/pli/ms/sutta/{d}/{f}_root-pli-ms.json")
        except urllib.error.HTTPError: continue
        return {'pli': pli, 'en': get(B + f"translation/en/sujato/sutta/{d}/{f}_translation-en-sujato.json"),
                'html': get(B + f"html/pli/ms/sutta/{d}/{f}_html.json")}
    raise FileNotFoundError(i)
if __name__ == '__main__':
    out_dir = sys.argv[1] if len(sys.argv) > 1 else 'raw'
    ids = sys.argv[2:]
    if not ids:
        from catalogue import all_sc_ids
        ids = all_sc_ids()
    os.makedirs(out_dir, exist_ok=True)
    for i in ids:
        src = 'dn16' if i == 'dn16x' else i
        p = os.path.join(out_dir, src + '.json')
        if os.path.exists(p): continue
        out = fetch(src); json.dump(out, open(p, 'w'), ensure_ascii=False)
        print(i, len(out['pli']), flush=True)
