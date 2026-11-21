// Boot, routing and global events.
import { $, $$, zNow, addD } from './core.js';
import { S, load, onChange, connect, loadCal, flush, clientId } from './store.js';
import { V, render, renderToday, renderCal, renderPotha, renderRubric, todayClick, calClick, pothaClick, openNote, onFiles, findCard, openCard, addSkill, openSettings, settingsAct, applyTheme } from './views.js';
import { newNote, saveCards } from './store.js';
import { renderLibrary } from './library.js';
import { initViewer, closeSheet, toast } from './ui.js';
import { openTimer, openCounter, openCompass } from './tools.js';

const VIEWS = ['today', 'calendar', 'potha', 'rubric', 'library'];
function route() {
  const h = (location.hash || '#today').slice(1); const [v, ...rest] = h.split('/');
  const view = VIEWS.includes(v) ? v : 'today';
  $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + view));
  $$('nav.tabs a').forEach(a => a.classList.toggle('on', a.dataset.v === view));
  document.body.dataset.view = view;
  if (view === 'library') renderLibrary(rest.join('/'));
  else window.scrollTo(0, 0);
}

async function boot() {
  await load(); applyTheme();
  V.date = zNow().date; V.pDate = V.date; V.cRef = V.date;
  render(); route(); initViewer();
  window.addEventListener('hashchange', route);
  onChange(what => { if (what === 'sync') { renderToday(); return; } render(); });
  if (clientId()) connect(false);
  // day rollover and the Now card
  setInterval(() => { if (document.visibilityState !== 'visible') return; const t = zNow().date; if (V.date !== t && V.date === addD(t, -1)) { V.date = t; loadCal(t); } renderToday(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { renderToday(); if (S.sync.state === 'ok') loadCal(V.date); } else flush(); });
  // shortcuts from the manifest (?tool=timer etc.)
  const p = new URLSearchParams(location.search).get('tool');
  if (p === 'timer') openTimer(null); if (p === 'counter') openCounter(null); if (p === 'compass') openCompass(null);
  if (p === 'note') { location.hash = 'potha'; openNote(newNote(V.date)); }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

document.addEventListener('click', e => {
  const t = e.target;
  const act = t.closest('[data-act]'); if (act) { settingsAct(act.dataset.act); return; }
  if (t.closest('#v-today') && todayClick(e)) return;
  if (t.closest('#v-calendar') && calClick(e)) return;
  if ((t.closest('#v-potha') || t.closest('#v-today')) && pothaClick(e)) return;
  const cd = t.closest('[data-card]'); if (cd) { const c = findCard(cd.dataset.card); if (c) openCard(c); return; }
  const dc = t.closest('[data-delcard]'); if (dc) { saveCards(S.cards.filter(c => c.id !== dc.dataset.delcard)); closeSheet(); renderRubric(); return; }
  if (t.closest('.xref') && $('#sheet').classList.contains('on')) closeSheet();
});
document.addEventListener('change', e => { const ng = e.target.closest('[data-night]'); if (ng) import('./store.js').then(m => m.editDay(V.date, x => { x.night = { ...(x.night || {}), [ng.dataset.night]: ng.value === '' ? null : +ng.value }; })); });
$('#t-prev').onclick = () => { V.date = addD(V.date, -1); V.open = null; renderToday(); loadCal(V.date); };
$('#t-next').onclick = () => { V.date = addD(V.date, 1); V.open = null; renderToday(); loadCal(V.date); };
$('#t-home').onclick = () => { V.date = zNow().date; V.open = null; renderToday(); loadCal(V.date); };
$('#t-set').onclick = openSettings;
$('#t-tools').onclick = () => import('./ui.js').then(({ sheet }) => { const b = sheet('Tools', `<div class="toolgrid"><button data-t="timer"><b>Timer</b><span>Temple bells, interval bells, settling time</span></button><button data-t="counter"><b>Counter</b><span>7, 21 or 108 rounds</span></button><button data-t="compass"><b>Compass</b><span>Face Ruwanwelisaya</span></button><button data-t="note"><b>New note</b><span>Pin potha</span></button></div>`); b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { const k = x.dataset.t; if (k === 'timer') openTimer(null); if (k === 'counter') openCounter(null); if (k === 'compass') openCompass(null); if (k === 'note') { location.hash = 'potha'; openNote(newNote(V.pDate)); } }); });
$('#c-seg').onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; V.cMode = b.dataset.m; renderCal(); };
const shift = n => { const d = new Date(V.cRef + 'T00:00:00Z'); if (V.cMode === 'week') V.cRef = addD(V.cRef, 7 * n); else if (V.cMode === 'month') { d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n); V.cRef = d.toISOString().slice(0, 10); } else { V.cRef = (d.getUTCFullYear() + n) + '-01-01'; } renderCal(); };
$('#c-prev').onclick = () => shift(-1); $('#c-next').onclick = () => shift(1);
$('#p-seg').onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; V.pMode = b.dataset.m; renderPotha(); };
$('#p-prev').onclick = () => { V.pDate = addD(V.pDate, -1); renderPotha(); };
$('#p-next').onclick = () => { V.pDate = addD(V.pDate, 1); renderPotha(); };
$('#p-new').onclick = () => openNote(newNote(V.pDate));
$('#p-q').addEventListener('input', e => { V.q = e.target.value; renderPotha(); });
$('#r-add').onclick = addSkill;
$('#t-widgets').addEventListener('scroll', e => { const el = e.target; const i = Math.round(el.scrollLeft / (el.firstElementChild?.offsetWidth + 10 || 1)); [...document.querySelectorAll('#t-wdots i')].forEach((d, j) => d.classList.toggle('on', j === i)); }, { passive: true });
$('#file').addEventListener('change', e => { const f = [...e.target.files]; e.target.value = ''; onFiles(f); });

boot().catch(e => { console.error(e); toast('Something went wrong starting the app: ' + e.message, 6000); });
