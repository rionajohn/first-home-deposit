/**
 * THE VERSION OF THE CODE THAT IS ACTUALLY EXECUTING.
 *
 * App-side mirror of sw.js's CACHE_VERSION, for the settings screen's
 * "Build vX" caption (SPEC.md build-order stage 9: "manual reset,
 * cache-version display"). sw.js is a classic (non-module) service worker
 * script - the broadest-compatible form for the Android/iOS devices this
 * prototype is tested on - so it can't `import` this module, and this
 * module can't import sw.js either. The two are hand-kept in sync instead,
 * the same treatment SPEC.md's rates.js maintenance rule already gives
 * bankRate/asAt: any value change is a same-commit, paired edit, not a
 * derived one.
 *
 * IT IS NOT A FALLBACK, AND IT USED TO BE (DECISIONS.md D49). This constant
 * was named `CACHE_VERSION_FALLBACK` and `settings.js` overwrote the caption
 * it rendered with a version read back from the Cache Storage API, on the
 * reasoning that the cache holds the "actual" running version. It does not.
 * Cache Storage is rewritten by whichever service worker has most recently
 * activated, INDEPENDENTLY of which modules the loaded document is executing:
 * on the first load after a deploy the new worker installs, activates and
 * claims while the page keeps running the modules it already has. The caption
 * then read the new version while the old code ran.
 *
 * That is worse than showing no version at all, because it is read as
 * evidence. It cost one full investigation - a facilitator confirmed "the
 * footer reads v38" and the page was running v37, so a `#/reset` typed on the
 * strength of it ran the previous build's reset. See GAPS.md G66.
 *
 * BECAUSE THIS CONSTANT IS COMPILED INTO THE MODULE GRAPH, it cannot
 * disagree with the code around it. Whatever build served this file is the
 * build whose value this is. That is the whole reason it is now the primary
 * reading and is never overwritten.
 *
 * The cached version is still worth showing - it is how a facilitator learns a
 * newer build is downloaded and a reload is due - but it is a SECOND, labelled
 * line, and it never replaces this one.
 */
export const BUILD_VERSION = 'v86';

/**
 * The prefix sw.js builds its cache name from (`yfh-shell-${CACHE_VERSION}`),
 * held here beside the version it is concatenated with so `settings.js` reads
 * one source rather than repeating the literal.
 */
export const SHELL_CACHE_PREFIX = 'yfh-shell-';
