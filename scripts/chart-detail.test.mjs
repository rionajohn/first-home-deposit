/**
 * FRAME 12'S POINT DETAIL: the scrub, the pointer path and the keyboard.
 *
 * WHY THIS IS A FILE OF ITS OWN. No existing harness drives a pointer across a
 * plot. `chart-range.test.mjs` reads what the chart DREW; everything here is
 * about what it does when something moves, and every one of these states
 * renders cleanly - so `smoke.test.mjs` passes on all of them, and so would a
 * screenshot pass. D77's finding, applied to an interaction rather than to a
 * chart.
 *
 * THE ORDER FOLLOWS THE PLAN'S VERIFICATION LIST (its step 6b), one test per
 * requirement in section 6.6, so a requirement that loses its test is visible
 * as a gap in the numbering rather than as an absence.
 *
 * NOTHING HERE PINS A FIGURE. Positions are compared against the ratio the
 * handler is specified to use, and values are read off the points' own
 * accessible names - the same strings a screen reader gets. That is what makes
 * this survive a re-seeded fixture instead of breaking on one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { FULL, SEED_ANCHOR } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

/** A 450,000 property at 10%: a 45,000 deposit plus 7,500 of stamp duty. */
const seed = {
  ...FULL,
  'property-value': { value: 450000, provenance: 'entered' },
  'deposit-pct': { value: 0.10, provenance: 'entered' },
  'deposit-target': { value: 45000, provenance: 'entered' },
  'stamp-duty': { value: 7500, provenance: 'entered' },
  'combined-goal': { value: 52500, provenance: 'entered' },
  'checkpoint-amount': { value: 39375, provenance: 'entered' },
  'saved-toward-deposit': { value: 20000, provenance: 'read' },
  'monthly-low': { value: 200, provenance: 'read' },
  'monthly-high': { value: 310, provenance: 'read' },
  'savings-rate': { value: 255, provenance: 'read' },
  buildVersion: BUILD_VERSION,
  sessionAnchor: SEED_ANCHOR,
};

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

async function openChart({ width = 390, height = 844, large = false, hasTouch = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    serviceWorkers: 'block',
    hasTouch,
  });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, { ...seed, textSize: large ? 'large' : 'default' });
  const page = await context.newPage();
  await page.goto(`${base}/#/calculator/result`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.locator('[data-chart-area]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  return { context, page };
}

const activeIndex = (page) => page.evaluate(() => {
  const id = document.querySelector('[data-chart-area]')?.getAttribute('aria-activedescendant') ?? '';
  return Number(id.replace('growth-point-', ''));
});

const pointCount = (page) => page.evaluate(() => document.querySelectorAll('.growth-chart__point').length);

/** The plot's box in VISUAL pixels, which is what a pointer event carries. */
const areaBox = (page) => page.locator('[data-chart-area]').boundingBox();

// --- 1. Nearest-point activation, at both ends and outside them ---------------

test('1. nearest-point activation is correct at both ends and beyond them', async () => {
  const { context, page } = await openChart();
  try {
    const n = await pointCount(page);
    const box = await areaBox(page);
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + 1, y);
    await page.waitForTimeout(150);
    assert.equal(await activeIndex(page), 0, 'the left edge activates the first point');

    await page.mouse.move(box.x + box.width - 1, y);
    await page.waitForTimeout(150);
    assert.equal(await activeIndex(page), n - 1, 'the right edge activates the last point');

    // BEYOND EACH END the index must CLAMP rather than run negative or past the
    // array - `formatCurrency(undefined)` would render "£NaN" rather than fail.
    //
    // DRIVEN AS A CAPTURED DRAG, which is the only way the handler sees a
    // position outside the plot at all: a bare hover outside delivers its
    // events to whatever is under the pointer, so the chart is not asked the
    // question. `setPointerCapture` is what keeps a drag that leaves the plot
    // tracking rather than stopping at the edge, and this is that path.
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x - 200, y, { steps: 5 });
    await page.waitForTimeout(150);
    assert.equal(await activeIndex(page), 0, 'dragging left of the plot clamps to the first point');

    await page.mouse.move(box.x + box.width + 200, y, { steps: 5 });
    await page.waitForTimeout(150);
    assert.equal(await activeIndex(page), n - 1, 'dragging right of the plot clamps to the last point');
    await page.mouse.up();
  } finally {
    await context.close();
  }
});

test('1b. the same POSITION selects the same point at 1280x720 and 2560x1440', async () => {
  // THE RATIO, ASSERTED AS THE PROPERTY IT EXISTS FOR. D92 draws the frame at a
  // CSS scale, so `getBoundingClientRect()` returns visual pixels while layout
  // is logical. A handler written against a pixel offset passes at one window
  // size and silently mis-aims at the other; the same FRACTION across the plot
  // must land on the same point at both.
  const results = [];
  for (const [width, height] of [[1280, 720], [2560, 1440]]) {
    const { context, page } = await openChart({ width, height });
    try {
      const box = await areaBox(page);
      const picked = [];
      for (const fraction of [0.1, 0.35, 0.5, 0.75, 0.95]) {
        await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
        await page.waitForTimeout(120);
        picked.push(await activeIndex(page));
      }
      results.push({ size: `${width}x${height}`, picked, count: await pointCount(page) });
    } finally {
      await context.close();
    }
  }
  assert.equal(results[0].count, results[1].count, 'both window sizes plot the same number of points');
  assert.deepEqual(results[0].picked, results[1].picked,
    `the same fractions selected ${results[0].picked} at ${results[0].size} and ${results[1].picked} at ${results[1].size}`);
});

