const CACHE = "healthplus-vector-v13-stability";
const V = "20260904-11";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260904-4",
  "./healthplus.css?v=20260904-4",
  "./minimal-redesign.css?v=20260904-4",
  `./unified-minimal.css?v=${V}`,
  `./final-ui.css?v=${V}`,
  `./experience-v2.css?v=${V}`,
  `./onboarding.css?v=${V}`,
  `./quality-v5.css?v=${V}`,
  `./stability-v6.css?v=${V}`,
  "./app.js?v=20260904-4",
  "./healthplus.js?v=20260904-4",
  "./minimal-redesign.js?v=20260904-4",
  `./unified-minimal.js?v=${V}`,
  `./final-ui.js?v=${V}`,
  `./experience-v2.js?v=${V}`,
  `./onboarding.js?v=${V}`,
  `./quality-v5.js?v=${V}`,
  `./stability-v6.js?v=${V}`,
  `./manifest.webmanifest?v=${V}`,
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
    event.respondWith(fetch(event.request, {cache:"no-store"}).then(updateCache).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(updateCache)));
});
