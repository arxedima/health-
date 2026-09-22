const CACHE='iris-v5.9.0-theme-preserve';
const CORE=[
  '/health-/?v=59&music=4',
  '/health-/index.html?v=59&music=4',
  '/health-/styles.css?v=iris46',
  '/health-/journal.css?v=iris46',
  '/health-/next.css?v=iris46',
  '/health-/polish-v47.css?v=iris48',
  '/health-/iris-plans.css?v=iris56',
  '/health-/iris-editorial.css?v=iris59',
  '/health-/iris-editorial.js?v=iris59',
  '/health-/iris-plans.js?v=iris56',
  '/health-/iris-data.js?v=iris46',
  '/health-/iris-journal.js?v=iris56',
  '/health-/iris-extras.js?v=iris46',
  '/health-/iris-next.js?v=iris48',
  '/health-/iris-motion.js?v=iris46',
  '/health-/iris-engine.js?v=iris59',
  '/health-/iris-music.m4a?v=4',
  '/health-/iris-v11.js?v=iris46',
  '/health-/iris-v24.js?v=iris46',
  '/health-/manifest.webmanifest?v=iris46-icon23',
  '/health-/app-icon-large.png?v=23',
  '/health-/app-icon-large-192.png?v=23',
  '/health-/apple-touch-icon-large.png?v=23'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('iris-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  const navigation=event.request.mode==='navigate';
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(event.request);
    // Versioned assets are immutable within a release, so taps never wait for revalidation.
    if(!navigation&&cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response.status===200){const copy=response.clone();event.waitUntil(cache.put(event.request,copy).catch(()=>{}))}
      if(response.ok||!navigation)return response;
    }catch{}
    if(cached)return cached;
    if(navigation)return await cache.match('/health-/?v=59&music=4')||Response.error();
    return Response.error();
  })());
});
