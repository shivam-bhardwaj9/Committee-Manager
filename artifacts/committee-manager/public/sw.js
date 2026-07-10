// Minimal offline-caching service worker for Committee Manager.
//
// Strategy:
// - Never touch cross-origin requests or API calls (/api/...) — those always
//   need fresh data and must not be served from cache.
// - Page navigations: network-first, falling back to the cached shell when
//   offline.
// - Other same-origin GET requests (JS/CSS/images/fonts): stale-while-
//   revalidate — serve from cache instantly if present, refresh in the
//   background.
//
// Bump CACHE_NAME whenever this file's caching behavior changes so old
// entries get cleared out on activate.
const CACHE_NAME = "committee-manager-cache-v1";

self.addEventListener("install", (event) => {
  // Precache the app shell document so the very first offline launch (before
  // any successful online navigation has populated the cache) still has
  // something to fall back to.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(new Request(self.registration.scope, { cache: "reload" })))
      .catch(() => {
        // Best-effort — if the network is unavailable at install time, the
        // shell will still get cached on the first successful navigation.
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // The API is always mounted at "<scope>api/..." — anchor the check to the
  // service worker's own scope rather than a bare substring match, so a
  // page route that happens to contain "api" elsewhere in its path isn't
  // accidentally excluded from caching.
  const apiPrefix = `${self.registration.scope}api/`;
  if (url.origin !== self.location.origin || request.url.startsWith(apiPrefix)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(self.registration.scope));
        }),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    ),
  );
});
