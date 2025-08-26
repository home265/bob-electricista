/* public/sw.js */
/* PWA cache for Instalaciones (agua/sanitaria/gas/eléctrica) */
const VERSION = "v1.1.0-inst";
const STATIC_CACHE = `static-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png"
];

/* ----- Install & Activate ----- */
// public/sw.js (solo cambia el install)
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const results = await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
    // Silenciar fallos (dev) pero podrías loguearlos si querés:
    // results.forEach(r => { if (r.status === "rejected") console.warn("SW precache fail:", r.reason); });
  })());
  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/* Optional: allow page to trigger immediate activation */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ----- Fetch strategies ----- */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1) Navigation requests → Network-first + offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // 2) JSON de datos (public/data/...) → Stale-While-Revalidate
  if (sameOrigin && url.pathname.startsWith("/data/")) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // 3) Assets estáticos (js, css, imágenes, fuentes, worker) → Cache-first
  const dest = request.destination;
  if (["style", "script", "image", "font", "worker"].includes(dest)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 4) Resto → pasar directo
  // (si querés, podés añadir más reglas específicas acá)
});

/* ----- Strategies ----- */
async function networkFirstWithOffline(request) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 4000); // 4s timeout
    const res = await fetch(request, { signal: ctrl.signal });
    clearTimeout(id);
    // Opcional: cachear navegación para volver atrás offline (no imprescindible)
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    return cached || cache.match(OFFLINE_URL);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await fetchPromise) || new Response("",
    { status: 504, statusText: "Offline" });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}
