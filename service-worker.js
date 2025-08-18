// service-worker.js
const CACHE_NAME = "lita-cache-v1";
const ASSETS = [
  "./",
  "index.html",
  "signin.html",
  "admin.html",
  "member.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  // Tailwind is CDN; runtime-cached via fetch handler
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for HTML; cache-first fallback for others
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isHTML = req.headers.get("accept")?.includes("text/html");

  if (isHTML) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        }).catch(() => cached)
      )
    );
  }
});
