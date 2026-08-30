/**
 * Service worker: precaches the full app shell at install so the prototype
 * runs with no connection for the rest of a testing session, then serves
 * cache-first with a network-and-cache fallback for anything unlisted.
 * SPEC.md: CACHE_VERSION is bumped on every deploy, every non-matching
 * cache is deleted on activate (so a participant can never be served a
 * stale build), and the version is "readable by the app (exposed on the
 * settings screen)" — src/screens/settings.js reads it back via the Cache
 * Storage API (`caches.keys()`, filtering for the `yfh-shell-` prefix this
 * file names its cache with) rather than postMessage, since Cache Storage
 * is readable from both the window and worker contexts without a round
 * trip.
 *
 * Written as a classic (non-module) script deliberately — module service
 * workers aren't reliably supported across the Android and iOS devices this
 * prototype is tested on, per DECISIONS.md D1's Android-as-a-constraint-set
 * approach.
 *
 * SHELL_ASSETS is every JS module, CSS file, icon and manifest the app
 * actually loads — generated once from the real file tree (not hand-typed)
 * so it can't drift out of sync with what src/app.js imports. If a build
 * adds a new screen module or icon, add its path here in the same commit
 * (`git status`/`git diff --stat` against this file is the check).
 *
 * Maintenance rule (SPEC.md): bump CACHE_VERSION below on every deploy, and
 * in the same commit as any change to a value in src/model/rates.js — a
 * rate change landed without a cache bump would leave some participants
 * served stale cached figures with no visible sign of it. Keep
 * src/cache-version.js's BUILD_VERSION in step with the version
 * below; see that file's own comment for why the two are separate.
 */
const CACHE_VERSION = 'v77';
const CACHE_NAME = `yfh-shell-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/css/tokens.css',
  './src/css/shell.css',
  './src/css/components.css',
  './src/css/screens.css',
  './src/action-bar.js',
  './src/app.js',
  './src/cache-version.js',
  './src/components/ui.js',
  './src/config.js',
  './src/content.js',
  './src/facilitator-gesture.js',
  './src/format.js',
  './src/icons.js',
  './src/model/accounts.js',
  './src/model/model.js',
  './src/model/rates.js',
  './src/router.js',
  './src/sheet-drag.js',
  './src/skip-ahead.js',
  './src/stage.js',
  './src/state.js',
  './src/screens/assumptions-borrowing.js',
  './src/screens/assumptions-costs.js',
  './src/screens/learn-stamp-duty.js',
  './src/screens/assumptions-deposit.js',
  './src/screens/assumptions-saving.js',
  './src/screens/assumptions-sources.js',
  './src/screens/calculator-exit.js',
  './src/screens/calculator-property.js',
  './src/screens/calculator-result.js',
  './src/screens/calculator-review.js',
  './src/screens/calculator-saving.js',
  './src/screens/consent-move-account.js',
  './src/screens/consent.js',
  './src/screens/goal-check.js',
  './src/screens/goals.js',
  './src/screens/home.js',
  './src/screens/journey.js',
  './src/screens/learn-ltv-video.js',
  './src/screens/learn-ltv.js',
  './src/screens/mip-about.js',
  './src/screens/mip-adviser.js',
  './src/screens/mip-pre-check.js',
  './src/screens/mip-result-likely.js',
  './src/screens/mip-result-not-yet.js',
  './src/screens/mip-running.js',
  './src/screens/mip.js',
  './src/screens/position-summary.js',
  './src/screens/position.js',
  './src/screens/settings.js',
  './src/screens/tracker.js',
  './assets/icons/app/apple-touch-icon.png',
  './assets/icons/app/icon-192.png',
  './assets/icons/app/icon-512-maskable.png',
  './assets/icons/app/icon-512.png',
  './assets/icons/favicon.ico',
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
