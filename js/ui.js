// Shared UI: sheets, toasts, confirm dialogs, haptics, wake lock, photo viewer.
import { $ } from './core.js';

let closeFn = null, stack = [];
export function sheet(title, html, { onClose, wide, cls } = {}) {
  const el = $('#sheet');
  if (el.classList.contains('on') && closeFn) stack.push(null); // nested: just replace
  $('#s-title').textContent = title; $('#s-body').innerHTML = html;
  el.querySelector('.pn').className = 'pn' + (wide ? ' wide' : '') + (cls ? ' ' + cls : '');
  el.classList.add('on'); document.body.classList.add('locked'); closeFn = onClose || null;
  $('#s-body').scrollTop = 0; el.querySelector('.pn').scrollTop = 0;
  return $('#s-body');
}
export function closeSheet() {
  const el = $('#sheet'); if (!el.classList.contains('on')) return;
  el.classList.remove('on'); document.body.classList.remove('locked');
  const f = closeFn; closeFn = null; if (f) f();
}
export const sheetOpen = () => $('#sheet').classList.contains('on');
export function toast(m, ms = 2600) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), ms); }
export function confirmBox(title, text, yes = 'Yes', no = 'Cancel') {
  return new Promise(res => {
    const b = sheet(title, `<p class="lead">${text}</p><div class="row-actions"><button class="btn" id="cf-y">${yes}</button><button class="btn ghost" id="cf-n">${no}</button></div>`, { onClose: () => res(false) });
    b.querySelector('#cf-y').onclick = () => { closeFn = null; closeSheet(); res(true); };
    b.querySelector('#cf-n').onclick = () => { closeFn = null; closeSheet(); res(false); };
  });
}
export const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
let lock = null;
export async function wake(on) {
  try {
    if (on && 'wakeLock' in navigator) { lock = await navigator.wakeLock.request('screen'); }
    else if (!on && lock) { await lock.release(); lock = null; }
  } catch (_) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && lock && lock.released) wake(true); });

// photo viewer
let vw = [], vi = 0, vOpenNote = null;
export function viewer(list, index, openNote) {
  vw = list; vi = index; vOpenNote = openNote; $('#viewer').classList.add('on'); showV();
}
async function showV() { const x = vw[vi]; if (!x) return; $('#vw-img').src = await x.url(); $('#vw-cap').textContent = `${vi + 1} / ${vw.length} · ${x.cap || ''}`; $('#vw-note').hidden = !vOpenNote || !x.note; }
export function initViewer() {
  $('#vw-prev').onclick = () => { vi = (vi - 1 + vw.length) % vw.length; showV(); };
  $('#vw-next').onclick = () => { vi = (vi + 1) % vw.length; showV(); };
  $('#vw-x').onclick = () => $('#viewer').classList.remove('on');
  $('#vw-note').onclick = () => { const x = vw[vi]; $('#viewer').classList.remove('on'); if (x?.note && vOpenNote) vOpenNote(x.note); };
  let x0 = null; const v = $('#viewer');
  v.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  v.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) (dx < 0 ? $('#vw-next') : $('#vw-prev')).click(); x0 = null; });
  $('#s-x').onclick = closeSheet;
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#viewer').classList.contains('on')) $('#viewer').classList.remove('on'); else closeSheet(); } });
}
