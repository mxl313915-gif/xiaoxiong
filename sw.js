/* Offline cache for 小熊乐乐. Bump CACHE when you want phones to drop old files. */
const CACHE='xiongle-v3';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* online: always take the newest files (waits at most 3 s); offline or slow: use the copy kept on the phone */
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  if(new URL(r.url).origin!==location.origin) return;
  e.respondWith((async()=>{
    const net=fetch(r,{cache:'no-cache'}).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)) } return res });
    const timeout=new Promise((_,no)=>setTimeout(no,3000));
    try{ return await Promise.race([net,timeout]) }catch(err){
      net.catch(()=>{});
      return (await caches.match(r,{ignoreSearch:true}))||(await caches.match('./index.html'))||Response.error();
    }
  })());
});
