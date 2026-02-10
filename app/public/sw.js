const VERSION = '0.0.10';
const CACHE_NAME = 'suspension-control-v10';
const FONT_CACHE = 'suspension-fonts-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then(cache => {
          return cache.addAll(urlsToCache).catch(err => {
            console.log('Cache addAll error:', err);
            return Promise.resolve();
          });
        }),
      // Font files will be cached on-demand
      caches.open(FONT_CACHE).then(() => Promise.resolve())
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== FONT_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  if (!request.url.startsWith('http')) {
    return;
  }

  // Don't cache API requests to ESP32
  if (request.url.includes('/api') || request.url.includes('/ws')) {
    event.respondWith(fetch(request));
    return;
  }

  // Font files - cache first, always
  if (request.url.includes('.woff2') || request.url.includes('.woff')) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }

  // Navigation requests - network first, fallback to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Other requests - cache first, no HTML fallback
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
  );
});
