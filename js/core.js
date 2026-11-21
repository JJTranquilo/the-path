// Core utilities: DOM, dates in the practice time zone, markdown, IndexedDB, Google APIs.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad2 = n => String(n).padStart(2, '0');
export const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- dates (all schedule logic runs in one practice time zone) ----------
let TZ = 'Asia/Colombo';
export const setTZ = z => { TZ = z || 'Asia/Colombo'; };
export const getTZ = () => TZ;
const fmtCache = {};
function partsIn(d, tz = TZ) {
  const f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }));
  const o = {}; for (const p of f.formatToParts(d)) o[p.type] = p.value; return o;
}
export function zNow(d = new Date()) {
  const p = partsIn(d); const date = `${p.year}-${p.month}-${p.day}`;
  const hh = +p.hour, mm = +p.minute;
  return { date, hh, mm, min: hh * 60 + mm, sec: +p.second, dow: dowOf(date) };
}
export const deviceTZ = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
export const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const fmtD = d => d.toISOString().slice(0, 10);
export const addD = (s, n) => { const d = parseD(s); d.setUTCDate(d.getUTCDate() + n); return fmtD(d); };
export const dowOf = s => parseD(s).getUTCDay();
export const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const nice = s => { const d = parseD(s); return DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
export const short = s => { const d = parseD(s); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()].slice(0, 3); };
export const weekStart = s => addD(s, -((dowOf(s) + 6) % 7));
export function tzOffset(dateStr, tz = TZ) { // "+05:30"
  const noon = new Date(dateStr + 'T12:00:00Z'); const p = partsIn(noon, tz);
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  const off = Math.round((local - noon.getTime()) / 60000); const s = off >= 0 ? '+' : '-'; const a = Math.abs(off);
  return `${s}${pad2(Math.floor(a / 60))}:${pad2(a % 60)}`;
}
export const fmtTime = ts => { const p = partsIn(new Date(ts)); return `${p.hour}:${p.minute}`; };
export const fmtStamp = ts => { const p = partsIn(new Date(ts)); return `${+p.day} ${MON[+p.month - 1].slice(0, 3)} ${p.year} · ${p.hour}:${p.minute}`; };

