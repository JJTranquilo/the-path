// App state, local persistence (IndexedDB), Google Drive sync and Calendar ticks.
import { idb, google, calendar, drive, zNow, addD, mins, uid, setTZ, getTZ, moonPhases } from './core.js';
import { DEFAULT_SCHEDULE, displayName, familyOf, WSTEPS } from './data.js';
import { CONFIG } from '../config.js';

export const S = {
  settings: { u: 0 }, days: {}, notes: {}, cards: [], cardsU: 0, reflections: {}, upoCal: {},
  cal: {}, calState: 'off', calMsg: '', sync: { state: 'local', at: 0, msg: '' },
};
const listeners = new Set();
export const onChange = fn => listeners.add(fn);
const emit = what => listeners.forEach(f => { try { f(what); } catch (e) { console.error(e); } });

// ---------- settings ----------
export const clientId = () => S.settings.clientId || CONFIG.clientId || '';
export const calId = () => S.settings.calId || CONFIG.calendarId || '';
export const schedule = () => (S.settings.schedule && S.settings.schedule.length ? S.settings.schedule : DEFAULT_SCHEDULE).map(b => ({ ...b, name: b.name || displayName(b.title), fam: b.fam || familyOf(b) }));
export const blocksFor = date => { const dw = new Date(date + 'T00:00:00Z').getUTCDay(); return schedule().filter(b => !b.dow || b.dow.includes(dw)).sort((a, b) => mins(a.t) - mins(b.t)); };
export const blockByKey = k => schedule().find(b => b.k === k);

// ---------- load ----------
export async function load() {
  const [days, notes, meta] = await Promise.all([idb.all('days'), idb.all('notes'), idb.all('meta')]);
  for (const [k, v] of days) S.days[k] = v;
  for (const [k, v] of notes) S.notes[k] = v;
  const m = Object.fromEntries(meta);
  if (m.settings) S.settings = m.settings;
  if (m.cards) { S.cards = m.cards.list || []; S.cardsU = m.cards.u || 0; }
  if (m.reflections) S.reflections = m.reflections;
  if (m.upoCal) S.upoCal = m.upoCal;
  dirty = new Set(m.dirty || []); driveIds = m.driveIds || {};
  setTZ(S.settings.tz || CONFIG.tz);
}

// ---------- day records ----------
export const day = d => S.days[d] || { ticks: {}, steps: {} };
export function editDay(d, fn) { const x = S.days[d] = JSON.parse(JSON.stringify(day(d))); fn(x); x.u = Date.now(); idb.put('days', d, x); markDirty('days-' + d.slice(0, 7)); emit('days'); }
export function isDone(d, b) {
  const x = day(d);
  if (b.steps) { const a = (x.steps || {})[b.k] || []; if (a.filter(Boolean).length >= WSTEPS.length) return true; }
  if (x.ticks && x.ticks[b.k] !== undefined) return !!x.ticks[b.k];
  const ce = (S.cal[d] || {})[b.k]; return !!(ce && ce.done);
}
export async function setTick(d, b, val) {
  editDay(d, x => { x.ticks = x.ticks || {}; x.ticks[b.k] = val; if (b.steps && !val) { x.steps = x.steps || {}; x.steps[b.k] = []; } });
  const ce = (S.cal[d] || {})[b.k]; if (ce) ce.done = val;
  pushCal(d, b, val);
}
export function logSession(d, k, minutes) { editDay(d, x => { x.sessions = x.sessions || []; x.sessions.push({ k, m: Math.round(minutes * 10) / 10, at: Date.now() }); }); }

// ---------- notes ----------
export const notesOn = d => Object.values(S.notes).filter(n => !n.del && n.date === d).sort((a, b) => a.ts - b.ts);
export const allNotes = () => Object.values(S.notes).filter(n => !n.del);
export function saveNote(n) { n.u = Date.now(); S.notes[n.id] = n; idb.put('notes', n.id, n); markDirty('notes-' + n.date.slice(0, 7)); emit('notes'); }
export function deleteNote(n) { const t = { id: n.id, date: n.date, del: 1, u: Date.now() }; S.notes[n.id] = t; idb.put('notes', n.id, t); markDirty('notes-' + n.date.slice(0, 7)); emit('notes'); }
export const newNote = (date, tag = 'free', extra = {}) => ({ id: uid('n'), date, ts: Date.now(), tag, title: '', html: '', photos: [], ...extra });

