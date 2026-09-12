const CACHE='iris-v3.8.6-blackglass-direct';
const CORE=[
  '/health-/?v=38&music=3',
  '/health-/index.html?v=38&music=3',
  '/health-/styles.css?v=iris38',
  '/health-/iris-engine.js?v=iris38',
  '/health-/music-override.js?v=blackglass3',
  '/health-/black-glass-breathing.m4a.b64?v=3',
  '/health-/iris-v11.js?v=iris38',
  '/health-/iris-v23.js?v=iris38',
  '/health-/iris-v24.js?v=iris38',
  '/health-/manifest.webmanifest?v=iris38-icon22',
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
  }).catch(()=>caches.match(event.request).then(response=>response||caches.match('/health-/?v=38&music=3'))));
});