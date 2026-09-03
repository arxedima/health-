const CACHE = "vector-health-v7-final-minimal";
const V = "20260904-5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260904-4",
  "./healthplus.css?v=20260904-4",
  "./minimal-redesign.css?v=20260904-4",
  "./unified-minimal.css?v=20260904-4",
  "./final-ui.css?v=20260904-5",
  "./app.js?v=20260904-4",
  "./healthplus.js?v=20260904-4",
  "./minimal-redesign.js?v=20260904-4",
  "./unified-minimal.js?v=20260904-4",
  "./final-ui.js?v=20260904-5",
  "./manifest.webmanifest?v=20260904-4",
  "./assets/vector.svg",
  "./assets/balanced-meal.webp"
];
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener("activate", event => event.waitUntil(Promise.all([
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
  self.clients.claim()
])));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const updateCache = response => {
    if (!response || !response.ok) return response;
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  };
  if (event.request.mode === "navigate" || ["script", "style"].includes(event.request.destination)) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(updateCache)
        .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(updateCache)));
});
