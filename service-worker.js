// Service Worker with pre-caching and offline fallback

const CACHE = "pwabuilder-offline-page";
const offlineFallbackPage = "offline.html";

// List of pages to pre-cache
const pagesToCache = [
  "/",
  "/index.html",
  offlineFallbackPage
];

// Install event - cache offline page and homepage
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(pagesToCache))
  );
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Enable navigation preload if supported
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Cache strategies for all requests
workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

// Fetch event - handle offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) return preloadResp;

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE);
        // Return cached page if available, otherwise offline.html
        const cachedResp = await cache.match(event.request) || await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});
