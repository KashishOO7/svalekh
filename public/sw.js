const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const CACHE_NAME = 'svalekh-cache-v4';

const CORE_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(CORE_ASSETS.map((a) => cache.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => (name !== CACHE_NAME ? caches.delete(name) : undefined)))
    )
  );
  self.clients.claim();
});

function isCacheable(request, response) {
  return (
    request.method === 'GET' &&
    response &&
    response.ok &&
    response.type === 'basic'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.url.indexOf('http') !== 0) return;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((networkResponse) => {
          if (isCacheable(request, networkResponse)) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match(`${BASE}/index.html`);
          return new Response('', { status: 503, statusText: 'Offline' });
        });
    })
  );
});