// Meditation tools: temple-bell timer, recitation counter, Ruwanwelisaya compass.
import { $, esc, pad2, zNow } from './core.js';
import { S, isDone, setTick, logSession, saveSettings } from './store.js';
import { sheet, closeSheet, toast, buzz, wake } from './ui.js';
import { STUPA, PLACES } from './data.js';

// ---------- bell: inharmonic partials like a bronze bowl, with a soft strike ----------
let actx = null, keep = null;
const ctx = () => { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; };
export function bell(when = 0, vol = 0.5, pitch = 1) {
  try {
    const c = ctx(); const t0 = c.currentTime + when; const out = c.createGain(); out.gain.value = vol; out.connect(c.destination);
    const f0 = 207 * pitch;
    [[1, 1, 9], [1.003, 0.5, 8], [2.72, 0.42, 6], [2.73, 0.2, 5.5], [5.16, 0.22, 3.6], [8.42, 0.1, 2.2], [11.9, 0.05, 1.4]].forEach(([r, a, d]) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f0 * r;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(a, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g).connect(out); o.start(t0); o.stop(t0 + d + 0.1);
    });
    const n = c.createBufferSource(), nb = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate), ch = nb.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.008));
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.2; const ng = c.createGain(); ng.gain.value = 0.25;
    n.buffer = nb; n.connect(bp).connect(ng).connect(out); n.start(t0);
  } catch (_) {}
}
// A near-silent tone keeps the page "playing audio" so timers stay accurate with the screen off.
function keepAlive(on) {
  try {
    if (on && !keep) { const c = ctx(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 22; g.gain.value = 0.0008; o.connect(g).connect(c.destination); o.start(); keep = { o, g }; }
    else if (!on && keep) { keep.o.stop(); keep = null; }
  } catch (_) {}
}
function media(title, state) {
  try { if (!('mediaSession' in navigator)) return; navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'The Path', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }); navigator.mediaSession.playbackState = state; } catch (_) {}
}

