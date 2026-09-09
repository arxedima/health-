const CACHE='iris-v2.0.0';
const CORE=[
  '/health-/?v=20',
  '/health-/index.html?v=20',
  '/health-/styles.css?v=iris20',
  '/health-/iris-engine.js?v=iris20',
  '/health-/iris-v11.js?v=iris20',
  '/health-/manifest.webmanifest?v=iris20',
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
  }).catch(()=>caches.match(event.request).then(response=>response||caches.match('/health-/?v=20'))));
});