// ---------- photos ----------
const urlCache = {};
export async function addPhoto(blob) {
  const id = uid('p'); await idb.put('photos', id, { blob, d: null, ts: Date.now() });
  uploadPhoto(id); return { id, ts: Date.now() };
}
export async function photoURL(p) {
  if (urlCache[p.id]) return urlCache[p.id];
  let rec = await idb.get('photos', p.id);
  if (!rec && p.d && google.hasToken()) { try { const blob = await drive.blob(p.d); rec = { blob, d: p.d, ts: p.ts }; await idb.put('photos', p.id, rec); } catch (_) {} }
  if (!rec) return null;
  return (urlCache[p.id] = URL.createObjectURL(rec.blob));
}
async function uploadPhoto(id) {
  if (!google.hasToken()) return;
  try {
    const rec = await idb.get('photos', id); if (!rec || rec.d) return;
    const root = await rootFolder(); const pf = await drive.folder('Photos', root);
    rec.d = await drive.create(id + '.jpg', pf, rec.blob, 'image/jpeg'); await idb.put('photos', id, rec);
    for (const n of Object.values(S.notes)) if (n.photos?.some(p => p.id === id)) { n.photos = n.photos.map(p => p.id === id ? { ...p, d: rec.d } : p); saveNote(n); }
  } catch (e) { console.warn('photo upload', e); }
}

// ---------- settings & cards ----------
export function saveSettings(patch) { Object.assign(S.settings, patch, { u: Date.now() }); idb.put('meta', 'settings', S.settings); setTZ(S.settings.tz || CONFIG.tz); markDirty('settings'); emit('settings'); }
export function saveCards(list) { S.cards = list; S.cardsU = Date.now(); idb.put('meta', 'cards', { list, u: S.cardsU }); markDirty('cards'); emit('cards'); }