// ---------- timer ----------
let T = null; // active timer state survives the sheet closing
export function openTimer(b, date) {
  const prefs = S.settings.timer || {};
  const base = b ? Math.max(b.m || 10, 5) : (prefs.last || 10);
  if (!T || T.done) T = { b, date: date || zNow().date, dur: base * 60, left: base * 60, run: false, endAt: 0, prep: prefs.prep ?? 10, interval: prefs.interval || 0, nextInt: 0, phase: 'idle', done: false };
  const ring = () => {
    const el = $('#tm-ring'); if (!el) return;
    const f = T.phase === 'prep' ? 1 : T.left / T.dur; const C = 2 * Math.PI * 45; const L = Math.max(0, T.left);
    el.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" class="trk"/><circle cx="50" cy="50" r="45" class="arc" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - f)).toFixed(1)}"/></svg>
      <div class="rt"><b>${T.phase === 'prep' ? Math.ceil(T.prepLeft) : Math.floor(L / 60) + ':' + pad2(Math.floor(L % 60))}</b><small>${T.phase === 'prep' ? 'settle in' : T.run ? 'ends ' + endsAt() : T.done ? 'complete' : (T.dur / 60) + ' minutes'}</small></div>`;
    $('#tm-go').textContent = T.run ? 'Pause' : T.phase === 'running' && T.left < T.dur ? 'Resume' : T.done ? 'Again' : 'Begin';
    $('#tm-go').classList.toggle('ghost', T.run);
  };
  const endsAt = () => { const d = new Date(T.endAt); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
  const finish = () => {
    clearInterval(T.h); T.run = false; T.done = true; T.phase = 'done'; T.left = 0; keepAlive(false); wake(false); media('Sit complete', 'none');
    bell(0, 0.6); bell(3.2, 0.45); bell(6.4, 0.35); buzz([300, 200, 300]);
    logSession(T.date, T.b ? T.b.k : 'timer', T.dur / 60);
    if (T.b && !isDone(T.date, T.b)) setTick(T.date, T.b, true);
    if (document.visibilityState !== 'visible' && 'serviceWorker' in navigator && Notification?.permission === 'granted') navigator.serviceWorker.ready.then(r => r.showNotification('Sit complete', { body: (T.b ? T.b.name : 'Timer') + ' · Sādhu', icon: 'icons/icon-192.png', tag: 'timer' }));
    ring(); const m = $('#tm-msg'); if (m) m.textContent = 'Sit complete' + (T.b ? ' and ticked' : '') + '. Sādhu.';
  };
  const tick = () => {
    if (T.phase === 'prep') { T.prepLeft = (T.prepEnd - Date.now()) / 1000; if (T.prepLeft <= 0) { T.phase = 'running'; T.endAt = Date.now() + T.left * 1000; T.nextInt = T.interval ? T.dur - T.interval * 60 : -1; bell(0, 0.55); media((T.b ? T.b.name : 'Meditation') + ' · ' + T.dur / 60 + ' min', 'playing'); } ring(); return; }
    T.left = (T.endAt - Date.now()) / 1000;
    if (T.interval && T.left <= T.nextInt && T.nextInt > 0) { bell(0, 0.3, 1.5); T.nextInt -= T.interval * 60; }
    if (T.left <= 0) return finish();
    ring();
  };
  const start = () => {
    ctx(); if (T.done) { T.done = false; T.left = T.dur; T.phase = 'idle'; }
    T.run = true; wake(true); keepAlive(true);
    if (T.phase === 'idle' && T.prep > 0) { T.phase = 'prep'; T.prepEnd = Date.now() + T.prep * 1000; T.prepLeft = T.prep; }
    else { T.phase = 'running'; T.endAt = Date.now() + T.left * 1000; if (T.left === T.dur) { bell(0, 0.55); T.nextInt = T.interval ? T.dur - T.interval * 60 : -1; } }
    clearInterval(T.h); T.h = setInterval(tick, 200); ring();
  };
  const pause = () => { T.run = false; clearInterval(T.h); if (T.phase === 'prep') T.phase = 'idle'; else T.left = Math.max(0, (T.endAt - Date.now()) / 1000); keepAlive(false); wake(false); media('Paused', 'paused'); ring(); };
  const presets = [5, 10, 15, 20, 30, 45, 60];
  sheet(b ? b.name : 'Timer', `
    <div class="tool">
      <div class="ring" id="tm-ring"></div>
      <div class="chips center" id="tm-chips">${presets.map(m => `<button class="chip ${m * 60 === T.dur ? 'on' : ''}" data-min="${m}">${m}</button>`).join('')}<button class="chip" data-min="custom">Other</button></div>
      <div class="row-actions center"><button class="btn big" id="tm-go">Begin</button><button class="btn ghost" id="tm-stop">Reset</button></div>
      <p class="mini center" id="tm-msg">Screen stays on while you sit. Bells sound even with the screen locked if you keep the app open.</p>
      <details class="opts"><summary>Bells &amp; settling</summary>
        <label class="f">Settling time before the first bell<select id="tm-prep">${[0, 5, 10, 20, 30, 60].map(s => `<option value="${s}" ${s === T.prep ? 'selected' : ''}>${s ? s + ' seconds' : 'None'}</option>`).join('')}</select></label>
        <label class="f">Interval bell<select id="tm-int">${[0, 1, 2, 5, 10, 15].map(s => `<option value="${s}" ${s === T.interval ? 'selected' : ''}>${s ? 'Every ' + s + ' min' : 'None'}</option>`).join('')}</select></label>
        <button class="chip" id="tm-test">Hear the bell</button> ${'Notification' in window && Notification.permission !== 'granted' ? '<button class="chip" id="tm-notif">Notify me when a sit ends</button>' : ''}
      </details>
    </div>`, { onClose: () => { if (!T.run && !T.done) clearInterval(T.h); } });
  ring();
  $('#tm-chips').onclick = e => {
    const c = e.target.closest('[data-min]'); if (!c || T.run) return;
    let m = c.dataset.min; if (m === 'custom') { const inp = document.createElement('input'); inp.type = 'number'; inp.min = 1; inp.max = 240; inp.placeholder = 'Minutes'; inp.className = 'chip-input'; c.replaceWith(inp); inp.focus(); inp.onchange = () => { const v = Math.max(1, Math.min(240, +inp.value || 10)); T.dur = T.left = v * 60; T.phase = 'idle'; T.done = false; ring(); }; return; }
    T.dur = T.left = +m * 60; T.phase = 'idle'; T.done = false; saveSettings({ timer: { ...(S.settings.timer || {}), last: +m } });
    document.querySelectorAll('#tm-chips .chip').forEach(x => x.classList.toggle('on', x === c)); ring();
  };
  $('#tm-go').onclick = () => (T.run ? pause() : start());
  $('#tm-stop').onclick = () => { pause(); T.left = T.dur; T.phase = 'idle'; T.done = false; ring(); };
  $('#tm-prep').onchange = e => { T.prep = +e.target.value; saveSettings({ timer: { ...(S.settings.timer || {}), prep: T.prep } }); };
  $('#tm-int').onchange = e => { T.interval = +e.target.value; saveSettings({ timer: { ...(S.settings.timer || {}), interval: T.interval } }); };
  $('#tm-test').onclick = () => bell(0, 0.55);
  const nb = $('#tm-notif'); if (nb) nb.onclick = () => Notification.requestPermission().then(p => { toast(p === 'granted' ? 'You\'ll be notified when a sit ends' : 'Notifications declined'); nb.remove(); });
}
export const timerRunning = () => T && (T.run || T.phase === 'prep');

// ---------- counter ----------
export function openCounter(b, date) {
  let n = 0, goal = (b && b.n) || 21; const d = date || zNow().date;
  const beads = () => { const N = Math.min(goal, 108); let s = ''; for (let i = 0; i < N; i++) { const a = (i / N) * 2 * Math.PI - Math.PI / 2; const on = i < (n % (goal || 1) || (n >= goal && n > 0 ? N : 0)); s += `<circle cx="${(50 + 45 * Math.cos(a)).toFixed(2)}" cy="${(50 + 45 * Math.sin(a)).toFixed(2)}" r="${N > 40 ? 1.4 : 2.3}" class="${i < Math.min(n, goal) ? 'bon' : 'boff'}"/>`; } return s; };
  const draw = () => { $('#ct-n').textContent = n; $('#ct-g').textContent = 'of ' + goal; $('#ct-beads').innerHTML = beads(); };
  sheet(b ? b.name : 'Counter', `
    <div class="tool">
      <button class="counter" id="ct-btn" aria-label="Count one round"><svg viewBox="0 0 100 100" id="ct-beads" aria-hidden="true"></svg><span><b id="ct-n">0</b><small id="ct-g"></small></span></button>
      <div class="chips center" id="ct-chips">${[7, 21, 108].map(x => `<button class="chip ${x === goal ? 'on' : ''}" data-goal="${x}">${x}</button>`).join('')}<button class="chip" id="ct-undo">Undo</button><button class="chip" id="ct-reset">Reset</button></div>
      <p class="mini center" id="ct-msg">Tap anywhere on the circle, once per round. Volume keys don't work in web apps, so the whole circle is the button.</p>
    </div>`);
  draw();
  $('#ct-btn').onclick = () => { ctx(); n++; draw(); if (n === goal) { buzz([200, 100, 200, 100, 400]); bell(0, 0.5); $('#ct-msg').textContent = 'Complete' + (b ? ' and ticked' : '') + '. Sādhu.'; if (b && !isDone(d, b)) setTick(d, b, true); } else buzz(18); };
  $('#ct-undo').onclick = () => { n = Math.max(0, n - 1); draw(); };
  $('#ct-reset').onclick = () => { n = 0; draw(); $('#ct-msg').textContent = 'Tap the circle once per round.'; };
  $('#ct-chips').addEventListener('click', e => { const g = e.target.closest('[data-goal]'); if (!g) return; goal = +g.dataset.goal; document.querySelectorAll('#ct-chips [data-goal]').forEach(c => c.classList.toggle('on', c === g)); draw(); });
}

// ---------- compass ----------
const rad = x => x * Math.PI / 180;
export const bearing = (la1, lo1, la2, lo2) => { const y = Math.sin(rad(lo2 - lo1)) * Math.cos(rad(la2)); const x = Math.cos(rad(la1)) * Math.sin(rad(la2)) - Math.sin(rad(la1)) * Math.cos(rad(la2)) * Math.cos(rad(lo2 - lo1)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; };
export const dist = (la1, lo1, la2, lo2) => { const a = Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); };
const card16 = b => ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'][Math.round(b / 22.5) % 16];
export function openCompass(b, date) {
  const d = date || zNow().date; let loc = S.settings.loc || null; let heading = null, sx = 0, sy = 0, aligned = false, pros = 0, listening = false, gotAbs = false;
  const target = () => loc ? bearing(loc.lat, loc.lon, STUPA.lat, STUPA.lon) : null;
  const ticks = [...Array(72)].map((_, i) => { const a = rad(i * 5), r1 = i % 18 === 0 ? 74 : i % 2 === 0 ? 82 : 86; return `<line x1="${(100 + Math.sin(a) * r1).toFixed(1)}" y1="${(100 - Math.cos(a) * r1).toFixed(1)}" x2="${(100 + Math.sin(a) * 92).toFixed(1)}" y2="${(100 - Math.cos(a) * 92).toFixed(1)}" class="${i % 18 === 0 ? 'tk1' : 'tk'}"/>`; }).join('');
  const stupaIcon = `<g class="stupa"><path d="M-7 4 Q0 -10 7 4 Z"/><rect x="-2" y="-14" width="4" height="5" rx="1"/><path d="M0 -22 L1.6 -14 L-1.6 -14 Z"/><rect x="-9" y="4" width="18" height="3" rx="1"/></g>`;
  const draw = () => {
    const tb = target(); const rose = heading == null ? 0 : -heading;
    const delta = tb == null || heading == null ? null : ((tb - heading + 540) % 360) - 180;
    const isAl = delta != null && Math.abs(delta) < 5;
    if (isAl && !aligned) { buzz([60, 40, 60]); } aligned = isAl;
    $('#cp-dial').innerHTML = `<svg viewBox="0 0 200 200" class="${isAl ? 'aligned' : ''}">
      <circle cx="100" cy="100" r="96" class="rim"/>
      <g transform="rotate(${rose.toFixed(1)} 100 100)">${ticks}
        <text x="100" y="40" class="nn">N</text><text x="163" y="104" class="ee">E</text><text x="100" y="168" class="ee">S</text><text x="37" y="104" class="ee">W</text>
        ${tb != null ? `<g transform="rotate(${tb.toFixed(1)} 100 100)"><line x1="100" y1="100" x2="100" y2="30" class="ray"/><g transform="translate(100 24)">${stupaIcon}</g></g>` : ''}
      </g>
      <path d="M100 4 L106 18 L94 18 Z" class="me"/>
      <circle cx="100" cy="100" r="5" class="hub"/>
    </svg>`;
    const km = loc ? dist(loc.lat, loc.lon, STUPA.lat, STUPA.lon) : null;
    let txt;
    if (!loc) txt = 'Allow location, or choose where you are below.';
    else if (km < 1.5) txt = 'You are at Ruwanwelisaya. Face the dome.';
    else if (heading == null) txt = `Face <b>${Math.round(tb)}°</b>, ${card16(tb)}. ${listening ? 'Hold the phone flat to start the live compass…' : ''}`;
    else txt = isAl ? '<b class="gold">Facing Ruwanwelisaya</b>' : `Turn <b>${delta > 0 ? 'right' : 'left'} ${Math.abs(Math.round(delta))}°</b>`;
    $('#cp-txt').innerHTML = txt;
    $('#cp-sub').textContent = loc ? `${loc.name || 'Your location'} · ${Math.round(km).toLocaleString()} km · bearing ${Math.round(tb)}°` : '';
  };
  const onOri = e => {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (e.alpha != null && (e.absolute || e.type === 'deviceorientationabsolute')) { h = (360 - e.alpha) % 360; gotAbs = true; }
    else if (e.alpha != null && !gotAbs) return; // relative only: not a true compass
    if (h == null) return;
    const ang = (screen.orientation && screen.orientation.angle) || 0; h = (h + ang) % 360;
    sx = sx * 0.8 + Math.cos(rad(h)) * 0.2; sy = sy * 0.8 + Math.sin(rad(h)) * 0.2; heading = (Math.atan2(sy, sx) * 180 / Math.PI + 360) % 360;
    draw();
  };
  const startOri = async () => {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') { const p = await DeviceOrientationEvent.requestPermission(); if (p !== 'granted') { toast('Compass permission declined'); return; } } } catch (_) {}
    if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', onOri); else window.addEventListener('deviceorientation', onOri);
    listening = true; draw();
  };
  const locate = () => {
    if (!navigator.geolocation) return toast('Location not available');
    $('#cp-loc').textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(p => { loc = { lat: p.coords.latitude, lon: p.coords.longitude, name: 'Your location' }; saveSettings({ loc }); $('#cp-loc').textContent = 'Use my location'; draw(); },
      () => { $('#cp-loc').textContent = 'Use my location'; toast('Location declined. Choose a place below.'); }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 15 * 60000 });
  };
  sheet('Face Ruwanwelisaya', `
    <div class="tool">
      <div class="dial" id="cp-dial"></div>
      <p class="lead center" id="cp-txt"></p><p class="mini center" id="cp-sub"></p>
      <div class="row-actions center"><button class="btn" id="cp-live">Start live compass</button><button class="btn ghost" id="cp-loc">Use my location</button></div>
      <button class="counter small" id="cp-pro" aria-label="Count a prostration"><span><b id="cp-n">0</b><small>of 7 prostrations</small></span></button>
      <details class="opts"><summary>Choose a place instead</summary>
        <div class="chips">${PLACES.map(p => `<button class="chip" data-pl="${esc(p[0])}">${esc(p[0])}</button>`).join('')}</div>
        <p class="mini">For an accurate live compass, wave the phone in a figure of eight once to calibrate, and keep it away from metal and magnets.</p>
      </details>
    </div>`, { onClose: () => { window.removeEventListener('deviceorientationabsolute', onOri); window.removeEventListener('deviceorientation', onOri); } });
  draw(); if (!loc) locate();
  $('#cp-live').onclick = () => { startOri(); $('#cp-live').hidden = true; };
  $('#cp-loc').onclick = locate;
  document.querySelectorAll('[data-pl]').forEach(x => x.onclick = () => { const p = PLACES.find(q => q[0] === x.dataset.pl); loc = { lat: p[1], lon: p[2], name: p[0] }; saveSettings({ loc }); draw(); });
  $('#cp-pro').onclick = () => { if (pros >= 7) return; ctx(); pros++; $('#cp-n').textContent = pros; buzz(30); if (pros === 7) { bell(0, 0.5); buzz([200, 100, 400]); if (b && !isDone(d, b)) setTick(d, b, true); toast('Seven prostrations. Sādhu.'); } };
}
