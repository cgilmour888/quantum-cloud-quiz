const CACHE_NAME = 'quantum-cloud-quiz-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './assets/cloud-mark.svg',
  './assets/nimbus-supercell.png',
  './data/exams.json',
  './js/app.js',
  './js/analytics.js',
  './js/audio-engine.js',
  './js/certificate.js',
  './js/constants.js',
  './js/fx-engine.js',
  './js/progress-repository.js',
  './js/quiz-engine.js',
  './js/repository.js',
  './js/storage.js',
  './js/storm-engine.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
