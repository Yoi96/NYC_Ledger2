const CACHE_NAME = 'nycledger-v1';
const FALLBACK_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/public/manifest.json',
  '/assets/icons/icon_192.png',
  '/assets/icons/icon_512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Try to fetch generated asset list from server (written during build)
    try {
      const res = await fetch('/sw-assets.json', { cache: 'no-store' });
      if (res.ok) {
        const assets = await res.json();
        const toPrecache = Array.from(new Set([...FALLBACK_ASSETS, ...assets]));
        await cache.addAll(toPrecache);
        return;
      }
    } catch (err) {
      // ignore and fall back to FALLBACK_ASSETS
    }
    await cache.addAll(FALLBACK_ASSETS);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(async () => {
        const cachedReq = await caches.match(request);
        if (cachedReq) return cachedReq;
        const cachedIndex = await caches.match('/index.html');
        if (cachedIndex) return cachedIndex;
        return caches.match('/offline.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(request, networkResponse.clone()); } catch (err) {}
          return networkResponse;
        });
      }).catch(() => caches.match('/offline.html'));
    })
  );
});
