// KaagazMitra PWA Service Worker
// Combined offline experience: Offline page + cached pages

const CACHE = "pwabuilder-offline-page";
const offlineFallbackPage = "offline.html";

// Pages to pre-cache
const pagesToCache = [
  "/",
  "/index.html",
  offlineFallbackPage
];

// Install event - cache homepage and offline.html
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(pagesToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Enable Workbox navigation preload
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Cache strategy for all requests
workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

// Fetch event - serve cached pages or offline.html
self.addEventListener("fetch", (event) => {
  // Only handle page navigations
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        // Try navigation preload response first
        const preloadResp = await event.preloadResponse;
        if (preloadResp) return preloadResp;

        // Try network
        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        // If network fails, check cache
        const cache = await caches.open(CACHE);
        let cachedResp = await cache.match(event.request);

        // If not cached, serve offline.html
        if (!cachedResp) {
          cachedResp = await cache.match(offlineFallbackPage);
        }

        return cachedResp;
      }
    })());
  }
});
