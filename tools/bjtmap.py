#!/usr/bin/env python3
"""Map SuttaCentral ids to Buddha Jayanti (tipitaka.lk) tree keys by structure, then check by title."""
import json, os, re, sys, difflib
sys.path.insert(0, os.path.dirname(__file__))
from translit import tr
def load_tree(tp):
    tree = json.load(open(os.path.join(tp, 'data/tree.json')))
    kids = {}
    for k, v in tree.items(): kids.setdefault(v[4], []).append(k)
    return tree, kids
def leaves(tree, kids, k):
    out = []
    def walk(x):
        ch = [c for c in kids.get(x, []) if c != x]
        if not ch: out.append(x); return
        for c in ch: walk(c)
    walk(k); return out
def norm(s):
    s = tr(s).lower() if re.search(r'[඀-෿]', s) else s.lower()
    s = re.sub(r'[^a-zāīūṅñṭḍṇḷṃ]', '', s).replace('ṃ', 'm').replace('ṅ', 'm')
    s = re.sub(r'(suttam|sutta|suttaṃ|vatthu)$', '', s)
    for p in ('pathama', 'dutiya', 'tatiya'): s = s.replace(p, '')
    return s
SNP = [(1, 1), (2, 12), (3, 22), (4, 35), (5, 45)]
def candidates(i, tree, kids):
    m = re.match(r'([a-z]+)(\d+)(?:\.(\d+))?', i); c, a, b = m.group(1), int(m.group(2)), m.group(3) and int(m.group(3))
    if c == 'dn': L = sum((leaves(tree, kids, 'dn-%d' % v) for v in (1, 2, 3)), []); return L, a
    if c == 'mn': L = sum((leaves(tree, kids, 'mn-%d' % v) for v in (1, 2, 3)), []); return L, a
    if c == 'an': return leaves(tree, kids, 'an-%d' % a), b
    if c == 'sn':
        p, st = max(x for x in SNP if x[1] <= a); return leaves(tree, kids, 'sn-%d-%d' % (p, a - st + 1)), b
    if c == 'kp': return leaves(tree, kids, 'kn-khp'), a + 0
    if c == 'snp': return leaves(tree, kids, 'kn-snp-%d' % a), b
    if c == 'ud': return leaves(tree, kids, 'kn-ud-%d' % a), b
    if c == 'iti': return leaves(tree, kids, 'kn-iti'), a
    raise ValueError(i)
def sc_title(d):
    ks = [k for k in d['pli'] if ':0.' in k]
    return d['pli'][ks[-1]].strip() if ks else ''
def map_ids(ids, sc_dir, tp):
    tree, kids = load_tree(tp); res = {}
    for i in ids:
        d = json.load(open(os.path.join(sc_dir, i + '.json'))); t = norm(sc_title(d))
        L, n = candidates(i, tree, kids)
        best = None
        for j, k in enumerate(L):
            r = difflib.SequenceMatcher(None, t, norm(tree[k][0])).ratio()
            score = r - abs(j + 1 - n) * 0.004
            if not best or score > best[0]: best = (score, k, r, j + 1)
        res[i] = (best[1], round(best[2], 2), best[3], sc_title(d), tree[best[1]][0])
    return res
if __name__ == '__main__':
    sc, tp = sys.argv[1], sys.argv[2]; ids = sys.argv[3:]
    for i, v in map_ids(ids, sc, tp).items(): print(i, *v, sep=' | ')
