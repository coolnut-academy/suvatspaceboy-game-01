// ============================================================
// sw.js — Service Worker (Cache-first for offline play)
// ============================================================
const CACHE_NAME = 'suvat-v3';
const ASSETS = [
    './',
    './index.html',
    './css/style.css?v=3',
    './js/audio.js?v=3',
    './js/particles.js?v=3',
    './js/questions.js?v=3',
    './js/leaderboard.js?v=3',
    './js/game.js?v=3',
    './js/boss.js?v=3',
    './js/app.js?v=3',
    './assets/images/cover.png',
    './assets/images/player.png',
    './assets/images/background.png',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            }).catch(() => {
                // offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
