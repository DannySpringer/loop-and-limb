// Offline support: precache the app shell, then cache everything else
// (models, thumbnails, the model-viewer library) the first time it's fetched.
// Bump VERSION when you deploy changes to force a refresh.
const VERSION = 'v20261013202408';
const SHELL = [
  './', 'index.html', 'exercise.html', 'program.html',
  'css/style.css', 'js/common.js', 'js/library.js', 'js/detail.js', 'js/program.js',
  'data/exercises.json', 'manifest.webmanifest', 'assets/icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Stale-while-revalidate: answer from cache instantly, refresh in the background.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: e.request.mode === 'navigate' });
      const network = fetch(e.request)
        .then((res) => { if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
