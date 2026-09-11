const CACHE='iris-v3.7.0';
const CORE=[
  '/health-/?v=37',
  '/health-/index.html?v=37',
  '/health-/styles.css?v=iris37',
  '/health-/iris-engine.js?v=iris37',
  '/health-/iris-v11.js?v=iris37',
  '/health-/iris-v23.js?v=iris37',
  '/health-/iris-v24.js?v=iris37',
  '/health-/iris-v29.js?v=iris37',
  '/health-/iris-v30.js?v=iris37',
  '/health-/iris-v34.js?v=iris37',
  '/health-/iris-v36.js?v=iris37',
  '/health-/iris-v37.js?v=iris37',
  '/health-/manifest.webmanifest?v=iris37',
  '/health-/app-icon.png?v=20'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(response=>response||caches.match('/health-/?v=37'))));
});