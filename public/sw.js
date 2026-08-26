const CACHE_NAME = "smart-cell-cache-v1";

// Daftar file yang akan di-precache
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
  // Tambahkan offline fallback page jika Anda membuatnya, misal: "/offline"
];

// Instalasi Service Worker & Precache Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Precaching assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Aktivasi Service Worker & Pembersihan Cache Lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Menghapus cache lama:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intersepsi Request (Fetch Event)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Strategi Cache-First untuk Aset Statis (Gambar, CSS, JS, Font)
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    url.pathname.startsWith("/_next/static/") || 
    url.pathname.startsWith("/logo.png")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Strategi Network-First untuk Dokumen HTML dan Data/API
  if (request.mode === "navigate" || request.destination === "document" || url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(async () => {
          // Fallback jika network gagal (offline)
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika tidak ada di cache, Anda bisa mereturn halaman offline default di sini
          // Misalnya: return caches.match("/offline");
          // Karena ini SPA/Next.js, seringkali root "/" berfungsi sebagai fallback terbaik jika sudah dicache
          return caches.match("/");
        })
    );
    return;
  }
});
