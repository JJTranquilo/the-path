// Today, Calendar, Pin Potha, Rubric and Settings views.
import { $, $$, esc, pad2, zNow, addD, nice, short, mins, DOW, MON, weekStart, dowOf, fmtStamp, deviceTZ, getTZ, uid } from './core.js';
import { S, blocksFor, blockByKey, day, editDay, isDone, setTick, notesOn, allNotes, saveNote, deleteNote, newNote, addPhoto, photoURL, saveSettings, saveCards, schedule, upo, MOON, connect, disconnect, pull, flush, loadCal, importSchedule, clientId, calId } from './store.js';
import { GCOL, GNAME, WSTEPS, FAMILIES, familyOf, displayName, silSet, DHUT, RUBRIC, DEFAULT_SCHEDULE } from './data.js';
import { sheet, closeSheet, toast, confirmBox, buzz, viewer } from './ui.js';
import { openTimer, openCounter, openCompass, timerRunning } from './tools.js';
import { CONFIG } from '../config.js';

export const V = { date: zNow().date, open: null, cMode: 'week', cRef: zNow().date, cFam: null, pDate: zNow().date, pMode: 'day', q: '' };
const today = () => zNow().date;
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// ======================= TODAY =======================
export function renderToday() {
  const s = V.date, isToday = s === today(), u = upo(s), tom = upo(addD(s, 1)), z = zNow();
  $('#t-date').textContent = isToday ? nice(s) : nice(s);
  $('#t-sub').innerHTML = (isToday ? 'Today' : (s < today() ? 'Looking back' : 'Looking ahead')) + (deviceTZ() !== getTZ() ? ` · times in ${esc(getTZ().split('/').pop().replace('_', ' '))}` : '');
  $('#t-badge').innerHTML = u ? `<span class="badge">${MOON[u.kind] || '◌'} Uposatha · ${esc(u.label)}</span>` : '';
  // Now card
  const bl = blocksFor(s); const open = bl.filter(b => !b.a && !isDone(s, b)).length;
  let cur = null; if (isToday) cur = bl.find(b => b.a && !isDone(s, b) && mins(b.t) + b.m >= z.min) || null; else cur = bl.find(b => b.a && !isDone(s, b));
  const lbl = !cur ? 'All anchored practice kept' : isToday && mins(cur.t) <= z.min ? 'Now' : 'Next';
  const until = cur && isToday && mins(cur.t) > z.min ? (() => { const d = mins(cur.t) - z.min; return d >= 60 ? `in ${Math.floor(d / 60)} h ${d % 60} min` : `in ${d} min`; })() : '';
  $('#t-now').innerHTML = cur ? `<div class="nc-l"><small>${lbl}${until ? ' · ' + until : ''}</small><b>${esc(cur.name)}</b><span>${open} flexible practice${open === 1 ? '' : 's'} still open</span></div><div class="nc-r"><span class="t">${cur.t}</span><button class="btn sm" data-open="${cur.k}">Open</button></div>`
    : `<div class="nc-l"><small>${open} flexible still open</small><b>${lbl}</b><span>Sādhu.</span></div><div class="nc-r"><span class="t">✓</span></div>`;
  // banners
  let bn = '';
  if (S.sync.state === 'auth' && clientId()) bn += `<div class="banner"><span>Google is disconnected, so ticks are saved here only.</span><button class="btn sm" data-act="connect">Connect</button></div>`;
  else if (!clientId()) bn += `<div class="banner soft"><span>Working on this device only. Add Google in Settings to sync with Calendar and Drive.</span><button class="btn sm ghost" data-act="settings">Settings</button></div>`;
  if (S.calState === 'err') bn += `<div class="banner err"><span>${esc(S.calMsg)}</span><button class="btn sm" data-act="calretry">Retry</button></div>`;
  if (tom && isToday) bn += `<div class="banner gold"><span>${MOON[tom.kind] || '◌'} Uposatha tomorrow. Keeping ten precepts? Settle anything that needs paying tonight.</span></div>`;
  if (timerRunning()) bn += `<div class="banner"><span>A sit is in progress.</span><button class="btn sm" data-act="timer">Return</button></div>`;
  $('#t-banners').innerHTML = bn;
  $('#t-upo').innerHTML = u ? upoCard(s) : '';
  holdCard(); reflCard();
  const done = bl.filter(b => isDone(s, b)).length;
  $('#t-count').textContent = `${done} of ${bl.length} kept`;
  $('#t-prog').style.setProperty('--p', bl.length ? done / bl.length : 0);
  $('#t-list').innerHTML = bl.map(b => rowHtml(s, b, isToday, z)).join('');
}
function rowHtml(s, b, isToday, z) {
  const dn = isDone(s, b), isNow = isToday && z.min >= mins(b.t) && z.min < mins(b.t) + b.m, past = isToday && z.min >= mins(b.t) + b.m;
  const st = (day(s).steps || {})[b.k] || [];
  let sub = b.m + ' min';
  if (b.steps) sub += ` · ${st.filter(Boolean).length} of 7 steps`; else if (b.tool === 'counter') sub += ` · counter ${b.n || 21}`; else if (b.tool === 'timer') sub += ' · timer'; else if (b.tool === 'compass') sub += ' · compass';
  if (b.k === 'pansil' && upo(s)) sub = `Uposatha · ${day(s).sil || 8} precepts`;
  let more = b.d ? `<p>${esc(b.d)}</p>` : '';
  if (b.steps) more += `<div class="steps">${WSTEPS.map((w, i) => `<button class="step ${st[i] ? 'on' : ''}" data-step="${b.k}:${i}"><i>${st[i] ? '✓' : ''}</i><span>${esc(w)} ${w === 'Mora Piritha' ? (b.steps === 'I' ? '(dawn verse)' : '(dusk verse)') : b.steps}</span></button>`).join('')}</div>`;
  const tl = [];
  if (b.tool === 'timer') tl.push(`<button class="btn sm" data-timer="${b.k}">Start timer</button>`);
  if (b.tool === 'counter') tl.push(`<button class="btn sm" data-counter="${b.k}">Open counter</button>`);
  if (b.tool === 'compass') tl.push(`<button class="btn sm" data-compass="${b.k}">Face Ruwanwelisaya</button>`);
  if (b.ci) tl.push(`<button class="btn sm ghost" data-ci="${b.k}">Write in pin potha</button>`);
  if (familyOf(b) === 'kasina') tl.push(`<button class="btn sm ghost" data-kas="${b.k}">Kasina log</button>`);
  if (familyOf(b) === 'dhamma') tl.push(`<button class="btn sm ghost" data-sermon="1">Sermon note</button>`);
  if (tl.length) more += `<div class="tools-row">${tl.join('')}</div>`;
  return `<div class="row ${dn ? 'done' : ''} ${b.a ? 'anch' : ''} ${isNow ? 'now' : ''} ${past && !dn ? 'past' : ''} ${V.open === b.k ? 'open' : ''}" data-k="${b.k}">
    <div class="tm">${b.t}</div><div class="stripe" style="--c:${GCOL[b.c] || '#888'}"></div>
    <div class="body" data-tog="${b.k}"><div class="nm">${esc(b.name)}</div><div class="sub">${esc(sub)}</div><div class="more">${more}</div></div>
    <div class="ck"><button class="tick" data-tick="${b.k}" aria-label="Tick ${esc(b.name)}">${CHECK}</button></div></div>`;
}
function upoCard(s) {
  const d = day(s), n = d.sil || 8, dh = d.dhut || {}, ng = d.night || {};
  return `<section class="card upo"><div class="card-h"><h2>Uposatha</h2><div class="seg sm" role="group" aria-label="Precept set">${[8, 9, 10].map(x => `<button class="${x === n ? 'on' : ''}" data-sil="${x}">${x}</button>`).join('')}</div></div>
  <ol class="precepts">${silSet(n).map(p => `<li>${esc(p[0])}<span class="pali">${esc(p[1])}</span></li>`).join('')}</ol>
  <h4>Dhutangas undertaken</h4><div class="steps">${DHUT.map(x => `<button class="step ${dh[x[0]] ? 'on' : ''}" data-dhut="${x[0]}"><i>${dh[x[0]] ? '✓' : ''}</i><span><b>${esc(x[1])}</b> <span class="pali">${esc(x[2])}</span></span></button>`).join('')}</div>
  ${dh.nes ? `<h4>Sitter's night log</h4><div class="grid2">${[['sat', 'Hours sat'], ['walked', 'Hours walked'], ['stood', 'Hours stood'], ['dozed', 'Dozes']].map(x => `<label class="f">${x[1]}<input type="number" min="0" step="0.5" inputmode="decimal" data-night="${x[0]}" value="${esc(ng[x[0]] ?? '')}"></label>`).join('')}</div><p class="mini">Tomorrow: no driving.</p>` : ''}
  <p class="mini"><a href="#library/an3.70">Read the Uposatha Sutta (AN 3.70) →</a></p></section>`;
}
function holdCard() {
  const all = RUBRIC.flatMap(x => x.cards.map(c => ({ ...c, sec: x.title }))).concat(S.cards.map(c => ({ ...c, sec: 'Your skills' })));
  const d = new Date(V.date + 'T00:00:00Z'); const n = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5); const c = all[n % all.length];
  $('#t-hold').innerHTML = `<small>Hold today · ${esc(c.sec)}</small><b>${esc(c.t)}${c.k && c.k !== c.t ? ` <span class="pali">${esc(c.k)}</span>` : ''}</b><p>${esc(c.def || (c.do ? c.do[0] : '') || c.s || '')}</p><button class="btn sm ghost" data-card="${esc(c.id)}">Open card</button>`;
}
function reflCard() {
  const r = S.reflections[weekStart(V.date)] || S.reflections[weekStart(addD(V.date, -7))];
  const txt = r && (typeof r === 'string' ? r : r.text);
  $('#t-refl').innerHTML = txt ? `<section class="card hold refl"><small>This week's reflection · from Claude</small><div class="prose">${txt.split(/\n\n+/).map(p => `<p>${esc(p)}</p>`).join('')}</div></section>` : '';
}
export function todayClick(e) {
  const t = e.target, s = V.date;
  const tk = t.closest('[data-tick]'); if (tk) { const b = blockByKey(tk.dataset.tick); setTick(s, b, !isDone(s, b)); buzz(14); return true; }
  const sp = t.closest('[data-step]'); if (sp) {
    const [k, i] = sp.dataset.step.split(':'); const b = blockByKey(k); let completed = null;
    editDay(s, x => { x.steps = x.steps || {}; const a = [...(x.steps[k] || [])]; a[+i] = !a[+i]; x.steps[k] = a; const all = a.filter(Boolean).length === WSTEPS.length; x.ticks = x.ticks || {}; if (all && !x.ticks[k]) { x.ticks[k] = true; completed = true; } else if (!all && x.ticks[k]) { x.ticks[k] = false; completed = false; } });
    if (completed !== null) { setTick(s, b, completed); if (completed) toast(b.name + ' complete. Sādhu.'); } buzz(10); return true;
  }
  const tg = t.closest('[data-tog]'); if (tg && !t.closest('button,input,select,a')) { V.open = V.open === tg.dataset.tog ? null : tg.dataset.tog; renderToday(); return true; }
  const op = t.closest('[data-open]'); if (op) { V.open = op.dataset.open; renderToday(); document.querySelector(`.row[data-k="${op.dataset.open}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return true; }
  const tm = t.closest('[data-timer]'); if (tm) { openTimer(blockByKey(tm.dataset.timer), s); return true; }
  const ct = t.closest('[data-counter]'); if (ct) { openCounter(blockByKey(ct.dataset.counter), s); return true; }
  const cp = t.closest('[data-compass]'); if (cp) { openCompass(blockByKey(cp.dataset.compass), s); return true; }
  const ci = t.closest('[data-ci]'); if (ci) { const b = blockByKey(ci.dataset.ci); openNote(newNote(s, /look back/i.test(b.title) ? 'lookback' : 'checkin', { title: b.name })); return true; }
  const ks = t.closest('[data-kas]'); if (ks) { openNote(newNote(s, 'kasina', { title: blockByKey(ks.dataset.kas).name })); return true; }
  const sm = t.closest('[data-sermon]'); if (sm) { openNote(newNote(s, 'sermon')); return true; }
  const sl = t.closest('[data-sil]'); if (sl) { editDay(s, x => { x.sil = +sl.dataset.sil; }); return true; }
  const dh = t.closest('[data-dhut]'); if (dh) { editDay(s, x => { x.dhut = { ...(x.dhut || {}) }; x.dhut[dh.dataset.dhut] = !x.dhut[dh.dataset.dhut]; }); return true; }
  return false;
}

// ======================= CALENDAR =======================
const famsDone = s => [...new Set(blocksFor(s).filter(b => isDone(s, b)).map(b => familyOf(b)))];
const frac = (s, fam) => { const bl = blocksFor(s).filter(b => !fam || familyOf(b) === fam); return bl.length ? bl.filter(b => isDone(s, b)).length / bl.length : 0; };
export function renderCal() {
  const m = V.cMode, ref = V.cRef, td = today();
  $$('#c-seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  let h = '';
  if (m === 'week') {
    const ws = weekStart(ref), we = addD(ws, 6); $('#c-title').textContent = `${short(ws)} – ${short(we)}`;
    let kept = 0, tot = 0;
    h = `<div class="wk">` + [0, 1, 2, 3, 4, 5, 6].map(i => { const s = addD(ws, i); const bl = blocksFor(s); const dn = bl.filter(b => isDone(s, b)).length; if (s <= td) { kept += dn; tot += bl.length; } const u = upo(s);
      return `<div class="col ${s === td ? 'td' : ''}" data-day="${s}"><div class="hd">${DOW[dowOf(s)].slice(0, 3)}<b>${new Date(s + 'T00:00:00Z').getUTCDate()}</b>${u ? `<span class="moon">${MOON[u.kind]}</span>` : ''}</div>${bl.map(b => { const d = isDone(s, b); return `<button class="blk" title="${esc(b.t + ' ' + b.name)}" aria-label="${esc(b.name)} ${d ? 'kept' : 'open'}" data-wk="${s}|${b.k}" style="--c:${GCOL[b.c]}" data-on="${d ? 1 : 0}"></button>`; }).join('')}</div>`; }).join('') + `</div>
      <p class="pad mini">Solid is kept, outlined is open. Tap a block to tick it; tap a day's date to open it. This week so far: <b>${tot ? Math.round(kept / tot * 100) : 0}%</b> kept.</p>`;
  } else if (m === 'month') {
    const d = new Date(ref + 'T00:00:00Z'); const y = d.getUTCFullYear(), mo = d.getUTCMonth(); $('#c-title').textContent = `${MON[mo]} ${y}`;
    const first = `${y}-${pad2(mo + 1)}-01`; const start = weekStart(first);
    h = `<div class="mo">` + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<div class="dh">${x}</div>`).join('');
    for (let i = 0; i < 42; i++) { const s = addD(start, i); const dd = new Date(s + 'T00:00:00Z'); if (i >= 35 && dd.getUTCMonth() !== mo) break; const u = upo(s); const f = famsDone(s);
      h += `<button class="c ${dd.getUTCMonth() !== mo ? 'out' : ''} ${s === td ? 'td' : ''}" data-day="${s}" style="--p:${s <= td ? frac(s) : 0}"><b>${dd.getUTCDate()}</b>${u ? `<span class="mn">${MOON[u.kind]}</span>` : ''}<span class="dots">${f.map(x => `<i style="background:${FAMILIES[x][1]}"></i>`).join('')}</span>${notesOn(s).length ? '<span class="nt"></span>' : ''}</button>`; }
    h += `</div><p class="pad mini">Dots show which kinds of practice were kept; the fill shows how much of the day. ○ ● ◐ ◑ are uposathas; a gold corner marks a pin potha entry.</p>`;
  } else {
    const y = new Date(ref + 'T00:00:00Z').getUTCFullYear(); $('#c-title').textContent = String(y);
    const start = weekStart(`${y}-01-01`); let cells = '', months = '', lastM = -1;
    for (let w = 0; w < 54; w++) { const s0 = addD(start, w * 7 + 6); const m0 = new Date(s0 + 'T00:00:00Z').getUTCMonth(); months += `<span>${m0 !== lastM && s0.startsWith(String(y)) ? MON[m0].slice(0, 1) : ''}</span>`; lastM = m0;
      for (let i = 0; i < 7; i++) { const s = addD(start, w * 7 + i); const inY = s.startsWith(String(y)); const fr = inY && s <= td ? frac(s, V.cFam) : 0; const col = V.cFam ? FAMILIES[V.cFam][1] : 'var(--gold)';
        cells += `<i title="${s}" class="${!inY ? 'x' : ''} ${upo(s) ? 'u' : ''}" style="${fr > 0 ? `background:color-mix(in srgb,${col} ${Math.round(20 + fr * 80)}%,var(--sf2))` : ''}"></i>`; } }
    h = `<div class="yr"><div class="ml">${months}</div><div class="g">${cells}</div></div><div class="legend"><span>Less</span>${[0, .25, .5, .75, 1].map(f => `<i style="background:${f ? `color-mix(in srgb,var(--gold) ${Math.round(20 + f * 80)}%,var(--sf2))` : 'var(--sf2)'}"></i>`).join('')}<span>More</span></div>
      <div class="pad chips"><button class="chip ${!V.cFam ? 'on' : ''}" data-fam="">All</button>${Object.entries(FAMILIES).map(([k, v]) => `<button class="chip ${V.cFam === k ? 'on' : ''}" data-fam="${k}"><i style="background:${v[1]}"></i>${esc(v[0])}</button>`).join('')}</div>`;
  }
  $('#c-body').innerHTML = h;
}
export function calClick(e) {
  const t = e.target;
  const wk = t.closest('[data-wk]'); if (wk) { const [s, k] = wk.dataset.wk.split('|'); const b = blockByKey(k); setTick(s, b, !isDone(s, b)); return true; }
  const dy = t.closest('[data-day]'); if (dy && (V.cMode !== 'week' || t.closest('.hd'))) { V.date = dy.dataset.day; V.pDate = dy.dataset.day; location.hash = 'today'; loadCal(V.date); return true; }
  const fm = t.closest('[data-fam]'); if (fm) { V.cFam = fm.dataset.fam || null; renderCal(); return true; }
  return false;
}

// ======================= PIN POTHA =======================
const TAGS = [['free', 'Note'], ['sermon', 'Sermon'], ['discussion', 'Discussion'], ['kasina', 'Kasina log'], ['reflection', 'Reflection'], ['checkin', 'Check-in'], ['lookback', 'Look-back']];
const TAGN = Object.fromEntries(TAGS);
const plain = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent.replace(/\s+/g, ' ').trim(); };
function noteCard(n) {
  const kas = n.tag === 'kasina' && n.kas ? ` · ${esc(n.kas.type || '')}${n.kas.stage ? ' · ' + esc(n.kas.stage) : ''}` : '';
  return `<article class="note" data-note="${esc(n.id)}"><span class="tg">${esc(TAGN[n.tag] || 'Note')}${n.speaker ? ' · ' + esc(n.speaker) : ''}${n.place ? ' · ' + esc(n.place) : ''}${kas}</span><b>${esc(n.title || 'Untitled')}</b><p>${esc(plain(n.html).slice(0, 200))}</p>${(n.photos || []).length ? `<div class="thumbs">${n.photos.map((p, i) => `<img alt="" data-pid="${esc(p.id)}" data-ph="${esc(n.id)}|${i}">`).join('')}</div>` : ''}<span class="stamp">${fmtStamp(n.ts)}</span></article>`;
}
async function hydrateImgs(root) { for (const img of root.querySelectorAll('img[data-pid]')) { if (img.src) continue; const id = img.dataset.pid; const n = Object.values(S.notes).find(x => x.photos?.some(p => p.id === id)); const p = n?.photos.find(p => p.id === id) || { id }; const u = await photoURL(p); if (u) img.src = u; else img.classList.add('missing'); } }
export function renderPotha() {
  $$('#p-seg button').forEach(b => b.classList.toggle('on', b.dataset.m === V.pMode));
  $('#p-day').hidden = V.pMode !== 'day'; $('#p-gallery').hidden = V.pMode !== 'gallery'; $('#p-search').hidden = V.pMode !== 'search';
  if (V.pMode === 'day') {
    $('#p-title').textContent = nice(V.pDate) + (V.pDate === today() ? ' · today' : '');
    const ns = notesOn(V.pDate);
    $('#p-notes').innerHTML = ns.length ? ns.map(noteCard).join('') : `<div class="empty"><p>No notes for this day yet.</p></div>`;
    hydrateImgs($('#p-notes'));
  } else if (V.pMode === 'gallery') {
    const ph = allNotes().flatMap(n => (n.photos || []).map((p, i) => ({ p, n, i, ts: p.ts || n.ts }))).sort((a, b) => b.ts - a.ts);
    $('#p-gal').innerHTML = ph.length ? ph.map(x => `<figure data-ph="${esc(x.n.id)}|${x.i}" data-gal="1"><img alt="" data-pid="${esc(x.p.id)}"><figcaption>${fmtStamp(x.ts)}</figcaption></figure>`).join('') : '<div class="empty"><p>Photos you attach to notes gather here, by date and time.</p></div>';
    hydrateImgs($('#p-gal'));
  } else {
    const q = V.q.toLowerCase().trim();
    const res = q ? allNotes().filter(n => (n.title + ' ' + plain(n.html) + ' ' + (TAGN[n.tag] || '') + ' ' + (n.speaker || '') + ' ' + (n.place || '')).toLowerCase().includes(q)).sort((a, b) => b.ts - a.ts) : [];
    $('#p-res').innerHTML = q ? (res.length ? res.map(noteCard).join('') : '<div class="empty"><p>Nothing found.</p></div>') : '<div class="empty"><p>Search every note, tag, speaker and place.</p></div>';
    hydrateImgs($('#p-res'));
  }
}
const clean = html => { const d = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html'); const ok = new Set(['DIV', 'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SPAN']); const walk = n => { [...n.childNodes].forEach(c => { if (c.nodeType === 1) { if (!ok.has(c.tagName)) { c.replaceWith(...c.childNodes); walk(n); return; } [...c.attributes].forEach(a => { if (!(a.name === 'class' && a.value === 'chk')) c.removeAttribute(a.name); }); walk(c); } else if (c.nodeType !== 3) c.remove(); }); }; walk(d.body.firstChild); return d.body.firstChild.innerHTML; };
const resize = file => new Promise(res => { const img = new Image(); const u = URL.createObjectURL(file); img.onload = () => { const s = Math.min(1, 2000 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => res(b || file), 'image/jpeg', 0.86); }; img.onerror = () => { URL.revokeObjectURL(u); res(file); }; img.src = u; });
let cur = null, saveT = null, dict = null;
export function openNote(n) {
  cur = JSON.parse(JSON.stringify(n)); const isS = ['sermon', 'discussion'].includes(n.tag), isK = n.tag === 'kasina';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  sheet(nice(n.date), `
    <input class="title-in" type="text" id="ed-title" value="${esc(n.title || '')}" placeholder="Title">
    <div class="grid2"><label class="f">Type<select id="ed-tag">${TAGS.map(t => `<option value="${t[0]}" ${t[0] === n.tag ? 'selected' : ''}>${t[1]}</option>`).join('')}</select></label><div></div></div>
    <div class="grid2" id="ed-sm" ${isS ? '' : 'hidden'}><label class="f">Speaker<input type="text" id="ed-sp" value="${esc(n.speaker || '')}"></label><label class="f">Place<input type="text" id="ed-pl" value="${esc(n.place || '')}"></label></div>
    <div class="grid2" id="ed-kas" ${isK ? '' : 'hidden'}><label class="f">Kasina<select id="ed-kt">${['Pathavī (earth)', 'Āpo (water)', 'Tejo (fire)', 'Vāyo (air)', 'Nīla (blue)', 'Pīta (yellow)', 'Lohita (red)', 'Odāta (white)', 'Āloka (light)', 'Ākāsa (space)'].map(x => `<option ${n.kas?.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="f">Sign<select id="ed-ks">${['', 'Preliminary sign (parikamma)', 'Learning sign (uggaha)', 'Counterpart sign (paṭibhāga)'].map(x => `<option ${n.kas?.stage === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
    <div class="tb" id="ed-tb"><button data-cmd="h3" title="Heading">H</button><button data-cmd="bold" title="Bold"><b>B</b></button><button data-cmd="italic" title="Italic"><i>I</i></button><button data-cmd="insertUnorderedList" title="Bullets">•</button><button data-cmd="insertOrderedList" title="Numbers">1.</button><button data-cmd="chk" title="Checkbox">☐</button><button data-cmd="quote" title="Quote">❝</button>${['ā', 'ī', 'ū', 'ṃ', 'ṅ', 'ñ', 'ṭ', 'ḍ', 'ṇ', 'ḷ'].map(c => `<button class="pali" data-ch="${c}">${c}</button>`).join('')}${SR ? '<button id="ed-mic" title="Dictate">Dictate</button>' : ''}<button id="ed-ph" title="Add photos">+ Photo</button></div>
    <div class="ed" id="ed" contenteditable="true" role="textbox" aria-multiline="true">${clean(n.html || '')}</div>
    <div class="thumbs big" id="ed-thumbs"></div>
    <div class="ed-foot"><span class="mini" id="ed-st">Saved as you write.</span><button class="btn sm ghost danger" id="ed-del">Delete note</button></div>`, { onClose: () => { clearTimeout(saveT); persist(); cur = null; if (dict) { try { dict.stop(); } catch (_) {} dict = null; } }, cls: 'editor' });
  const thumbs = () => { $('#ed-thumbs').innerHTML = (cur.photos || []).map((p, i) => `<img alt="" data-pid="${esc(p.id)}" data-edph="${i}">`).join(''); hydrateImgs($('#ed-thumbs')); };
  thumbs();
  const sched = () => { clearTimeout(saveT); $('#ed-st').textContent = 'Saving…'; saveT = setTimeout(() => { persist(); $('#ed-st').textContent = 'Saved.'; }, 900); };
  $('#ed').addEventListener('input', sched); $('#ed-title').addEventListener('input', sched);
  $('#ed-tag').onchange = e => { $('#ed-sm').hidden = !['sermon', 'discussion'].includes(e.target.value); $('#ed-kas').hidden = e.target.value !== 'kasina'; sched(); };
  ['ed-sp', 'ed-pl'].forEach(i => $('#' + i).addEventListener('input', sched)); ['ed-kt', 'ed-ks'].forEach(i => $('#' + i).addEventListener('change', sched));
  $('#ed').addEventListener('click', e => { const c = e.target.closest('.chk'); if (!c) return; const r = c.getBoundingClientRect(); if (e.clientX - r.left < 28) { c.textContent = c.textContent.startsWith('☐') ? '☑' + c.textContent.slice(1) : '☐' + c.textContent.slice(1); sched(); } });
  $('#ed-thumbs').addEventListener('click', e => { const im = e.target.closest('[data-edph]'); if (!im) return; viewer(cur.photos.map(p => ({ url: () => photoURL(p), cap: fmtStamp(p.ts || cur.ts) })), +im.dataset.edph); });
  $('#ed-tb').addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  $('#ed-tb').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'ed-ph') { $('#file').click(); return; }
    if (t.id === 'ed-mic') { toggleDictation(t); return; }
    $('#ed').focus(); const cmd = t.dataset.cmd, ch = t.dataset.ch;
    if (ch) document.execCommand('insertText', false, ch);
    else if (cmd === 'h3') document.execCommand('formatBlock', false, 'h3');
    else if (cmd === 'quote') document.execCommand('formatBlock', false, 'blockquote');
    else if (cmd === 'chk') document.execCommand('insertHTML', false, '<div class="chk">☐ </div>');
    else if (cmd) document.execCommand(cmd, false, null);
    sched();
  });
  $('#ed-del').onclick = async () => { const keep = cur; if (await confirmBox('Delete this note?', 'The note will be removed from every device. Its photos stay in your Drive.', 'Delete', 'Keep')) { deleteNote(keep); cur = null; toast('Note deleted'); render(); } else openNote(keep); };
  openNote.thumbs = thumbs;
}
function persist() {
  if (!cur || !$('#ed')) return;
  cur.html = clean($('#ed').innerHTML); cur.title = $('#ed-title').value.trim(); cur.tag = $('#ed-tag').value;
  cur.speaker = $('#ed-sp')?.value || ''; cur.place = $('#ed-pl')?.value || '';
  if (cur.tag === 'kasina') cur.kas = { type: $('#ed-kt').value, stage: $('#ed-ks').value };
  const empty = !cur.title && !plain(cur.html) && !(cur.photos || []).length; if (empty && !S.notes[cur.id]) return;
  saveNote(JSON.parse(JSON.stringify(cur)));
}
function toggleDictation(btn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  if (dict) { try { dict.stop(); } catch (_) {} dict = null; btn.classList.remove('on'); return; }
  dict = new SR(); dict.continuous = true; dict.interimResults = true; dict.lang = S.settings.dictLang || 'en-GB';
  dict.onresult = e => { let fin = ''; let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript; } if (interim) $('#ed-st').textContent = '… ' + interim; if (fin) { $('#ed').focus(); document.execCommand('insertText', false, fin.trim() + ' '); $('#ed').dispatchEvent(new Event('input')); } };
  dict.onend = () => { btn.classList.remove('on'); dict = null; };
  dict.onerror = e => { toast(e.error === 'not-allowed' ? 'Microphone permission declined' : 'Dictation stopped'); };
  try { dict.start(); btn.classList.add('on'); } catch (_) {}
}
export async function onFiles(files) {
  if (!cur) return;
  for (const f of files) { try { toast('Adding photo…'); const blob = await resize(f); const p = await addPhoto(blob); cur.photos = [...(cur.photos || []), p]; openNote.thumbs?.(); persist(); toast('Photo added'); } catch (e) { toast('Could not add photo'); } }
}
export function pothaClick(e) {
  const t = e.target;
  const ph = t.closest('[data-ph]'); if (ph) {
    const [id, i] = ph.dataset.ph.split('|'); const gal = !!t.closest('[data-gal]');
    const list = gal ? allNotes().flatMap(n => (n.photos || []).map(p => ({ p, n }))).sort((a, b) => (b.p.ts || b.n.ts) - (a.p.ts || a.n.ts)) : (S.notes[id].photos || []).map(p => ({ p, n: S.notes[id] }));
    const target = S.notes[id].photos[+i].id; const idx = Math.max(0, list.findIndex(x => x.p.id === target));
    viewer(list.map(x => ({ url: () => photoURL(x.p), cap: fmtStamp(x.p.ts || x.n.ts), note: x.n })), idx, n => openNote(n)); return true;
  }
  const nt = t.closest('[data-note]'); if (nt) { openNote(S.notes[nt.dataset.note]); return true; }
  return false;
}

// ======================= RUBRIC =======================
const tier = t => t === 's' ? '<span class="tier s">Sutta</span>' : t === 'c' ? '<span class="tier c">Commentary</span>' : '';
export function renderRubric() {
  const mine = S.cards.length ? `<div class="sec"><h2>Your skills</h2><span>${S.cards.length}</span></div><div class="rub">${S.cards.map(c => `<button class="rcard" data-card="${esc(c.id)}"><small>${esc(c.door || 'Skill')}</small><b>${esc(c.t)}</b><span>${esc(c.s || '')}</span></button>`).join('')}</div>` : '';
  $('#r-body').innerHTML = RUBRIC.map(x => `<div class="sec"><h2>${esc(x.title)}</h2><span>${x.cards.length}</span></div><div class="rub">${x.cards.map(c => `<button class="rcard" data-card="${esc(c.id)}"><small>${esc(c.k)} ${tier(c.tier)}</small><b>${esc(c.t)}</b><span>${esc(c.s)}</span></button>`).join('')}</div>`).join('') + mine;
}
export const findCard = id => { for (const x of RUBRIC) { const c = x.cards.find(c => c.id === id); if (c) return c; } return S.cards.find(c => c.id === id); };
export function openCard(c) {
  const li = a => a && a.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''; const own = S.cards.includes(c);
  sheet(c.t, `<div class="prose">${c.k && c.k !== c.t ? `<p class="pali big">${esc(c.k)}</p>` : ''}${c.def ? `<p>${esc(c.def)}</p>` : ''}${c.dont?.length ? `<h4>Don't</h4>${li(c.dont)}` : ''}${c.do?.length ? `<h4>Do</h4>${li(c.do)}` : ''}${c.best?.length ? `<h4>Best practice</h4>${li(c.best)}` : ''}${c.anis ? `<h4>Anisansa</h4><p>${esc(c.anis)}</p>` : ''}${c.mine ? `<h4>Your notes</h4><p style="white-space:pre-line">${esc(c.mine)}</p>` : ''}<p class="src">Source: ${esc(c.s || '')} ${tier(c.tier)}</p>${own ? `<button class="btn sm ghost danger" data-delcard="${esc(c.id)}">Remove this skill</button>` : ''}</div>`);
}
export function addSkill() {
  const b = sheet('Add a skill', `<label class="f">Name<input type="text" id="sk-t" placeholder="e.g. Patience in traffic"></label><label class="f">Door<select id="sk-d"><option>Body</option><option>Speech</option><option>Mind</option><option>Giving</option><option>Meditation</option><option>Household</option></select></label><label class="f">Do (one per line)<textarea id="sk-do" rows="3"></textarea></label><label class="f">Don't (one per line)<textarea id="sk-dont" rows="3"></textarea></label><label class="f">Source<input type="text" id="sk-s" placeholder="e.g. MN 21, or a teacher's talk"></label><label class="f">Anisansa<textarea id="sk-a" rows="2"></textarea></label><label class="f">Your notes<textarea id="sk-m" rows="3"></textarea></label><button class="btn" id="sk-save">Save skill</button>`);
  b.querySelector('#sk-save').onclick = () => { const t = $('#sk-t').value.trim(); if (!t) return toast('Give the skill a name'); const L = v => v.split('\n').map(x => x.trim()).filter(Boolean); saveCards([...S.cards, { id: uid('c'), t, k: t, door: $('#sk-d').value, do: L($('#sk-do').value), dont: L($('#sk-dont').value), s: $('#sk-s').value.trim(), anis: $('#sk-a').value.trim(), mine: $('#sk-m').value.trim() }]); closeSheet(); renderRubric(); toast('Skill added to the Rubric'); };
}

// ======================= SETTINGS =======================
export function openSettings() {
  const sy = S.sync; const st = { local: 'This device only', auth: 'Disconnected', syncing: 'Syncing…', ok: 'Synced', error: 'Sync error' }[sy.state] || sy.state;
  const tzs = ['Asia/Colombo', 'Europe/London', 'Asia/Dubai', 'Asia/Singapore', 'America/New_York'];
  const b = sheet('Settings', `
    <section class="set"><h3>Google</h3>
      <p class="kv"><span>Status</span><b>${esc(st)}${sy.at ? ' · ' + fmtStamp(sy.at) : ''}</b></p>${sy.msg && sy.state !== 'ok' ? `<p class="mini">${esc(sy.msg)}</p>` : ''}
      <div class="row-actions">${google_ready() ? `<button class="btn sm" data-act="sync">Sync now</button><button class="btn sm ghost" data-act="signout">Sign out</button>` : `<button class="btn sm" data-act="connect" ${clientId() ? '' : 'disabled'}>Connect Google</button>`}</div>
      <label class="f">OAuth client ID<input type="text" id="st-cid" value="${esc(S.settings.clientId || '')}" placeholder="${CONFIG.clientId ? 'Using the built-in ID' : '…apps.googleusercontent.com'}"></label>
      <label class="f">Practice calendar ID<input type="text" id="st-cal" value="${esc(S.settings.calId || '')}" placeholder="${CONFIG.calendarId ? 'Using the built-in calendar' : '…@group.calendar.google.com'}"></label>
      <p class="mini">Your notes, ticks, photos and schedule live in a folder called <b>The Path</b> in your Google Drive. The app can see only the files it creates there.</p>
    </section>
    <section class="set"><h3>Schedule</h3>
      <p class="mini">${S.settings.schedule?.length ? `Your own schedule: ${S.settings.schedule.length} practices.` : 'Using the starting template. Import your own from your practice calendar.'}</p>
      <div class="row-actions"><button class="btn sm" data-act="import" ${google_ready() && calId() ? '' : 'disabled'}>Import from Calendar</button><button class="btn sm ghost" data-act="editsched">Edit practices</button></div>
      <label class="f">Practice time zone<select id="st-tz">${[...new Set([getTZ(), ...tzs, deviceTZ()])].map(z => `<option ${z === getTZ() ? 'selected' : ''}>${z}</option>`).join('')}</select></label>
      <p class="mini">Times follow this zone wherever you are, like your Calendar. This device is set to ${esc(deviceTZ())}.</p>
    </section>
    <section class="set"><h3>Reading &amp; display</h3>
      <label class="f">Theme<select id="st-theme">${['system', 'light', 'dark'].map(x => `<option value="${x}" ${(S.settings.theme || 'system') === x ? 'selected' : ''}>${x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select></label>
      <label class="f">Dictation language<select id="st-dl">${[['en-GB', 'English (UK)'], ['en-US', 'English (US)'], ['si-LK', 'Sinhala']].map(([v, l]) => `<option value="${v}" ${(S.settings.dictLang || 'en-GB') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    </section>
    <section class="set"><h3>Your data</h3>
      <div class="row-actions"><button class="btn sm ghost" data-act="export">Download a backup</button><label class="btn sm ghost">Restore a backup<input type="file" id="st-imp" accept="application/json" hidden></label></div>
    </section>
    <section class="set"><h3>About</h3><p class="mini">The Path · ${esc(CONFIG.version)}. Built by Claude for C J Jayasooriya. Texts: Buddha Jayanti Tipiṭaka (tipitaka.lk, CC BY-ND 4.0), pitaka.lk modern Sinhala, Bhikkhu Sujato's translations and the Mahāsaṅgīti Pali (SuttaCentral, public domain).</p></section>`);
  b.querySelector('#st-cid').onchange = e => saveSettings({ clientId: e.target.value.trim() });
  b.querySelector('#st-cal').onchange = e => saveSettings({ calId: e.target.value.trim() });
  b.querySelector('#st-tz').onchange = e => { saveSettings({ tz: e.target.value }); V.date = today(); render(); };
  b.querySelector('#st-theme').onchange = e => { saveSettings({ theme: e.target.value }); applyTheme(); };
  b.querySelector('#st-dl').onchange = e => saveSettings({ dictLang: e.target.value });
  b.querySelector('#st-imp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); restore(j); toast('Backup restored'); closeSheet(); render(); } catch (_) { toast('That file is not a backup from The Path'); } };
}
const google_ready = () => S.sync.state === 'ok' || S.sync.state === 'syncing' || S.sync.state === 'error';
export function applyTheme() { const t = S.settings.theme || 'system'; if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
export async function settingsAct(act) {
  if (act === 'connect') { const ok = await connect(true); toast(ok ? 'Connected to Google' : (S.sync.msg || 'Could not connect')); closeSheet(); render(); }
  if (act === 'sync') { await pull(); await loadCal(V.date); toast(S.sync.state === 'ok' ? 'Synced' : 'Sync: ' + S.sync.msg); closeSheet(); render(); }
  if (act === 'signout') { disconnect(); toast('Signed out'); closeSheet(); render(); }
  if (act === 'import') { try { const n = await importSchedule(); toast(`Imported ${n} practices from your calendar`); closeSheet(); render(); } catch (e) { toast('Import failed: ' + e.message); } }
  if (act === 'editsched') editSchedule();
  if (act === 'export') exportBackup();
  if (act === 'calretry') loadCal(V.date);
  if (act === 'settings') openSettings();
  if (act === 'timer') openTimer(null);
}
function editSchedule() {
  const list = schedule();
  const b = sheet('Practices', `<p class="mini">Tap a practice to edit it. Changes stay in your Drive; your Google Calendar is not changed.</p><div class="slist">${list.map(x => `<button class="sitem" data-ed="${esc(x.k)}"><span class="stripe" style="--c:${GCOL[x.c]}"></span><span class="t">${x.t}</span><span class="n">${esc(x.name)}${x.dow ? ` <small>${x.dow.map(d => DOW[d].slice(0, 3)).join(', ')}</small>` : ''}</span><span class="m">${x.m}′</span></button>`).join('')}</div><div class="row-actions"><button class="btn sm" data-ed="__new">Add a practice</button>${S.settings.schedule?.length ? '<button class="btn sm ghost" id="sc-reset">Use the template</button>' : ''}</div>`, { wide: true });
  b.querySelectorAll('[data-ed]').forEach(el => el.onclick = () => editBlock(el.dataset.ed === '__new' ? null : list.find(x => x.k === el.dataset.ed)));
  const r = b.querySelector('#sc-reset'); if (r) r.onclick = async () => { if (await confirmBox('Use the template?', 'Your edited schedule will be replaced by the starting template. You can import from Calendar again any time.', 'Replace')) { saveSettings({ schedule: [] }); toast('Template restored'); render(); } };
}
function editBlock(x) {
  const isNew = !x; x = x || { k: uid('b'), t: '07:00', m: 15, title: '', c: '7', tool: '', a: 0 };
  const b = sheet(isNew ? 'New practice' : x.name, `
    <label class="f">Title (as in your Calendar)<input type="text" id="eb-title" value="${esc(x.title)}"></label>
    <div class="grid2"><label class="f">Time<input type="time" id="eb-t" value="${x.t}"></label><label class="f">Minutes<input type="number" id="eb-m" min="1" max="600" value="${x.m}"></label></div>
    <div class="grid2"><label class="f">Colour<select id="eb-c">${Object.keys(GCOL).filter(k => k !== '8').map(k => `<option value="${k}" ${k === x.c ? 'selected' : ''}>${GNAME[k]}</option>`).join('')}</select></label><label class="f">Tool<select id="eb-tool">${[['', 'None'], ['timer', 'Timer'], ['counter', 'Counter'], ['compass', 'Compass']].map(([v, l]) => `<option value="${v}" ${(x.tool || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <label class="f">Days<div class="chips" id="eb-dow">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip ${!x.dow || x.dow.includes(d) ? 'on' : ''}" data-d="${d}">${DOW[d].slice(0, 3)}</button>`).join('')}</div></label>
    <label class="chk-row"><input type="checkbox" id="eb-a" ${x.a ? 'checked' : ''}> Anchored: keep to the exact time</label>
    <label class="chk-row"><input type="checkbox" id="eb-steps" ${x.steps ? 'checked' : ''}> Worship steps (ticked one by one)</label>
    <label class="f">Guidance<textarea id="eb-d" rows="4">${esc(x.d || '')}</textarea></label>
    <div class="row-actions"><button class="btn" id="eb-save">Save</button>${isNew ? '' : '<button class="btn ghost danger" id="eb-del">Remove</button>'}</div>`);
  b.querySelector('#eb-dow').onclick = e => { const c = e.target.closest('[data-d]'); if (c) c.classList.toggle('on'); };
  b.querySelector('#eb-save').onclick = () => {
    const dow = [...b.querySelectorAll('#eb-dow .chip.on')].map(c => +c.dataset.d);
    const y = { ...x, title: $('#eb-title').value.trim() || 'Practice', t: $('#eb-t').value || '07:00', m: +$('#eb-m').value || 10, c: $('#eb-c').value, tool: $('#eb-tool').value || undefined, a: $('#eb-a').checked ? 1 : 0, d: $('#eb-d').value };
    if (dow.length && dow.length < 7) y.dow = dow.sort(); else delete y.dow;
    if ($('#eb-steps').checked) y.steps = mins(y.t) < 720 ? 'I' : 'II'; else delete y.steps;
    if (y.tool === 'counter') y.n = y.n || 21;
    delete y.name; delete y.fam;
    const base = (S.settings.schedule?.length ? S.settings.schedule : DEFAULT_SCHEDULE).filter(z => z.k !== x.k);
    saveSettings({ schedule: [...base, y].sort((a, c) => mins(a.t) - mins(c.t)) }); toast('Saved'); editSchedule(); render();
  };
  const del = b.querySelector('#eb-del'); if (del) del.onclick = () => { const base = (S.settings.schedule?.length ? S.settings.schedule : DEFAULT_SCHEDULE).filter(z => z.k !== x.k); saveSettings({ schedule: base }); toast('Removed'); editSchedule(); render(); };
}
async function exportBackup() {
  const photos = 'Photos are kept in your Drive and are not included in this file.';
  const data = { app: 'The Path', v: 1, at: new Date().toISOString(), note: photos, settings: S.settings, days: S.days, notes: S.notes, cards: S.cards };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `the-path-backup-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function restore(j) {
  if (j.app !== 'The Path') throw new Error('not a backup');
  for (const [k, v] of Object.entries(j.days || {})) editDay(k, x => Object.assign(x, v));
  for (const v of Object.values(j.notes || {})) if (!v.del) saveNote(v);
  if (j.cards) saveCards(j.cards);
  if (j.settings) saveSettings({ ...j.settings, clientId: S.settings.clientId || j.settings.clientId });
}

// ======================= render all =======================
export function render() { renderToday(); renderCal(); renderPotha(); renderRubric(); }