// ---------- Drive sync ----------
let dirty = new Set(), driveIds = {}, flushT = null, root = null, syncing = false;
function markDirty(f) { dirty.add(f); idb.put('meta', 'dirty', [...dirty]); clearTimeout(flushT); flushT = setTimeout(() => flush(), 2500); }
async function rootFolder() { if (root) return root; root = await drive.folder('The Path'); return root; }
function setSync(state, msg = '') { S.sync = { state, at: state === 'ok' ? Date.now() : S.sync.at, msg }; emit('sync'); }
function collect(f) {
  if (f === 'settings') return S.settings;
  if (f === 'cards') return { list: S.cards, u: S.cardsU };
  const [kind, ym] = [f.slice(0, f.indexOf('-')), f.slice(f.indexOf('-') + 1)];
  const src = kind === 'days' ? S.days : S.notes; const o = {};
  for (const [k, v] of Object.entries(src)) if ((kind === 'days' ? k : v.date || '').startsWith(ym)) o[k] = v;
  return o;
}
export async function flush() {
  if (!google.hasToken() || syncing || !dirty.size) return;
  syncing = true; setSync('syncing');
  try {
    const r = await rootFolder();
    for (const f of [...dirty]) {
      const body = collect(f); const name = f + '.json';
      if (driveIds[f]) { try { await drive.updateJSON(driveIds[f], body); } catch (e) { if (e.status === 404) { delete driveIds[f]; } else throw e; } }
      if (!driveIds[f]) driveIds[f] = await drive.createJSON(name, r, body);
      dirty.delete(f);
    }
    idb.put('meta', 'dirty', [...dirty]); idb.put('meta', 'driveIds', driveIds); setSync('ok');
  } catch (e) { setSync(e.code === 'auth' ? 'auth' : 'error', e.message); }
  syncing = false;
}
function mergeMap(local, remote, store, fileKey) {
  let changed = false;
  for (const [k, rv] of Object.entries(remote || {})) {
    const lv = local[k];
    if (!lv || (rv.u || 0) > (lv.u || 0)) { local[k] = rv; idb.put(store, k, rv); changed = true; }
    else if ((lv.u || 0) > (rv.u || 0)) dirty.add(fileKey);
  }
  return changed;
}
export async function pull() {
  if (!google.hasToken()) return;
  setSync('syncing');
  try {
    const r = await rootFolder(); const files = await drive.list(r); const seen = new Set();
    for (const f of files) {
      const m = f.name.match(/^(days-\d{4}-\d{2}|notes-\d{4}-\d{2}|settings|cards|reflections)\.json$/); if (!m) continue;
      const key = m[1]; seen.add(key); driveIds[key] = f.id;
      const data = await drive.readJSON(f.id);
      if (key.startsWith('days-')) mergeMap(S.days, data, 'days', key);
      else if (key.startsWith('notes-')) mergeMap(S.notes, data, 'notes', key);
      else if (key === 'settings') { if ((data.u || 0) > (S.settings.u || 0)) { S.settings = data; idb.put('meta', 'settings', data); setTZ(data.tz || CONFIG.tz); } else if ((S.settings.u || 0) > (data.u || 0)) dirty.add('settings'); }
      else if (key === 'cards') { if ((data.u || 0) > S.cardsU) { S.cards = data.list || []; S.cardsU = data.u; idb.put('meta', 'cards', data); } else if (S.cardsU > (data.u || 0)) dirty.add('cards'); }
      else if (key === 'reflections') { S.reflections = data || {}; idb.put('meta', 'reflections', S.reflections); }
    }
    // local months not yet on Drive
    for (const d of Object.keys(S.days)) if (!seen.has('days-' + d.slice(0, 7))) dirty.add('days-' + d.slice(0, 7));
    for (const n of Object.values(S.notes)) if (n.date && !seen.has('notes-' + n.date.slice(0, 7))) dirty.add('notes-' + n.date.slice(0, 7));
    if (!seen.has('settings') && S.settings.u) dirty.add('settings');
    if (!seen.has('reflections')) { driveIds.reflections = await drive.createJSON('reflections.json', r, { _about: 'Weekly reflections written by Claude. Keys are week-start dates (Monday).' }); }
    idb.put('meta', 'driveIds', driveIds); idb.put('meta', 'dirty', [...dirty]);
    setSync('ok'); emit('all');
    // retry photos that never uploaded
    for (const [id, rec] of await idb.all('photos')) if (!rec.d) uploadPhoto(id);
    await flush();
  } catch (e) { setSync(e.code === 'auth' ? 'auth' : 'error', e.message); }
}
export async function connect(interactive) {
  const cid = clientId(); if (!cid) { setSync('local', 'Add your Google client ID in Settings to sync.'); return false; }
  try {
    await google.init(cid);
    if (!google.hasToken()) { if (!interactive) { setSync('auth', 'Tap to connect Google'); return false; } await google.signIn(S.settings.consented ? '' : 'consent'); if (!S.settings.consented) saveSettings({ consented: 1 }); }
    await pull(); loadCal(zNow().date); return true;
  } catch (e) { setSync(e.code === 'auth' || e.code === 'popup_closed' ? 'auth' : 'error', e.message); return false; }
}
export function disconnect() { google.signOut(); S.calState = 'off'; setSync('local', 'Signed out'); }

