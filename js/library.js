// The Householder's Library: catalogue, essays, guidance index, and a parallel-text reader.
import { $, $$, esc, md } from './core.js';
import { S, saveSettings } from './store.js';
import { sheet, toast } from './ui.js';

let IDX = null; const TXT = {};
const loadIdx = async () => IDX || (IDX = await (await fetch('library/index.json')).json());
export const libraryIndex = loadIdx;
const loadTxt = async id => TXT[id] || (TXT[id] = await (await fetch(`library/t/${id}.json`)).json());
const MODES = [['en', 'English'], ['par', 'English + Pali'], ['pli', 'Pali'], ['bjtp', 'BJT පාළි'], ['bjts', 'BJT සිංහල'], ['apz', 'නූතන සිංහල'], ['attp', 'අටුවා පාළි'], ['atts', 'අටුවා සිංහල']];
const modesFor = (id, s) => MODES.filter(([k]) => s.bjtOnly ? ['bjtp', 'bjts'].includes(k) : !(id === 'ja534' && k === 'pli') && (s.atta || !k.startsWith('att')));
const R = { mode: localStorage.getItem('tp.mode') || 'en', tab: 'study', size: +(localStorage.getItem('tp.size') || 1) };
const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  mark: on => `<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z" ${on ? 'class="fill"' : ''}/></svg>`,
  aa: '<svg viewBox="0 0 24 24"><path d="M3 19l5-13 5 13M5 14h6M14 19l3.5-9 3.5 9M15.2 16h4.6"/></svg>',
};

export async function renderLibrary(route) {
  const el = $('#v-library'); await loadIdx();
  document.documentElement.style.setProperty('--rs', R.size);
  const [a, b] = (route || '').split('/');
  if (a === 'essay' && IDX.essays[b]) return essay(el, b);
  if (a && IDX.suttas[a]) return sutta(el, a);
  return home(el);
}

