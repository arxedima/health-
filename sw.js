const CACHE='iris-v3.9.0-journal';
const CORE=[
  '/health-/?v=39&music=4',
  '/health-/index.html?v=39&music=4',
  '/health-/styles.css?v=iris39',
  '/health-/journal.css?v=iris39',
  '/health-/iris-data.js?v=iris39',
  '/health-/iris-journal.js?v=iris39',
  '/health-/iris-engine.js?v=iris39',
  '/health-/music-override.js?v=blackglass4',
  '/health-/black-glass-30s-v1/p00.b64?v=4',
  '/health-/black-glass-30s-v1/p01.b64?v=4',
  '/health-/black-glass-30s-v1/p02.b64?v=4',
  '/health-/black-glass-30s-v1/p03.b64?v=4',
  '/health-/black-glass-30s-v1/p04.b64?v=4',
  '/health-/black-glass-30s-v1/p05.b64?v=4',
  '/health-/black-glass-30s-v1/p06.b64?v=4',
  '/health-/iris-v11.js?v=iris39',
  '/health-/iris-v23.js?v=iris39',
  '/health-/iris-v24.js?v=iris39',
  '/health-/manifest.webmanifest?v=iris39-icon22',
  '/health-/app-icon.png?v=22',
  '/health-/app-icon-192.png?v=22',
  '/health-/apple-touch-icon.png?v=22'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('iris-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(response=>response||caches.match('/health-/?v=39&music=4'))));
});