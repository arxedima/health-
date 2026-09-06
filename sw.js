const CACHE='nova-plus-v18';
const ASSETS=[
  './','./index.html','./movement.html','./nutrition.html',
  './nova.css?v=nova18','./nova-sections-v9.css?v=nova18',
  './nova-home-clean-v16.css?v=nova18','./nova-cloud-motion-v18.css?v=nova18','./nova-home-clean-v16.js?v=nova18',
  './nova-app-v9.js?v=nova18','./nova-store.js','./nova-engine.js',
  './manifest.webmanifest?v=nova18','./assets/nova-orb.svg?v=nova18'
];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
])));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const core=e.request.mode==='navigate'||['script','style','manifest'].includes(e.request.destination);
  if(core){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const c=r.clone();
      caches.open(CACHE).then(cache=>cache.put(e.request,c));
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});