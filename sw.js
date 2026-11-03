// Çevrimdışı kalkan: ilk açılışta bütün oyun dosyaları cihaza iner, sonra internet gerekmez.
// Bu dosya tools/build.py ile üretilir, elle değiştirme.

const VERSION = '3ba2375b39ff';
const CACHE = `harf-kovani-${VERSION}`;
const ASSETS = [
  "./",
  "css/app.css",
  "css/fonts.css",
  "data/words.txt",
  "data/yaygin.txt",
  "fonts/baloo-2-600-latin-ext.woff2",
  "fonts/baloo-2-600-latin.woff2",
  "fonts/baloo-2-800-latin-ext.woff2",
  "fonts/baloo-2-800-latin.woff2",
  "fonts/caveat-700-latin-ext.woff2",
  "fonts/caveat-700-latin.woff2",
  "fonts/nunito-600-latin-ext.woff2",
  "fonts/nunito-600-latin.woff2",
  "fonts/nunito-800-latin-ext.woff2",
  "fonts/nunito-800-latin.woff2",
  "fonts/paytone-one-400-latin-ext.woff2",
  "fonts/paytone-one-400-latin.woff2",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "index.html",
  "js/config.js",
  "js/core/audio.js",
  "js/core/dom.js",
  "js/core/dreamlo.js",
  "js/core/fx.js",
  "js/core/music.js",
  "js/core/perf.js",
  "js/core/save.js",
  "js/core/ui.js",
  "js/data/anlam.js",
  "js/data/kovan-levels.js",
  "js/data/kovan-sozluk.js",
  "js/koloni/hikaye.js",
  "js/koloni/koloni.js",
  "js/koloni/sahne.js",
  "js/main.js",
  "js/oyun/bag.js",
  "js/oyun/bitir.js",
  "js/oyun/cicek.js",
  "js/oyun/kart.js",
  "js/oyun/notlar.js",
  "js/oyun/petek.js",
  "js/oyun/yardim.js",
  "js/sayfa/ana.js",
  "js/sayfa/sayfalar.js",
  "manifest.webmanifest"
];

async function broadcast(msg) {
  const list = await self.clients.matchAll({ includeUncontrolled: true });
  list.forEach((c) => c.postMessage(msg));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let done = 0;
    // Parça parça indirilir; yarıda kopan bağlantıda bir sonraki açılışta kalan iner
    const queue = ASSETS.slice();
    const worker = async () => {
      while (queue.length) {
        const url = queue.shift();
        const hit = await cache.match(url);
        if (!hit) {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`${url} ${res.status}`);
          await cache.put(url, res);
        }
        done++;
        broadcast({ type: 'progress', done, total: ASSETS.length });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    broadcast({ type: 'cached', version: VERSION });
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('harf-kovani-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    broadcast({ type: 'ready', version: VERSION });
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const page = (await cache.match('./index.html')) || (await cache.match('./'));
      if (page) return page;
    }
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return new Response('', { status: 504, statusText: 'cevrimdisi' });
    }
  })());
});
