/**
 * Playwright, with `window.__YFH_KEEP_SESSION__ = true` set on every context
 * before any page script runs (DECISIONS.md D162).
 *
 * Since D162 the app discards its stored session and redirects to #/home on
 * every page load. Every script here either seeds `sessionStorage` before
 * `goto` or reloads and expects the session back, so each one needs the app's
 * test-only opt-out. A flag set from the harness, never a URL parameter:
 * anything in the URL is usable by a public visitor.
 *
 * Drop-in for `import { chromium, webkit } from 'playwright'`. Only
 * `stale-session.test.mjs` imports plain `playwright`, because it tests the
 * flag-less behaviour as well.
 */
import { chromium as rawChromium, webkit as rawWebkit } from 'playwright';

function keepSession(browserType) {
  return new Proxy(browserType, {
    get(target, key) {
      if (key === 'launch') {
        return async (...args) => {
          const browser = await target.launch(...args);
          const newContext = browser.newContext.bind(browser);
          browser.newContext = async (...a) => {
            const context = await newContext(...a);
            await context.addInitScript(() => { window.__YFH_KEEP_SESSION__ = true; });
            return context;
          };
          return browser;
        };
      }
      const value = target[key];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

export const chromium = keepSession(rawChromium);
export const webkit = keepSession(rawWebkit);
