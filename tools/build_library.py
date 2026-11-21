#!/usr/bin/env python3
"""Build The Path library JSON from:
  - SuttaCentral bilara-data (Mahāsaṅgīti Pali + Sujato English, both public domain)
  - tipitaka.lk (Buddha Jayanti Pali + Sinhala, and pitaka.lk modern Sinhala; CC BY-ND 4.0, unaltered)
  - study notes in content/*.py
Usage: build_library.py SC_RAW_DIR TIPITAKA_STATIC_DIR CONTENT_DIR OUT_DIR
"""
import json, os, sys, re, importlib.util
SC, TP, CONTENT, OUT = sys.argv[1:5]
sys.path.insert(0, os.path.dirname(__file__))
def load_mod(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(CONTENT, name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
fam = load_mod('family'); wea = load_mod('wealth'); rest = load_mod('rest'); ess = load_mod('essays')
NOTES = {}
for d in (fam.FAMILY, wea.WEALTH, rest.GIVING, rest.CONDUCT, rest.STATE): NOTES.update(d)

PARTS = [
 ('household', 'The Household', 'ගෘහ ජීවිතය', 'Parents, marriage, children, friends and the household as six directions.',
  ['dn31','an4.53','an4.55','an2.33','an4.63','an5.39','an7.36','an7.63']),
 ('wealth', 'Wealth', 'ධනය', 'Earning, protecting, balancing, using, borrowing and passing on.',
  ['an8.54','an4.62','an4.61','an5.41','an5.227','an4.258','an3.19','an3.20','an4.79','an5.177','an6.45','sn3.19','sn3.20','mn135','an7.6','snp2.14']),
 ('giving', 'Giving', 'දානය', 'How, why and to whom: the seed of every kind of wealth.',
  ['an5.35','an5.148','an7.52','mn142','an4.60']),
 ('conduct', 'Conduct and Protection', 'හැසිරීම', 'Blessings, downfall, the ten courses of action and the uposatha.',
  ['kp5','snp1.6','mn41','an3.70']),
 ('state', 'Kings and Statecraft', 'රාජ ධර්මය', 'Authority, economy, justice, institutions and the ruler\'s own practice.',
  ['an4.256','dn16x','dn26','dn5','dn27','an4.70','an5.133','sn3.13','sn3.17','sn3.25','ja534']),
]
BJT = {'dn31':'dn-3-8','an4.53':'an-4-2-1-3','an4.55':'an-4-2-1-5','an2.33':'an-2-1-4-2','an4.63':'an-4-2-2-3','an5.39':'an-5-1-4-9','an7.36':'an-7-1-4-5','an7.63':'an-7-2-1-10',
'an8.54':'an-8-2-1-4','an4.61':'an-4-2-2-1','an4.62':'an-4-2-2-2','an5.41':'an-5-1-5-1','an5.177':'an-5-4-3-7','an6.45':'an-6-1-5-3','an4.258':'an-4-6-5','an4.256':'an-4-6-3','an5.227':'an-5-5-3-7','an3.19':'an-3-1-2-9','an3.20':'an-3-1-2-10','an4.79':'an-4-2-3-9','sn3.19':'sn-1-3-2-9','sn3.20':'sn-1-3-2-10','mn135':'mn-3-4-5','an7.6':'an-7-1-1-6','snp2.14':'kn-snp-2-14',
'an5.35':'an-5-1-4-5','an5.148':'an-5-3-5-8','an7.52':'an-7-1-5-9','mn142':'mn-3-4-12','an4.60':'an-4-2-1-10',
'kp5':'kn-khp-5','snp1.6':'kn-snp-1-6','an3.70':'an-3-2-2-10','mn41':'mn-1-5-1',
'dn26':'dn-3-3','dn5':'dn-1-5','dn16x':'dn-2-3','dn27':'dn-3-4','an4.70':'an-4-2-2-10','an5.133':'an-5-3-4-3','sn3.17':'sn-1-3-2-7','sn3.13':'sn-1-3-2-3','sn3.25':'sn-1-3-3-5'}
def ref(i):
    if i=='dn16x': return 'DN 16 (excerpts)'
    if i=='ja534': return 'Jā 534'
    m = re.match(r'([a-z]+)([\d.]+)', i); c, n = m.groups()
    return {'dn':'DN','mn':'MN','sn':'SN','an':'AN','snp':'Snp','kp':'Khp'}[c] + ' ' + n

# ---------- BJT extraction (unaltered entries) ----------
tree = json.load(open(os.path.join(TP, 'data/tree.json')))
fmap = json.load(open(os.path.join(TP, 'data/file-map.json')))
files = list(fmap.keys())
pos = {}
for k, v in tree.items(): pos.setdefault(v[5], []).append((v[3][0], v[3][1], v[2], k))
for f in pos: pos[f].sort()
_cache = {}
def load(f, kind='text'):
    if (f, kind) not in _cache:
        p = os.path.join(TP, kind, f + '.json'); _cache[(f, kind)] = json.load(open(p)) if os.path.exists(p) else None
    return _cache[(f, kind)]
def bjt_extract(key, sl=None):
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
    return pack(out, v[1])
def pack(out, title_si):
    res = {'pali': [], 'si': [], 'apz': [], 'fn_pali': [], 'fn_si': [], 'title_si': title_si}
    seen = set()
    for (f, pi, ei) in out:
        p = load(f)['pages'][pi]; a = load(f, 'text-apz')
        e = p['pali']['entries'][ei]; s = p['sinh']['entries'][ei] if ei < len(p['sinh']['entries']) else None
        res['pali'].append([e.get('type', 'paragraph'), e.get('text', ''), e.get('level', 0)])
        res['si'].append([s.get('type', 'paragraph'), s.get('text', ''), s.get('level', 0)] if s else None)
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
index = {'parts': [], 'suttas': {}, 'essays': {}, 'guide': ess.GUIDE}
missing = []
for pid, title, si, intro, ids in PARTS:
    index['parts'].append({'id': pid, 'title': title, 'si': si, 'intro': intro, 'items': ids})
    for i in ids:
        n = NOTES.get(i) if i != 'ja534' else rest.STATE['ja534']
        if i == 'ja534':
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
        json.dump(doc, open(os.path.join(OUT, 't', i + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
        meta = {k: n[k] for k in ('title', 'known', 'setting', 'brief', 'teaching', 'living', 'topics', 'related') if k in n}
        meta['notes'] = [{'seg': s, 'term': t, 'text': x} for (s, t, x) in n.get('notes', [])]
        meta['ref'] = ref(i); meta['part'] = pid; meta['bjtKey'] = bjt_key; meta['titleSi'] = bjt['title_si']
        meta['sc'] = None if i in ('ja534',) else ('dn16' if i == 'dn16x' else i)
        index['suttas'][i] = meta
for k, e in ess.ESSAYS.items(): index['essays'][k] = e
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('suttas', len(index['suttas']), 'missing note segs:', missing)