// ---------------- home ----------------
function home(el) {
  const openParts = new Set(JSON.parse(localStorage.getItem('tp.parts') || '["household","wealth"]'));
  const bm = S.settings.bookmarks || []; const last = JSON.parse(localStorage.getItem('tp.last') || 'null');
  const E = IDX.essays;
  el.innerHTML = `
  <header class="lib-hero"><h1>Library</h1><p class="si">ගිහි විනය · The Buddha's teaching for lay life, and the way of meditation</p></header>
  <div class="pad"><input type="search" id="l-q" class="search" placeholder="Search: debt, marriage, grief, kasiṇa, kings…"></div>
  <div id="l-res"></div>
  <div id="l-main">
    ${last && IDX.suttas[last.id] ? `<a class="continue" href="#library/${last.id}"><small>Continue reading</small><b>${esc(IDX.suttas[last.id].title)}</b><span>${esc(IDX.suttas[last.id].ref)}</span></a>` : ''}
    <a class="feature" href="#library/essay/money"><small>Start here</small><b>${esc(E.money.title)}</b><span>${esc(E.money.sub)}</span><i class="orn">❀</i></a>
    <div class="feat2"><a class="feature sm" href="#library/essay/family"><b>${esc(E.family.title)}</b><span>${esc(E.family.sub)}</span></a><a class="feature sm" href="#library/essay/state"><b>${esc(E.state.title)}</b><span>${esc(E.state.sub)}</span></a></div>
    <div class="sec"><h2>I need guidance on…</h2></div>
    <div class="pad chips guide">${IDX.guide.map((g, i) => `<button class="chip" data-guide="${i}">${esc(g[0])}</button>`).join('')}</div>
    <div id="l-guide"></div>
    ${bm.length ? `<div class="sec"><h2>Bookmarks</h2><span>${bm.length}</span></div><div class="slist pad">${bm.filter(id => IDX.suttas[id]).map(id => item(id)).join('')}</div>` : ''}
    <div class="pad chips jump">${(IDX.groups || []).map(([g, ids]) => ids.map(pid => { const p = IDX.parts.find(x => x.id === pid); return p ? `<a class="chip" href="#library" data-jump="${p.id}">${esc(p.title.replace(/^Meditation: /, ''))}</a>` : ''; }).join('')).join('')}</div>
    ${(IDX.groups || [['', IDX.parts.map(p => p.id)]]).map(([g, ids]) => `${g ? `<div class="grp"><h2>${esc(g)}</h2><span>${ids.reduce((n, pid) => n + ((IDX.parts.find(x => x.id === pid) || {}).items || []).length, 0)} texts</span></div>` : ''}${ids.map(pid => IDX.parts.find(x => x.id === pid)).filter(Boolean).map(p => `<details class="part" id="part-${p.id}" ${openParts.has(p.id) ? 'open' : ''}><summary><span class="pt"><b>${esc(p.title.replace(/^Meditation: /, ''))}</b><small>${esc(p.intro)}</small></span><span class="pc">${p.items.length}<i>›</i></span></summary><p class="si mini">${esc(p.si)}</p><div class="slist">${p.items.map(id => item(id)).join('')}</div></details>`).join('')}`).join('')}
    <div class="sec"><h2>About</h2></div><div class="slist pad"><a class="litem" href="#library/essay/about"><span class="ref">Texts</span><span class="n"><b>${esc(E.about.title)}</b><small>${esc(E.about.sub)}</small></span></a></div>
    <p class="pad mini legal">Pali and Sinhala, including the aṭṭhakathā and the Visuddhimagga: Buddha Jayanti Tipiṭaka and pitaka.lk modern Sinhala, from tipitaka.lk under CC BY-ND 4.0, reproduced unaltered. English: Bhikkhu Sujato, SuttaCentral, public domain. Study notes by Claude.</p>
  </div>`;
  window.scrollTo(0, 0);
  el.querySelector('#l-q').oninput = e => search(e.target.value);
  el.querySelectorAll('details.part').forEach(d => d.addEventListener('toggle', () => { const o = new Set(JSON.parse(localStorage.getItem('tp.parts') || '[]')); d.open ? o.add(d.id.slice(5)) : o.delete(d.id.slice(5)); localStorage.setItem('tp.parts', JSON.stringify([...o])); }));
  el.querySelectorAll('[data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); const d = el.querySelector('#part-' + a.dataset.jump); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  el.querySelectorAll('[data-guide]').forEach(c => c.onclick = () => { const g = IDX.guide[+c.dataset.guide]; el.querySelectorAll('[data-guide]').forEach(x => x.classList.toggle('on', x === c)); el.querySelector('#l-guide').innerHTML = `<div class="slist pad">${g[1].map(([id, why]) => item(id, why)).join('')}</div>`; });
}
const item = (id, why) => { const s = IDX.suttas[id]; return `<a class="litem" href="#library/${id}"><span class="ref">${esc(s.ref)}</span><span class="n"><b>${esc(s.title)}</b><small>${esc(why || s.known)}</small></span></a>`; };
function search(q) {
  q = q.toLowerCase().trim(); const res = $('#l-res'), main = $('#l-main');
  if (!q) { res.innerHTML = ''; main.hidden = false; return; }
  main.hidden = true; const hits = [];
  for (const [id, s] of Object.entries(IDX.suttas)) { const hay = [s.title, s.known, s.ref, s.brief, s.living, (s.teaching || []).join(' '), (s.topics || []).join(' ')].join(' ').toLowerCase(); if (hay.includes(q)) hits.push(item(id)); }
  for (const [k, e] of Object.entries(IDX.essays)) if ((e.title + e.body).toLowerCase().includes(q)) hits.unshift(`<a class="litem" href="#library/essay/${k}"><span class="ref">Essay</span><span class="n"><b>${esc(e.title)}</b><small>${esc(e.sub)}</small></span></a>`);
  res.innerHTML = hits.length ? `<div class="slist pad">${hits.join('')}</div>` : '<div class="empty"><p>Nothing found.</p></div>';
}

// ---------------- essay ----------------
function essay(el, k) {
  const e = IDX.essays[k];
  el.innerHTML = `${bar(e.title, null)}<article class="reader essay"><header class="r-head"><small>Essay</small><h1>${esc(e.title)}</h1><p class="sub">${esc(e.sub)}</p></header><div class="prose">${md(e.body)}</div><p class="back-link"><a href="#library">← Library</a></p></article>`;
  window.scrollTo(0, 0); wireBar(el, null);
}

// ---------------- sutta ----------------
function bar(title, id) {
  const on = id && (S.settings.bookmarks || []).includes(id);
  return `<div class="rbar"><a class="ib" href="#library" aria-label="Back to library">${ICON.back}</a><span class="rt">${esc(title)}</span>${id ? `<button class="ib" id="rb-mark" aria-label="Bookmark">${ICON.mark(on)}</button>` : ''}<button class="ib" id="rb-aa" aria-label="Text size">${ICON.aa}</button></div>`;
}
function wireBar(el, id) {
  const m = el.querySelector('#rb-mark'); if (m) m.onclick = () => { const bm = new Set(S.settings.bookmarks || []); bm.has(id) ? bm.delete(id) : bm.add(id); saveSettings({ bookmarks: [...bm] }); m.innerHTML = ICON.mark(bm.has(id)); toast(bm.has(id) ? 'Bookmarked' : 'Bookmark removed'); };
  el.querySelector('#rb-aa').onclick = () => { R.size = R.size >= 1.3 ? 0.9 : Math.round((R.size + 0.1) * 10) / 10; localStorage.setItem('tp.size', R.size); document.documentElement.style.setProperty('--rs', R.size); toast('Text size ' + Math.round(R.size * 100) + '%', 1200); };
}
async function sutta(el, id) {
  const s = IDX.suttas[id]; localStorage.setItem('tp.last', JSON.stringify({ id }));
  el.innerHTML = `${bar(s.ref, id)}<article class="reader"><header class="r-head"><small>${esc(s.ref)} · ${esc(partTitle(s.part))}</small><h1>${esc(s.title)}</h1><p class="known">${esc(s.known)}</p>${/[\u0D80-\u0DFF]/.test(s.known || '') ? '' : `<p class="si-title">${esc(s.titleSi || '')}</p>`}<p class="setting">${esc(s.setting || '')}</p></header>
    <div class="seg tabs2" id="lr-tabs"><button data-tab="study" class="${R.tab === 'study' ? 'on' : ''}">Study</button><button data-tab="text" class="${R.tab === 'text' ? 'on' : ''}">The text</button></div>
    <div id="lr-body"></div></article>`;
  window.scrollTo(0, 0); wireBar(el, id);
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { R.tab = b.dataset.tab; el.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); body(id); });
  body(id);
}
const partTitle = p => (IDX.parts.find(x => x.id === p) || {}).title || '';
async function body(id, focusSeg) {
  const s = IDX.suttas[id], el = $('#lr-body');
  if (R.tab === 'study') {
    el.innerHTML = `<div class="prose study">
      <h3>In brief</h3>${md(s.brief)}
      ${s.teaching?.length ? `<h3>Key teachings</h3><ul class="keys">${s.teaching.map(t => `<li>${md(t).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ul>` : ''}
      ${s.living ? `<h3>Living it</h3>${md(s.living)}` : ''}
      ${s.notes?.length ? `<h3>On the translation</h3><div class="tnotes">${s.notes.map(n => `<div class="tnote"><button class="tn-term" data-seg="${esc(n.seg)}"><span class="pali">${esc(n.term)}</span><small>${esc(n.seg.includes(':') ? n.seg.split(':')[1] : '')} · see in text →</small></button><p>${md(n.text).replace(/^<p>|<\/p>$/g, '')}</p></div>`).join('')}</div>` : ''}
      ${s.related?.length ? `<h3>Read with</h3><div class="slist">${s.related.filter(r => IDX.suttas[r]).map(r => item(r)).join('')}</div>` : ''}
      <h3>Sources</h3><p class="mini">${s.sc ? `<a href="https://suttacentral.net/${s.sc}/en/sujato" target="_blank" rel="noopener">SuttaCentral: ${esc(s.ref)}</a> · ` : ''}<a href="https://tipitaka.lk/${esc(s.bjtKey)}" target="_blank" rel="noopener">tipitaka.lk: ${esc(s.titleSi || s.bjtKey)}</a></p>
    </div>`;
    el.querySelectorAll('.tn-term').forEach(b => b.onclick = () => { R.tab = 'text'; if (!['en', 'par'].includes(R.mode)) R.mode = 'par'; $$('#lr-tabs [data-tab]').forEach(x => x.classList.toggle('on', x.dataset.tab === 'text')); body(id, b.dataset.seg); });
    return;
  }
  const ms = modesFor(id, s); if (!ms.some(([k]) => k === R.mode)) R.mode = ms[0][0];
  el.innerHTML = `<div class="modes" id="lr-modes">${ms.map(([k, l]) => `<button class="chip ${R.mode === k ? 'on' : ''}" data-mode="${k}">${l}</button>`).join('')}</div><div id="lr-text" class="loading">Opening the text…</div>`;
  el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { R.mode = b.dataset.mode; localStorage.setItem('tp.mode', R.mode); el.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); text(id); });
  await text(id, focusSeg);
}
const bjtHtml = t => esc(t || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/__(.*?)__/g, '$1').replace(/\{([^}]+)\}/g, '<sup>$1</sup>').replace(/\n/g, '<br>');
async function text(id, focusSeg) {
  const box = $('#lr-text'); let t;
  try { t = await loadTxt(id); } catch (_) { box.innerHTML = '<div class="empty"><p>This text is not available offline yet. Open it once while online.</p></div>'; return; }
  box.classList.remove('loading');
  const s = IDX.suttas[id]; const noted = Object.fromEntries((s.notes || []).map(n => [n.seg, n]));
  const m = R.mode;
  if (m === 'en' || m === 'par' || m === 'pli') {
    const useBjtPali = id === 'ja534';
    box.innerHTML = `<div class="text ${m}">` + t.blocks.map(([kind, segs], bi) => {
      if (kind === 'h') return `<h3 class="th">${segs.map(k => esc(m === 'pli' ? t.segs[k][0] : t.segs[k][1] || t.segs[k][0])).join(' ')}</h3>`;
      const inner = segs.map((k, j) => {
        const [p, e] = t.segs[k]; const n = noted[k]; const pp = useBjtPali ? (t.bjt.pali[bi] || [])[1] : p;
        const mk = n ? ` class="sg noted" data-note="${esc(k)}"` : ' class="sg"';
        if (m === 'en') return e ? `<span${mk} id="s-${esc(k)}">${esc(e)}${n ? '<sup class="nm">✻</sup>' : ''}</span>` : '';
        if (m === 'pli') return pp ? `<span class="sg" id="s-${esc(k)}">${useBjtPali ? bjtHtml(pp) : esc(pp)}</span>` : '';
        return `<span${mk} id="s-${esc(k)}">${pp ? `<span class="pl">${useBjtPali ? bjtHtml(pp) : esc(pp)}</span>` : ''}${e ? `<span class="en">${esc(e)}${n ? '<sup class="nm">✻</sup>' : ''}</span>` : ''}</span>`;
      }).join(m === 'par' ? '' : ' ');
      return kind === 'v' ? `<div class="vs">${inner}</div>` : `<p>${inner}</p>`;
    }).join('') + `</div><p class="credit">${m === 'pli' ? (id === 'ja534' ? 'Pali: Buddha Jayanti Tipiṭaka, tipitaka.lk (CC BY-ND 4.0), unaltered.' : 'Pali: Mahāsaṅgīti Tipiṭaka, via SuttaCentral (public domain).') : id === 'ja534' ? 'English: Claude, checked against the Buddha Jayanti Sinhala. Pali: Buddha Jayanti Tipiṭaka, tipitaka.lk (CC BY-ND 4.0).' : 'English: Bhikkhu Sujato, SuttaCentral (public domain). ✻ marks a translation note; tap it.'}</p>`;
    box.querySelectorAll('.noted').forEach(x => x.onclick = () => { const n = noted[x.dataset.note]; sheet(n.term, `<div class="prose"><p class="pali big">${esc(n.term)}</p>${md(n.text)}</div>`); });
  } else {
    const at = m === 'attp' || m === 'atts'; const A = at ? (t.atta || { pali: [], si: [], fn_pali: [], fn_si: [] }) : null;
    const src = at ? (m === 'attp' ? A.pali : A.si) : m === 'bjtp' ? t.bjt.pali : m === 'bjts' ? t.bjt.si : t.bjt.apz;
    const rows = src.map((e, i) => {
      if (!e) return ''; const ty = m === 'apz' ? (t.bjt.pali[i]?.[0] || 'paragraph') : e[0]; const tx = m === 'apz' ? e : e[1];
      if (!tx || !String(tx).trim()) return '';
      if (ty === 'heading') return `<h3 class="th">${bjtHtml(tx)}</h3>`; if (ty === 'centered') return `<p class="ctr">${bjtHtml(tx)}</p>`;
      if (String(ty).startsWith('gatha')) return `<div class="vs">${bjtHtml(tx)}</div>`;
      return `<p>${bjtHtml(tx)}</p>`;
    }).join('');
    const fn = at ? (m === 'attp' ? A.fn_pali : A.fn_si) : m === 'bjtp' ? t.bjt.fn_pali : m === 'bjts' ? t.bjt.fn_si : [];
    box.innerHTML = `<div class="text sinhala">${rows}</div>${fn.length ? `<details class="fns"><summary>Footnotes · variant readings</summary>${fn.map(f => `<p>${bjtHtml(f)}</p>`).join('')}</details>` : ''}${at ? `<p class="mini atta-note">${m === 'attp' ? 'The aṭṭhakathā: the classical commentary preserved at the Mahāvihāra and set down in Pali by Buddhaghosa and his successors.' : 'The aṭṭhakathā in Sinhala.'}</p>` : ''}<p class="credit">${m === 'apz' ? 'Modern Sinhala translation derived from A. P. de Zoysa, pitaka.lk' : at ? 'Aṭṭhakathā' : s.bjtOnly ? 'Visuddhimagga' : 'Buddha Jayanti Tipiṭaka'} · tipitaka.lk · CC BY-ND 4.0 · reproduced unaltered.${id === 'dn16x' ? ' Two excerpts.' : ''}</p>`;
  }
  if (focusSeg) { const t2 = document.getElementById('s-' + focusSeg); if (t2) { t2.scrollIntoView({ block: 'center' }); t2.classList.add('flash'); setTimeout(() => t2.classList.remove('flash'), 2200); } }
}
