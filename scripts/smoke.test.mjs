/**
 * THE SMOKE TEST. Every route mounts, renders something, and throws nothing.
 *
 * WHY IT EXISTS. Three times in this project a defect has blanked a screen
 * while the whole suite passed, and all three were caught by a person looking
 * at a screenshot:
 *
 *   D51's third amendment  `mipRowBody` declared after the array that used it
 *   D73                    `rangeMonths` declared after `monthsResult`
 *   D73's amendment        the same, again, after the same declaration moved
 *
 * All three were temporal dead zones - `node --check` passes them, because they
 * are valid syntax, and every existing test passed, because none of them looks
 * at whether a screen rendered at all. `overlap.test.mjs` asserts that no
 * divider crosses text and no box is squashed; an empty page satisfies both
 * perfectly. This was verified rather than assumed: reintroducing D51's defect
 * left overlap at 72/72 passing against a completely blank tracker.
 *
 * WHAT IT ASSERTS, AND WHAT IT DELIBERATELY DOES NOT. Three things per route:
 * no uncaught error during navigation and render, `#app` is not empty, and the
 * hash the app settled on is the hash that was asked for. Nothing about the
 * content - that is every other suite's job, and a smoke test that knows what a
 * screen says has to be updated whenever the screen changes, which is how smoke
 * tests stop being run.
 *
 * THE THIRD ASSERTION EARNS ITS PLACE. A guard newly rejecting a screen that
 * used to render is the same class of failure as a screen that throws: the
 * participant does not arrive. It is caught here rather than in a routing test
 * because the seed that makes a route render is the same seed either way.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { FULL } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

/**
 * EVERY ROUTE THE ROUTER KNOWS, read from `router.js` rather than listed here.
 * A route added to the app is covered by this test the moment it is
 * registered - a hand-maintained copy would be one more list to forget.
 */
function allRoutes() {
  const src = fs.readFileSync(path.resolve('src/router.js'), 'utf8');
  const block = src.match(/const ROUTES = \[([\s\S]*?)\n\];/);
  assert.ok(block, 'could not find the ROUTES list in router.js');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/**
 * Two routes need more than the shared seed, and both for reasons the routing
 * docs already record rather than for anything this test invents.
 *
 *   /mip/result/likely   guarded on `borrow-high`, which only a real 19b run
 *                        commits (ROUTES.md). Seeded here rather than driven,
 *                        because this test is about rendering, not about the
 *                        flow that produces the figures.
 *   /mip/running         self-resolves to a result in about 3s, so it is
 *                        checked immediately after navigation and its landed
 *                        hash is allowed to have moved on.
 */
const EXTRA_SEED = {
  '/mip/result/likely': {
    'borrow-low': { value: 168000, provenance: 'estimated' },
    'borrow-high': { value: 189000, provenance: 'estimated' },
    'max-property': { value: 210000, provenance: 'estimated' },
    mipUnlocked: true,
  },
  '/mip/result/not-yet': { mipUnlocked: true },
  '/mip': { mipUnlocked: true },
};

/** Routes that legitimately navigate away on their own. */
const SELF_RESOLVING = new Set(['/mip/running']);

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const file = path.resolve('.', url === '/' ? 'index.html' : `.${url}`);
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve([server, `http://127.0.0.1:${server.address().port}`]));
  });
}

const [server, base] = await startServer();
const browser = await chromium.launch();

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

for (const route of allRoutes()) {
  test(`${route} mounts, renders and throws nothing`, async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: 'block',
    });
    // D59: an unstamped seed is discarded whole, and the test would then
    // silently measure a default session instead of the one it set up.
    await context.addInitScript((v) => {
      try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
    }, { ...FULL, ...(EXTRA_SEED[route] ?? {}), buildVersion: BUILD_VERSION });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    try {
      await page.goto(`${base}/#${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);

      const seen = await page.evaluate(() => ({
        hash: window.location.hash,
        length: document.querySelector('#app')?.innerHTML.length ?? 0,
      }));

      // 1. Nothing threw. A temporal dead zone lands here.
      assert.deepEqual(errors, [], `${route} raised: ${errors.join(' | ')}`);
      // 2. Something rendered. A blank screen lands here even if it threw
      //    somewhere this listener could not see.
      assert.ok(seen.length > 0, `${route} rendered an empty #app`);
      // 3. It is the screen that was asked for.
      if (!SELF_RESOLVING.has(route)) {
        assert.equal(seen.hash, `#${route}`, `${route} redirected to ${seen.hash || '#'}`);
      }
    } finally {
      await context.close();
    }
  });
}
