/**
 * App-side mirror of sw.js's CACHE_VERSION, for the settings screen's
 * "Build vX" caption (SPEC.md build-order stage 9: "manual reset,
 * cache-version display"). sw.js is a classic (non-module) service worker
 * script — the broadest-compatible form for the Android/iOS devices this
 * prototype is tested on — so it can't `import` this module, and this
 * module can't import sw.js either. The two are hand-kept in sync instead,
 * the same treatment SPEC.md's rates.js maintenance rule already gives
 * bankRate/asAt: any value change is a same-commit, paired edit, not a
 * derived one.
 *
 * This constant is only the fallback shown before the live value is
 * confirmed. src/screens/settings.js reads the *actual* running version
 * from the Cache Storage API wherever a service worker has installed, and
 * replaces this fallback text if the two ever disagree (e.g. a tab open
 * from before a newer sw.js deployed).
 */
export const CACHE_VERSION_FALLBACK = 'v29';
