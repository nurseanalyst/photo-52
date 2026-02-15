const CACHE_NAME = 'photo52-v3';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon-180.png',
  './icon-192.svg',
  './icon-512.svg',
  './js/app.js',
  './js/db.js',
  './js/photo.js',
  './js/prompts.js',
  './js/progress.js',
  './js/gallery.js',
  './js/upload.js',
  './js/cloudinary.js',
  './js/ui.js',
  './js/export.js',
  './js/settings.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for CDN resources
  if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});