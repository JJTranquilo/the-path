#!/usr/bin/env python3
"""Build The Path library JSON from:
  - SuttaCentral bilara-data (Mahāsaṅgīti Pali + Sujato English, both public domain)
  - tipitaka.lk (Buddha Jayanti Pali + Sinhala, and pitaka.lk modern Sinhala; CC BY-ND 4.0, unaltered)
  - study notes in content/*.py
Usage: build_library.py SC_RAW_DIR TIPITAKA_STATIC_DIR CONTENT_DIR OUT_DIR
"""
import json, os, sys, re, importlib.util
SC, TP, CONTENT, OUT = sys.argv[1:5]
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogue import PARTS, BJT, GROUPS, GUIDE_EXTRA
def load_mod(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(CONTENT, name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
fam = load_mod('family'); wea = load_mod('wealth'); rest = load_mod('rest'); ess = load_mod('essays')
sys.path.insert(0, CONTENT); lay2 = load_mod('lay2'); med = load_mod('meditation')
NOTES = {}
for d in (fam.FAMILY, wea.WEALTH, rest.GIVING, rest.CONDUCT, rest.STATE, lay2.LAY2, med.MED): NOTES.update(d)
for k, (key, n) in med.VM.items(): NOTES[k] = n; BJT[k] = key

def ref(i):
    if i=='dn16x': return 'DN 16 (excerpts)'
    if i=='ja534': return 'Jā 534'
    if i.startswith('vm'): return 'Vism ' + {'vm3':'III','vm4':'IV','vm5':'V','vm6':'VI','vm7':'VII','vm8a':'VIII.1','vm8b':'VIII.2','vm8d':'VIII.4','vm9':'IX'}[i]
    m = re.match(r'([a-z]+)([\d.]+)', i); c, n = m.groups()
    return {'dn':'DN','mn':'MN','sn':'SN','an':'AN','snp':'Snp','kp':'Khp','ud':'Ud','iti':'Iti'}[c] + ' ' + n

# ---------- BJT extraction (unaltered entries) ----------
tree = json.load(open(os.path.join(TP, 'data/tree.json')))
fmap = json.load(open(os.path.join(TP, 'data/file-map.json')))
files = list(fmap.keys())
for _v in tree.values():
    if _v[5] not in fmap and _v[5] not in files: files.append(_v[5])
pos = {}
for k, v in tree.items(): pos.setdefault(v[5], []).append((v[3][0], v[3][1], v[2], k))
for f in pos: pos[f].sort()
_cache = {}
def load(f, kind='text'):
    if (f, kind) not in _cache:
        p = os.path.join(TP, kind, f + '.json'); _cache[(f, kind)] = json.load(open(p)) if os.path.exists(p) else None
    return _cache[(f, kind)]
def bjt_extract(key, sl=None, apz=True):
    v = tree[key]; f = v[5]; start = (v[3][0], v[3][1]); lvl = v[2]; out = []; cur = f; first = True
    while True:
        nodes = [n for n in pos.get(cur, []) if ((n[0], n[1]) > start if first else (n[0], n[1]) >= start) and n[3] != key and n[2] >= lvl and not n[3].startswith(key + '-')]
        end = (nodes[0][0], nodes[0][1]) if nodes else None
        d = load(cur)
        for pi, p in enumerate(d['pages']):
            for ei in range(len(p['pali']['entries'])):
                if (pi, ei) < start: continue
                if end and (pi, ei) >= end: break
                out.append((cur, pi, ei))
        if end: break
        i = files.index(cur) + 1
        if i >= len(files): break
        cur = files[i]; start = (0, 0); first = False
    if sl: out = [o for j, o in enumerate(out) if any(a <= j < b for a, b in sl)]
    return pack(out, v[1], apz)
def pack(out, title_si, apz=True):
    res = {'pali': [], 'si': [], 'apz': [], 'fn_pali': [], 'fn_si': [], 'title_si': title_si}
    seen = set()
    for (f, pi, ei) in out:
        p = load(f)['pages'][pi]; a = load(f, 'text-apz') if apz else None
        e = p['pali']['entries'][ei]; s = p['sinh']['entries'][ei] if ei < len(p['sinh']['entries']) else None
        res['pali'].append([e.get('type', 'paragraph'), e.get('text', ''), e.get('level', 0)])
        res['si'].append([s.get('type', 'paragraph'), s.get('text', ''), s.get('level', 0)] if s else None)
        if apz:
            try: res['apz'].append(a['pages'][pi]['entries'][ei])
            except Exception: res['apz'].append(None)
        if (f, pi) not in seen:
            seen.add((f, pi))
            res['fn_pali'] += [x['text'] for x in p['pali'].get('footnotes', [])]
            res['fn_si'] += [x['text'] for x in p['sinh'].get('footnotes', [])]
    return res

# ---------- SuttaCentral segments grouped into blocks ----------
def sc_blocks(i, keep=None):
    src = 'dn16' if i == 'dn16x' else i
    d = json.load(open(os.path.join(SC, src + '.json')))
    pli, en, html = d['pli'], d['en'], d['html']
    blocks = []; segs = {}
    for k in pli:
        if keep and not keep(k): continue
        h = html.get(k, '{}'); start = re.search(r'<(p|h\d|blockquote|li|header|section|article|div)', h)
        kind = 'h' if re.search(r'<h\d', h) else ('v' if 'verse-line' in h or 'gatha' in h else 'p')
        if ':0.' in k and kind != 'h': kind = 'meta'
        if start or not blocks: blocks.append([kind, []])
        blocks[-1][1].append(k)
        segs[k] = [pli[k].strip(), en.get(k, '').strip()]
    blocks = [b for b in blocks if b[0] != 'meta']
    return blocks, segs

def segnum(k):
    return [float(x) if x.replace('.','',1).isdigit() else 0 for x in k.split(':')[1].split('.')]
os.makedirs(os.path.join(OUT, 't'), exist_ok=True)
index = {'parts': [], 'suttas': {}, 'essays': {}, 'guide': ess.GUIDE + GUIDE_EXTRA, 'groups': GROUPS}
missing = []
seen_ids = set()
for pid, title, si, intro, ids in PARTS:
    index['parts'].append({'id': pid, 'title': title, 'si': si, 'intro': intro, 'items': ids})
    for i in ids:
        if i in seen_ids: continue
        seen_ids.add(i)
        n = NOTES.get(i) if i != 'ja534' else rest.STATE['ja534']
        if n is None: raise SystemExit('no study notes for ' + i)
        if i.startswith('vm'):
            bjt = bjt_extract(BJT[i], apz=False); bjt_key = BJT[i]; blocks, segs = [], {}
        elif i == 'ja534':
            d = load('kn-jat-18'); out = [('kn-jat-18', 67, e) for e in range(0, 7)]
            bjt = pack(out, tree['kn-jat-21-2'][1]); bjt['title_si'] = 'දශ රාජ ධර්මය · මහාහංස ජාතකය'
            blocks = [['v', ['ja534:%d' % j]] for j in range(7)]
            segs = {'ja534:%d' % j: [None, rest.JA534_EN[j]] for j in range(7)}
            bjt_key = 'kn-jat-21-2'
        else:
            keep = None
            if i == 'an2.33': keep = lambda k: k.startswith('an2.33:')
            if i == 'dn16x':
                def keep(k):
                    a = segnum(k)
                    return (a[0] == 1 and 1 <= a[1] < 6) or (a[0] == 1 and a[1] >= 19)
            blocks, segs = sc_blocks(i, keep)
            sl = [(0, 37), (95, 128)] if i == 'dn16x' else None
            bjt = bjt_extract(BJT[i], sl); bjt_key = BJT[i]
        for (seg, term, txt) in n.get('notes', []):
            if i != 'ja534' and seg not in segs and not seg.endswith(':0.3'): missing.append((i, seg))
        doc = {'id': i, 'blocks': blocks, 'segs': segs, 'bjt': bjt}
        ak = 'atta-' + bjt_key
        if i not in ('dn16x',) and not i.startswith('vm') and ak in tree:
            at = bjt_extract(ak, apz=False); at.pop('apz', None)
            if any(e and e[1].strip() for e in at['pali']): doc['atta'] = at
        json.dump(doc, open(os.path.join(OUT, 't', i + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
        meta = {k: n[k] for k in ('title', 'known', 'setting', 'brief', 'teaching', 'living', 'topics', 'related') if k in n}
        meta['notes'] = [{'seg': s, 'term': t, 'text': x} for (s, t, x) in n.get('notes', [])]
        meta['ref'] = ref(i); meta['part'] = pid; meta['bjtKey'] = bjt_key; meta['titleSi'] = bjt['title_si']
        meta['sc'] = None if (i == 'ja534' or i.startswith('vm')) else ('dn16' if i == 'dn16x' else i)
        if i.startswith('vm'): meta['bjtOnly'] = 1
        if 'atta' in doc: meta['atta'] = 1
        index['suttas'][i] = meta
for k, e in ess.ESSAYS.items(): index['essays'][k] = e
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('suttas', len(index['suttas']), 'missing note segs:', missing)