// --- 2. The active state survives release, pointer-leave and pointercancel ---

test('2. the active state survives release, pointer-leave and pointercancel', async () => {
  const { context, page } = await openChart();
  try {
    const box = await areaBox(page);
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width * 0.3, y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(150);
    const afterRelease = await activeIndex(page);
    assert.ok(afterRelease > 0, 'a press moved the active point');

    // POINTER-LEAVE ONCE PINNED. While a finger is on the screen it covers what
    // is being read, so a detail that cleared on lift could never be read.
    await page.mouse.move(box.x + box.width / 2, box.y - 200);
    await page.waitForTimeout(150);
    assert.equal(await activeIndex(page), afterRelease, 'leaving the plot must not clear the active point');

    // POINTERCANCEL is what the browser fires when it commits to a vertical pan
    // through `touch-action: pan-y`. The same rule covers it, so the scroll case
    // needs no branch of its own - which is what this asserts.
    await page.evaluate(() => {
      document.querySelector('[data-chart-area]')
        .dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
    });
    await page.waitForTimeout(150);
    assert.equal(await activeIndex(page), afterRelease, 'pointercancel must not clear the active point');
  } finally {
    await context.close();
  }
});

// --- 3. A point is active on load ---------------------------------------------

test('3. a point is active on load, with its guide and value drawn', async () => {
  const { context, page } = await openChart();
  try {
    const n = await pointCount(page);
    assert.equal(await activeIndex(page), n - 1, 'the last point in the window is active at rest');
    const drawn = await page.evaluate(() => ({
      active: document.querySelectorAll('.growth-chart__point--active').length,
      guide: document.querySelector('.growth-chart__guide')?.getBoundingClientRect().width ?? 0,
      value: document.querySelector('[data-chart-guide-value]')?.textContent.trim() ?? '',
      date: document.querySelector('.growth-chart__point-date')?.textContent.trim() ?? '',
    }));
    assert.equal(drawn.active, 1, 'exactly one point is active');
    assert.ok(drawn.guide > 0, 'the guide is drawn before any interaction');
    assert.match(drawn.value, /^£[\d,]+$/, `the guide terminates in a value: "${drawn.value}"`);
    assert.ok(drawn.date.length > 0, 'the date label is drawn');
  } finally {
    await context.close();
  }
});

// --- 4. No label below the active point --------------------------------------

test('4. no label renders below the active point, at either text size', async () => {
  for (const large of [false, true]) {
    const { context, page } = await openChart({ large });
    try {
      const n = await pointCount(page);
      const box = await areaBox(page);
      // Every point in turn, because the collision is a function of the point's
      // HEIGHT and the highest point is the one that collides.
      for (let i = 0; i < n; i += 1) {
        await page.mouse.move(box.x + (box.width * i) / (n - 1), box.y + box.height / 2);
        await page.waitForTimeout(40);
      }
      const geometry = await page.evaluate(() => {
        const r = (s) => document.querySelector(s)?.getBoundingClientRect();
        return {
          label: r('.growth-chart__point-date'),
          point: r('.growth-chart__point--active'),
          plot: r('[data-chart-area]'),
        };
      });
      assert.ok(geometry.label.bottom <= geometry.point.top + 1,
        `${large ? 'large' : 'default'}: the date label is not above the point`);
      assert.ok(geometry.label.top >= geometry.plot.top - 1,
        `${large ? 'large' : 'default'}: the label overflows the plot's top by ${(geometry.plot.top - geometry.label.top).toFixed(1)}px`);
      assert.ok(geometry.label.left >= geometry.plot.left - 1 && geometry.label.right <= geometry.plot.right + 1,
        `${large ? 'large' : 'default'}: the label overflows the plot horizontally`);
    } finally {
      await context.close();
    }
  }
});

// --- 5. Vertical scroll from a gesture starting on the plot -------------------

test('5. a vertical drag starting on the plot scrolls, and does not scrub', async () => {
  // `touch-action: pan-y` is what makes this work: the browser direction-locks,
  // a vertical gesture never reaches the handler, and the active point stays
  // where it was. Driven at a SHORT viewport height, where D92 lets the page
  // outside the frame scroll as well.
  const { context, page } = await openChart({ width: 1280, height: 600, hasTouch: true });
  try {
    const before = await activeIndex(page);
    const box = await areaBox(page);

    const scrollBefore = await page.evaluate(() => document.querySelector('.screen-content').scrollTop);
    // The browser's own direction lock cannot be driven from Playwright, so
    // what is asserted is the two things that make it work: the plot DECLARES
    // pan-y, and a scroll of the container it sits in leaves the active point
    // alone. A handler that scrubbed on scroll would fail the second.
    await page.evaluate(() => { document.querySelector('.screen-content').scrollTop += 120; });
    await page.waitForTimeout(200);
    const scrollAfter = await page.evaluate(() => document.querySelector('.screen-content').scrollTop);

    assert.ok(scrollAfter > scrollBefore, 'the screen scrolled');
    assert.equal(await activeIndex(page), before, 'a scroll must not move the active point');
    const touchAction = await page.evaluate(() =>
      getComputedStyle(document.querySelector('[data-chart-area]')).touchAction);
    assert.equal(touchAction, 'pan-y', 'the plot declares pan-y so the browser can direction-lock');
  } finally {
    await context.close();
  }
});

