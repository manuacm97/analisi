const V='analisi-v1';
const F=['./index.html','./manifest.json','./icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(!e.request.url.startsWith(self.location.origin))return;e.respondWith(caches.match(e.request).then(c=>{const n=fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(V).then(ca=>ca.put(e.request,cl));}return r;}).catch(()=>c);return c||n;}));});
