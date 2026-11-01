/* Offline cache for 小熊乐乐. Bump CACHE when you want phones to drop old files. */
const CACHE='xiongle-v2';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  if(new URL(r.url).origin!==location.origin) return;           // fonts etc. go straight to the network
  e.respondWith((async()=>{
    const hit=await caches.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)) } return res }).catch(()=>null);
    if(hit){ e.waitUntil(net); return hit }                      // open instantly from the phone, refresh quietly
    return (await net)||(await caches.match('./index.html'))||Response.error();
  })());
});