// ---------- a small markdown renderer ----------
function inline(s) {
  s = esc(s);
  s = s.replace(/\[\[([a-z0-9.]+)\]\]/g, (_, id) => `<a class="xref" data-sutta="${id}" href="#library/${id}">${id.replace(/^([a-z]+)/, m => ({ dn: 'DN ', mn: 'MN ', sn: 'SN ', an: 'AN ', snp: 'Snp ', kp: 'Khp ', ja: 'Jā ' }[m] || m)).replace(/x$/, '')}</a>`);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>');
  return s;
}
export function md(src) {
  const lines = String(src || '').split('\n'); const out = []; let i = 0;
  while (i < lines.length) {
    let l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^---+$/.test(l.trim())) { out.push('<hr>'); i++; continue; }
    let m;
    if ((m = l.match(/^(#{2,4})\s+(.*)/))) { const n = m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue; }
    if (l.startsWith('|')) {
      const rows = []; while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]); const body = rows.slice(2).map(cells);
      out.push(`<div class="tblwrap"><table><thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (l.startsWith('>')) { const q = []; while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i++; } out.push(`<blockquote>${q.map(inline).join('<br>')}</blockquote>`); continue; }
    if (/^- /.test(l)) { const it = []; while (i < lines.length && /^- /.test(lines[i])) { it.push(lines[i].slice(2)); i++; } out.push(`<ul>${it.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`); continue; }
    if (/^\d+\.\s/.test(l)) { const it = []; while (i < lines.length && /^\d+\.\s/.test(lines[i])) { it.push(lines[i].replace(/^\d+\.\s/, '')); i++; } out.push(`<ol>${it.map(x => `<li>${inline(x)}</li>`).join('')}</ol>`); continue; }
    const para = []; while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|>|- |\d+\.\s|\||---+$)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('');
}

// ---------- IndexedDB ----------
let _db;
function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((res, rej) => {
    const r = indexedDB.open('thepath', 1);
    r.onupgradeneeded = () => { const d = r.result; for (const s of ['days', 'notes', 'meta', 'photos']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); };
    r.onsuccess = () => { _db = r.result; res(_db); }; r.onerror = () => rej(r.error);
  });
}
const tx = (store, mode, fn) => openDB().then(d => new Promise((res, rej) => { const t = d.transaction(store, mode); const s = t.objectStore(store); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }));
export const idb = {
  get: (s, k) => tx(s, 'readonly', st => st.get(k)),
  put: (s, k, v) => tx(s, 'readwrite', st => st.put(v, k)),
  del: (s, k) => tx(s, 'readwrite', st => st.delete(k)),
  all: s => openDB().then(d => new Promise((res, rej) => { const out = []; const t = d.transaction(s, 'readonly'); const c = t.objectStore(s).openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else res(out); }; c.onerror = () => rej(c.error); })),
};

// ---------- Google: identity, Calendar, Drive ----------
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file';
let tokenClient = null, token = null, expiry = 0, pending = null;
try { const t = JSON.parse(localStorage.getItem('tp.tok') || 'null'); if (t && t.e > Date.now() + 60000) { token = t.t; expiry = t.e; } } catch (_) {}
function loadGIS() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error('gis')); document.head.appendChild(s); });
}
export const google = {
  hasToken: () => !!token && expiry > Date.now() + 30000,
  async init(clientId) {
    if (!clientId) throw Object.assign(new Error('No client ID'), { code: 'noclient' });
    await loadGIS();
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: SCOPES,
      callback: r => { if (r.error) { pending?.rej(Object.assign(new Error(r.error), { code: r.error })); } else { token = r.access_token; expiry = Date.now() + (r.expires_in - 60) * 1000; try { localStorage.setItem('tp.tok', JSON.stringify({ t: token, e: expiry })); } catch (_) {} pending?.res(token); } pending = null; },
      error_callback: e => { pending?.rej(Object.assign(new Error(e.type || 'popup'), { code: e.type || 'popup' })); pending = null; },
    });
  },
  signIn(prompt = '') { return new Promise((res, rej) => { if (!tokenClient) return rej(Object.assign(new Error('not ready'), { code: 'noclient' })); pending = { res, rej }; tokenClient.requestAccessToken({ prompt }); }); },
  signOut() { if (token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(token, () => {}); token = null; expiry = 0; localStorage.removeItem('tp.tok'); },
  async fetch(url, opts = {}) {
    if (!google.hasToken()) throw Object.assign(new Error('auth'), { code: 'auth' });
    const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + token } });
    if (r.status === 401) { token = null; localStorage.removeItem('tp.tok'); throw Object.assign(new Error('auth'), { code: 'auth' }); }
    if (!r.ok) { let m = r.status + ''; try { const j = await r.json(); m = j.error?.message || m; } catch (_) {} throw Object.assign(new Error(m), { code: 'http', status: r.status }); }
    return r;
  },
};
const CAL = 'https://www.googleapis.com/calendar/v3';
export const calendar = {
  async list(calId, startDate, days, tz) {
    const off = tzOffset(startDate, tz);
    const q = new URLSearchParams({ timeMin: `${startDate}T00:00:00${off}`, timeMax: `${addD(startDate, days)}T00:00:00${tzOffset(addD(startDate, days), tz)}`, singleEvents: 'true', orderBy: 'startTime', maxResults: '2500', timeZone: tz });
    const r = await google.fetch(`${CAL}/calendars/${encodeURIComponent(calId)}/events?${q}`); return (await r.json()).items || [];
  },
  async patch(calId, eventId, body) {
    const r = await google.fetch(`${CAL}/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json();
  },
};
const DRV = 'https://www.googleapis.com/drive/v3', UP = 'https://www.googleapis.com/upload/drive/v3';
const qs = o => new URLSearchParams(o).toString();
export const drive = {
  async find(q) { const r = await google.fetch(`${DRV}/files?${qs({ q, fields: 'files(id,name,modifiedTime,mimeType)', pageSize: '1000', spaces: 'drive' })}`); return (await r.json()).files || []; },
  async folder(name, parent) {
    const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false` + (parent ? ` and '${parent}' in parents` : '');
    const f = await drive.find(q); if (f.length) return f[0].id;
    const r = await google.fetch(`${DRV}/files?fields=id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', ...(parent ? { parents: [parent] } : {}) }) });
    return (await r.json()).id;
  },
  list: folderId => drive.find(`'${folderId}' in parents and trashed=false`),
  async readJSON(id) { const r = await google.fetch(`${DRV}/files/${id}?alt=media`); const t = await r.text(); try { return JSON.parse(t || '{}'); } catch (_) { return {}; } },
  async create(name, parent, body, mime) {
    const meta = { name, parents: [parent], mimeType: mime }; const b = 'tp' + Math.random().toString(36).slice(2);
    const blob = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`, body, `\r\n--${b}--`]);
    const r = await google.fetch(`${UP}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body: blob });
    return (await r.json()).id;
  },
  createJSON: (name, parent, obj) => drive.create(name, parent, JSON.stringify(obj), 'application/json'),
  async updateJSON(id, obj) { await google.fetch(`${UP}/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }); },
  async blob(id) { const r = await google.fetch(`${DRV}/files/${id}?alt=media`); return r.blob(); },
};

// ---------- moon phases (Meeus, Astronomical Algorithms ch. 49) for uposatha days ----------
export function moonPhases(fromDate, toDate, tz = TZ) {
  const rad = x => x * Math.PI / 180; const out = [];
  const y0 = parseD(fromDate).getUTCFullYear() + parseD(fromDate).getUTCMonth() / 12 - 0.1;
  let k0 = Math.floor((y0 - 2000) * 12.3685);
  for (let k = k0; ; k += 0.25) {
    const T = k / 1236.85, ph = ((k % 1) + 1) % 1;
    let JDE = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = rad(2.5534 + 29.1053567 * k - 0.0000014 * T * T), Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3);
    const F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3), Om = rad(124.7746 - 1.56375588 * k + 0.0020672 * T * T);
    const S = Math.sin; let c;
    if (ph === 0 || ph === 0.5) {
      const a = ph === 0 ? [-0.40720, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208] : [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209];
      c = a[0] * S(Mp) + a[1] * E * S(M) + a[2] * S(2 * Mp) + a[3] * S(2 * F) + a[4] * E * S(Mp - M) + a[5] * E * S(Mp + M) + a[6] * E * E * S(2 * M)
        - 0.00111 * S(Mp - 2 * F) - 0.00057 * S(Mp + 2 * F) + 0.00056 * E * S(2 * Mp + M) - 0.00042 * S(3 * Mp) + 0.00042 * E * S(M + 2 * F) + 0.00038 * E * S(M - 2 * F) - 0.00024 * E * S(2 * Mp - M) - 0.00017 * S(Om);
    } else {
      c = -0.62801 * S(Mp) + 0.17172 * E * S(M) - 0.01183 * E * S(Mp + M) + 0.00862 * S(2 * Mp) + 0.00804 * S(2 * F) + 0.00454 * E * S(Mp - M) + 0.00204 * E * E * S(2 * M)
        - 0.0018 * S(Mp - 2 * F) - 0.0007 * S(Mp + 2 * F) - 0.0004 * S(3 * Mp) - 0.00034 * E * S(2 * Mp - M) + 0.00032 * E * S(M + 2 * F) + 0.00032 * E * S(M - 2 * F) - 0.00028 * E * E * S(Mp + 2 * M) + 0.00027 * E * S(2 * Mp + M) - 0.00017 * S(Om);
      const W = 0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp) - 0.00002 * Math.cos(Mp - M) + 0.00002 * Math.cos(Mp + M) + 0.00002 * Math.cos(2 * F);
      c += ph === 0.25 ? W : -W;
    }
    JDE += c;
    const ms = (JDE - 2440587.5) * 86400000 - 69000; const p = partsIn(new Date(ms), tz); const date = `${p.year}-${p.month}-${p.day}`;
    if (date > toDate) break;
    if (date >= fromDate) out.push({ date, kind: ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'][ph * 4], time: `${p.hour}:${p.minute}` });
    if (k - k0 > 200) break;
  }
  return out;
}
