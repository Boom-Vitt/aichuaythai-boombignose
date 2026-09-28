/*
 * Service worker: เปิดเว็บและดูเบอร์โทรได้แม้สัญญาณเน็ตไม่ดี
 * ดึงไฟล์ใหม่จากเน็ตก่อนเสมอ (แก้เว็บแล้วเห็นผลทันที) ถ้าเน็ตหลุดค่อยใช้ของในแคช
 * ถ้าเพิ่ม/ลบไฟล์หลัก ให้แก้รายการ CORE และเปลี่ยนเลข VERSION
 */
var VERSION = 'rsb-v4';
var CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/style.css',
  'assets/js/data.js',
  'assets/js/core.js',
  'assets/js/fx.js',
  'assets/js/app.js',
  'assets/vendor/anime.slim.min.js',
  'assets/fonts/prompt-400.woff2',
  'assets/fonts/prompt-600.woff2',
  'assets/img/icon.svg',
  'assets/img/icon-192.png',
  'assets/img/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION)
      .then(function (cache) { return cache.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res.ok && res.type === 'basic') {
        var copy = res.clone();
        caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('./') : Response.error());
      });
    })
  );
});
