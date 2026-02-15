// Enhanced Service Worker with offline caching

const CACHE_NAME = 'glowmaxxed-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: pre-cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return clients.claim();
    })
  );
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Never cache OAuth redirects
  if (url.pathname.startsWith('/~oauth')) return;
  
  // Never cache Supabase API calls
  if (url.hostname.includes('supabase')) return;
  
  // Never cache POST/PUT/DELETE
  if (event.request.method !== 'GET') return;

  // For navigation requests: network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request).then(function(cached) {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // For static assets (images, fonts, CSS, JS): cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
});

// Push notifications
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Vergiss nicht, heute aktiv zu sein!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Öffnen' },
      { action: 'close', title: 'Später' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'GLOWMAXXED AI', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
