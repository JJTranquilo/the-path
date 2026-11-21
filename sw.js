// Offline support: the app shell is cached on install; library texts and fonts are cached as they are opened.
const V = 'tp-2.0.0';
const SHELL = ['./', 'index.html', 'css/app.css', 'config.js', 'js/app.js', 'js/core.js', 'js/data.js', 'js/store.js', 'js/ui.js', 'js/tools.js', 'js/views.js', 'js/library.js', 'library/index.json', 'img/hero.jpg', 'icons/icon-192.png', 'icons/icon-512.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'tp-runtime').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (/googleapis\.com$/.test(u.hostname) && !/fonts\.googleapis\.com$/.test(u.hostname)) return; // API calls: network only
  if (u.hostname === 'accounts.google.com') return;
  if (u.origin === location.origin) {
    // network first for code so updates arrive; fall back to cache offline
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(u.pathname.includes('/library/t/') ? 'tp-runtime' : V).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open('tp-runtime').then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }))));
  }
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./'))); });
