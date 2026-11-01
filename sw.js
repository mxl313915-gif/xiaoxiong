/* Offline cache for 小熊乐乐. Bump CACHE when you want phones to drop old files. */
const CACHE = 'xiongle-v7';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

/* install: cache one file at a time, so a single 404 cannot break the whole install */
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(FILES.map(f =>
      fetch(f, { cache: 'no-cache' })
        .then(r => (r && r.ok ? c.put(f, r) : null))
        .catch(() => null)
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* online: newest file wins (network has 3 s, then we fall back to the phone's copy) */
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  let u;
  try { u = new URL(r.url) } catch (err) { return }
  if (u.origin !== location.origin) return;
  e.respondWith((async () => {
    const net = fetch(r, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {});
      }
      return res;
    });
    const timeout = new Promise((_, no) => setTimeout(no, 3000));
    try {
      return await Promise.race([net, timeout]);
    } catch (err) {
      net.catch(() => {});
      const hit = (await caches.match(r, { ignoreSearch: true })) ||
                  (r.mode === 'navigate' ? await caches.match('./index.html') : null);
      return hit || Response.error();
    }
  })());
});
