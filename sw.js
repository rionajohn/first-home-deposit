/**
 * Service worker: cache-first for the app shell, cache-and-update for
 * everything else same-origin. SPEC.md: CACHE_VERSION is bumped on every
 * deploy, every non-matching cache is deleted on activate, and the version
 * is "readable by the app (exposed on the settings screen)" —
 * src/screens/settings.js reads it back via the Cache Storage API
 * (`caches.keys()`, filtering for the `yfh-shell-` prefix this file names
 * its cache with) rather than postMessage, since Cache Storage is readable
 * from both the window and worker contexts without a round trip.
 *
 * Written as a classic (non-module) script deliberately — module service
 * workers aren't reliably supported across the Android and iOS devices this
 * prototype is tested on, per DECISIONS.md D1's Android-as-a-constraint-set
 * approach.
 *
 * Maintenance rule (SPEC.md): bump CACHE_VERSION below on every deploy, and
 * in the same commit as any change to a value in src/model/rates.js — a
 * rate change landed without a cache bump would leave some participants
 * served stale cached figures with no visible sign of it. Keep
 * src/cache-version.js's CACHE_VERSION_FALLBACK in step with the version
 * below; see that file's own comment for why the two are separate.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `yfh-shell-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './src/css/tokens.css',
  './src/css/shell.css',
  './src/css/components.css',
  './src/css/screens.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
