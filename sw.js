// Offline cache for the app shell. Photos live in IndexedDB on the device.
const CACHE = 'closia-v1';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest', './IBMPlexSansArabic-Medium.ttf', './fonts/alexandria-arabic-400-normal.woff2', './fonts/alexandria-arabic-600-normal.woff2', './fonts/alexandria-arabic-800-normal.woff2',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // network first so updates arrive, cache as fallback for offline use
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