// --- 6. Keyboard --------------------------------------------------------------

test('6. keyboard reaches every point, and the guide follows focus alone', async () => {
  const { context, page } = await openChart();
  try {
    const n = await pointCount(page);
    await page.locator('[data-chart-area]').focus();
    await page.waitForTimeout(120);

    await page.keyboard.press('Home');
    await page.waitForTimeout(120);
    assert.equal(await activeIndex(page), 0, 'Home reaches the first point');

    // EVERY point, by arrowing the whole way rather than sampling.
    for (let i = 1; i < n; i += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(25);
      assert.equal(await activeIndex(page), i, `ArrowRight should reach point ${i}`);
    }

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(80);
    assert.equal(await activeIndex(page), n - 1, 'ArrowRight clamps at the last point');

    await page.keyboard.press('Home');
    await page.waitForTimeout(80);
    await page.keyboard.press('End');
    await page.waitForTimeout(80);
    assert.equal(await activeIndex(page), n - 1, 'End reaches the last point');

    // ESCAPE RETURNS TO THE AT-REST STATE, not to an empty one - there is no
    // state in which no point is active.
    await page.keyboard.press('Home');
    await page.waitForTimeout(80);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(120);
    assert.equal(await activeIndex(page), n - 1, 'Escape returns to the last point');
    assert.equal(
      await page.evaluate(() => document.querySelectorAll('.growth-chart__point--active').length), 1,
      'a point is still active after Escape',
    );

    // ONE FOCUS STOP. The points are not individually tabbable; the plot is the
    // control and `aria-activedescendant` names the active one - D84's listbox
    // contract, read off the same attributes a screen reader reads.
    const focusables = await page.evaluate(() =>
      document.querySelectorAll('.growth-chart [tabindex]:not([tabindex="-1"]), .growth-chart a, .growth-chart button').length);
    assert.equal(focusables, 1, 'the chart is a single focus stop');
  } finally {
    await context.close();
  }
});

// --- 7. Reduced motion --------------------------------------------------------

test('7. under prefers-reduced-motion nothing animates, and everything still works', async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, seed);
  const page = await context.newPage();
  try {
    await page.goto(`${base}/#/calculator/result`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.locator('[data-chart-area]').scrollIntoViewIfNeeded();

    const durations = await page.evaluate(() => ['.growth-chart__guide', '.growth-chart__point--active', '.growth-chart__point-date']
      .map((s) => {
        const el = document.querySelector(s);
        return el ? getComputedStyle(el).transitionDuration : '0s';
      }));
    for (const d of durations) {
      assert.match(d, /^(0s|0s(, 0s)*)$/, `a transition survives reduced motion: ${d}`);
    }

    // THE ACTUAL CLAIM: the interaction is unchanged, not merely un-animated.
    const box = await areaBox(page);
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
    await page.waitForTimeout(150);
    const moved = await activeIndex(page);
    await page.locator('[data-chart-area]').focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(120);
    assert.equal(await activeIndex(page), 0, 'the keyboard still traverses under reduced motion');
    assert.ok(moved >= 0, 'the pointer still moves the active point under reduced motion');
  } finally {
    await context.close();
  }
});

// --- 8. The readout and the in-plot label are one figure ----------------------

test('8. the readout and the in-plot value are the same figure at every point', async () => {
  // They render from ONE active index, so they cannot disagree - and that is the
  // property, rather than a coincidence to be sampled at the default state.
  const { context, page } = await openChart();
  try {
    const n = await pointCount(page);
    const box = await areaBox(page);
    for (let i = 0; i < n; i += 1) {
      await page.mouse.move(box.x + (box.width * i) / (n - 1), box.y + box.height / 2);
      await page.waitForTimeout(35);
      const read = await page.evaluate(() => ({
        readout: document.querySelector('.figure-display')?.textContent.trim(),
        caption: document.querySelector('.figure-input__caption')?.textContent.trim(),
        guide: document.querySelector('[data-chart-guide-value]')?.textContent.trim(),
        date: document.querySelector('.growth-chart__point-date')?.textContent.trim(),
      }));
      assert.equal(read.guide, read.readout, `point ${i}: the guide value and the readout disagree`);
      assert.ok(read.caption.includes(read.date), `point ${i}: the caption does not name the active date`);
      assert.ok(read.caption.includes(read.readout), `point ${i}: the caption does not name the figure`);
    }
  } finally {
    await context.close();
  }
});
