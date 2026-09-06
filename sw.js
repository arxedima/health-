const CACHE='nova-plus-v20';
const ASSETS=[
  './','./index.html','./nova-v20.css?v=nova20','./nova-v20.js?v=nova20',
  './manifest.webmanifest?v=nova20','./assets/nova-orb.svg?v=nova20'
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
  if(e.request.method!=='GET') return;
  const core=e.request.mode==='navigate'||['script','style','manifest'].includes(e.request.destination);
  if(core){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const clone=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,clone));
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