// ---------- Calendar ----------
const norm = t => displayName(String(t || '').replace(/^✓\s*/, '')).toLowerCase();
export async function loadCal(d) {
  if (!google.hasToken() || !calId()) { S.calState = 'off'; return; }
  try {
    const evs = await calendar.list(calId(), d, 1, getTZ()); const map = {}; const bl = blocksFor(d);
    for (const ev of evs) {
      const dt = ev.start?.dateTime; if (!dt) { if (/uposatha|poya/i.test(ev.summary || '') && ev.start?.date) { S.upoCal[ev.start.date] = ev.summary.replace(/^[^\p{L}]+/u, ''); } continue; }
      const hm = dt.slice(11, 16); const t = norm(ev.summary);
      const b = bl.find(x => x.t === hm && norm(x.title) === t) || bl.find(x => x.t === hm);
      if (b) map[b.k] = { id: ev.id, done: ev.colorId === '8' || /^✓/.test(ev.summary || '') };
    }
    S.cal[d] = map; S.calState = 'on'; S.calMsg = ''; emit('cal');
  } catch (e) { S.calState = 'err'; S.calMsg = e.code === 'auth' ? 'Calendar needs you to reconnect.' : 'Calendar unreachable: ' + e.message; emit('cal'); }
}
async function pushCal(d, b, done) {
  if (!google.hasToken() || !calId()) return;
  let ce = (S.cal[d] || {})[b.k]; if (!ce) { await loadCal(d); ce = (S.cal[d] || {})[b.k]; } if (!ce) return;
  try { await calendar.patch(calId(), ce.id, { colorId: done ? '8' : b.c, summary: done ? '✓ ' + b.title : b.title }); ce.done = done; }
  catch (e) { S.calState = 'err'; S.calMsg = 'Could not update Calendar: ' + e.message; emit('cal'); }
}
// Build a schedule from a week of the user's Path calendar.
export async function importSchedule() {
  const start = zNow().date; const evs = await calendar.list(calId(), start, 7, getTZ()); const g = {};
  for (const ev of evs) {
    if (!ev.start?.dateTime) { if (/uposatha|poya/i.test(ev.summary || '') && ev.start?.date) S.upoCal[ev.start.date] = ev.summary.replace(/^[^\p{L}]+/u, ''); continue; }
    const hm = ev.start.dateTime.slice(11, 16); const title = String(ev.summary || '').replace(/^✓\s*/, ''); const key = hm + '|' + title;
    const dur = Math.round((new Date(ev.end.dateTime) - new Date(ev.start.dateTime)) / 60000);
    const dw = new Date(ev.start.dateTime.slice(0, 10) + 'T00:00:00Z').getUTCDay();
    const x = g[key] || (g[key] = { t: hm, title, m: dur, c: ev.colorId && ev.colorId !== '8' ? ev.colorId : null, d: ev.description || '', dows: new Set(), a: !!(ev.reminders && !ev.reminders.useDefault && (ev.reminders.overrides || []).length) });
    x.dows.add(dw); if (!x.c && ev.colorId && ev.colorId !== '8') x.c = ev.colorId;
  }
  const old = Object.fromEntries(schedule().map(b => [norm(b.title), b]));
  const out = Object.values(g).map(x => {
    const t = x.title.toLowerCase(); const prev = old[norm(x.title)] || {};
    const b = { k: prev.k || (norm(x.title).replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + x.t.replace(':', '')), t: x.t, m: x.m, title: x.title, c: x.c || prev.c || '2', a: x.a ? 1 : 0 };
    if (x.dows.size < 7) b.dow = [...x.dows].sort();
    if (prev.tool) b.tool = prev.tool; else if (/vandana.*ruwanweli|ruwanweli/i.test(t)) b.tool = 'compass'; else if (/\b21\b/.test(t)) { b.tool = 'counter'; b.n = 21; } else if (/kasina|maithree|mett|anapana|ānāpāna|asubha|sakman|maranussati|maraṇ/.test(t)) b.tool = 'timer';
    if (prev.n) b.n = prev.n;
    if (/worship/.test(t)) b.steps = mins(x.t) < 720 ? 'I' : 'II';
    if (/check-in|look back|look forward|jolt/.test(t)) b.ci = 1;
    b.d = (x.d || prev.d || '').replace(/<[^>]+>/g, '').slice(0, 1200);
    return b;
  }).sort((a, b) => mins(a.t) - mins(b.t));
  idb.put('meta', 'upoCal', S.upoCal);
  saveSettings({ schedule: out });
  return out.length;
}

// ---------- uposatha ----------
let _phases = null;
export function upo(d) {
  if (S.upoCal[d]) return { label: S.upoCal[d], kind: /full/i.test(S.upoCal[d]) ? 'Full Moon' : /new/i.test(S.upoCal[d]) ? 'New Moon' : /first/i.test(S.upoCal[d]) ? 'First Quarter' : /last/i.test(S.upoCal[d]) ? 'Last Quarter' : 'Uposatha' };
  if (!_phases) { const t = zNow().date; _phases = Object.fromEntries(moonPhases(addD(t, -400), addD(t, 400)).map(p => [p.date, p])); }
  const p = _phases[d]; return p ? { label: p.kind, kind: p.kind } : null;
}
export const MOON = { 'Full Moon': '○', 'New Moon': '●', 'First Quarter': '◐', 'Last Quarter': '◑', 'Uposatha': '◌' };
