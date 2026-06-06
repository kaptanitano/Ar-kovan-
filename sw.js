const CACHE = 'kovan-v5';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Ana dosyaları kesinlikle cache'le, fontlar başarısız olabilir
      return cache.addAll(['./index.html', './manifest.json']).then(() => {
        return Promise.allSettled(
          ['https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'].map(url =>
            cache.add(url).catch(() => {})
          )
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Sadece GET isteklerini yakala
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Başarılı yanıtları cache'e ekle
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline ve cache'de yok — index.html döndür
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
