const CACHE='nova-plus-v14';
const ASSETS=['./','./index.html','./movement.html','./nutrition.html','./nova.css?v=nova13','./nova-reference-v8.css?v=nova13','./nova-sections-v9.css?v=nova13','./nova-home-v13.css?v=nova13','./nova-home-v13.js?v=nova13','./nova-night-v14.css?v=nova14','./nova-night-v14.js?v=nova14','./nova-app-v9.js?v=nova13','./nova-store.js','./nova-engine.js','./manifest.webmanifest?v=nova13','./assets/nova-orb.svg?v=nova13'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
])));

function injectNightV14(html){
  if(html.includes('nova-night-v14.css')) return html;
  html=html.replace('</head>','  <link rel="stylesheet" href="./nova-night-v14.css?v=nova14">\n</head>');
  html=html.replace('</body>','  <script src="./nova-night-v14.js?v=nova14" defer></script>\n</body>');
  return html;
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;

  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .then(async r=>{
          const text=await r.clone().text();
          const html=injectNightV14(text);
          return new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
        })
        .catch(()=>caches.match('./index.html').then(async r=>{
          if(!r)return new Response('Offline',{status:503});
          const html=injectNightV14(await r.text());
          return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});
        }))
    );
    return;
  }

  const core=['script','style','manifest'].includes(e.request.destination);
  if(core){
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .then(r=>{
          const c=r.clone();
          caches.open(CACHE).then(cache=>cache.put(e.request,c));
          return r;
        })
        .catch(()=>caches.match(e.request))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
