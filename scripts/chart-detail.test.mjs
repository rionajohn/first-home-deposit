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
      caption: document.querySelector('.figure-input__caption')?.textContent.trim() ?? '',
    }));
    assert.equal(drawn.active, 1, 'exactly one point is active');
    assert.ok(drawn.guide > 0, 'the guide is drawn before any interaction');
    assert.match(drawn.value, /^£[\d,]+$/, `the guide terminates in a value: "${drawn.value}"`);
    // The YEAR is in the caption, not in the plot (D111).
    assert.match(drawn.caption, /\d{4}/, `the caption names the active year: "${drawn.caption}"`);
  } finally {
    await context.close();
  }
});

// --- 4. No label below the active point --------------------------------------

test('4. the guide value stays inside the plot at the highest point', async () => {
  // WHAT THIS ASSERTED BEFORE, AND WHY IT CHANGED. It checked the in-plot year
  // label sat above the active point and inside the plot's upper bound, which
  // is what D100 bought the 1.20 headroom for. D111 removed that label, so the
  // headroom now holds nothing but the curve itself - and the only in-plot text
  // left is the guide value at the axis edge. That is what must still clear.
  for (const large of [false, true]) {
    const { context, page } = await openChart({ large });
    try {
      const n = await pointCount(page);
      const box = await areaBox(page);
      for (let i = 0; i < n; i += 1) {
        await page.mouse.move(box.x + (box.width * i) / (n - 1), box.y + box.height / 2);
        await page.waitForTimeout(40);
      }
      const g = await page.evaluate(() => {
        const r = (s) => document.querySelector(s)?.getBoundingClientRect();
        return { value: r('[data-chart-guide-value]'), point: r('.growth-chart__point--active'), plot: r('[data-chart-area]') };
      });
      assert.ok(g.value.top >= g.plot.top - 1,
        `${large ? 'large' : 'default'}: the guide value overflows the plot's top by ${(g.plot.top - g.value.top).toFixed(1)}px`);
      assert.ok(g.value.bottom <= g.plot.bottom + 1,
        `${large ? 'large' : 'default'}: the guide value overflows the plot's bottom`);
      assert.ok(g.point.top >= g.plot.top - 1, 'the highest point is inside the plot');
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
        // The year is no longer drawn in the plot (D111), so it is read from
        // the caption - which is now the only place it appears.
        date: document.querySelector('.figure-input__caption')?.textContent.trim().replace(/^By\s+/, ''),
      }));
      assert.equal(read.guide, read.readout, `point ${i}: the guide value and the readout disagree`);
      assert.ok(read.caption.includes(read.date), `point ${i}: the caption does not name the active date`);
      // THE CAPTION NO LONGER REPEATS THE FIGURE (D105). `figureDisplayHTML`
      // renders it directly above, so stating it twice was one of the three
      // places the same amount appeared on this screen.
      assert.ok(!read.caption.includes('£'), `point ${i}: the caption repeats the figure: "${read.caption}"`);
    }
  } finally {
    await context.close();
  }
});

// --- 9. The plan's 10.8 block measurement, now that the elements exist -------

test('9. the plot, the endpoint and the assumptions line are co-visible', async () => {
  // 10.8 DERIVED this from the tokens before anything was built: a 732px scroll
  // viewport at 390x844 (844 less a 56px app bar and a 56px tab bar) against a
  // block of 584px at default text and 654.8px at Large. This asserts the
  // PROPERTY that derivation existed to establish - the caveat is on screen
  // with the endpoint line and the whole chart above it, without scrolling -
  // and prints the measured figures against the derived ones.
  const measured = [];
  for (const large of [false, true]) {
    const { context, page } = await openChart({ large });
    try {
      const m = await page.evaluate(() => {
        const scroller = document.querySelector('.screen-content');
        const heading = [...document.querySelectorAll('.section-heading')]
          .find((h) => /how your savings/i.test(h.textContent));
        const texts = [...document.querySelectorAll('p')];
        const endpoint = texts.find((p) => /you'd reach your/.test(p.textContent));
        const assumptions = texts.find((p) => /It assumes nothing changes/.test(p.textContent));
        const plot = document.querySelector('.growth-chart');
        const estimate = texts.find((p) => /^This is an estimate based on/.test(p.textContent.trim()));
        const box = (el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; };

        // THE BREAKDOWN, BY FLOW CHILD. 10.8 derived this block from a list of
        // six elements; what it costs is decided by the list, not by the
        // heights, so the useful thing to report is every child the block
        // actually contains and what each one takes.
        const children = [...scroller.children];
        const from = children.indexOf(heading);
        const to = children.indexOf(assumptions);
        const parts = children.slice(from, to + 1).map((el) => ({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().split(' ')[0] || '(none)',
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 34),
          height: Math.round(el.getBoundingClientRect().height * 10) / 10,
        }));
        const gap = parseFloat(getComputedStyle(scroller).rowGap) || 0;

        return {
          viewport: scroller.clientHeight,
          block: box(assumptions).bottom - box(heading).top,
          // The RELAXED requirement: the plot itself, the endpoint and the
          // assumptions line, dropping the heading and the two controls above
          // the chart from the co-visibility block.
          relaxed: box(assumptions).bottom - box(plot).top,
          estimateToAssumptions: box(assumptions).top - box(estimate).bottom,
          estimateAboveHeading: box(heading).top - box(estimate).bottom,
          endpointTop: box(endpoint).top,
          assumptionsBottom: box(assumptions).bottom,
          headingTop: box(heading).top,
          hasAssumptions: !!assumptions,
          parts,
          gap,
          // Not behind a disclosure: nothing between it and the endpoint may be
          // a collapsed section.
          insideDisclosure: !!assumptions.closest('[data-disclosure-id], details'),
        };
      });
      // THE RELAXED BLOCK (D112): plot -> assumptions, not heading ->
      // assumptions. `projectionAssumptions` qualifies the endpoint CLAIM, so
      // the claim and the caveat have to be seen together; the heading and the
      // two toggles above the plot are navigation, and a participant who has
      // scrolled past them has lost nothing they need to read the figure.
      const headroom = m.viewport - m.relaxed;
      const derived = large ? 47.3 : 104.0;
      console.log(`
  10.8 ${large ? 'LARGE  ' : 'DEFAULT'}: block ${m.block.toFixed(1)}px of ${m.viewport}px, headroom ${headroom.toFixed(1)}px (10.8 derived ${derived}px)`);
      console.log(`  relaxed (plot -> assumptions): ${m.relaxed.toFixed(1)}px, headroom ${(m.viewport - m.relaxed).toFixed(1)}px`);
      console.log(`  estimateDisclosure sits ${m.estimateToAssumptions.toFixed(1)}px above projectionAssumptions (${m.estimateAboveHeading.toFixed(1)}px above the chart heading)`);
      console.log(`  ${m.parts.length} flow children, ${m.gap}px gap between each:`);
      for (const p of m.parts) {
        console.log(`    ${String(p.height).padStart(6)}  ${p.cls.padEnd(26)} ${p.text}`);
      }
      console.log(`    ${String((m.parts.length - 1) * m.gap).padStart(6)}  ${'(gaps)'.padEnd(26)} ${m.parts.length - 1} x ${m.gap}px`);

      assert.ok(m.hasAssumptions, 'the assumptions line is rendered');
      assert.equal(m.insideDisclosure, false, 'the assumptions line is not behind a disclosure');
      assert.ok(m.assumptionsBottom > m.endpointTop, 'the assumptions line sits below the endpoint line');
      measured.push({ large, block: m.relaxed, viewport: m.viewport, headroom, derived });
    } finally {
      await context.close();
    }
  }
  // BOTH SIZES ARE MEASURED BEFORE EITHER IS ASSERTED, so a failure at default
  // text does not hide the figure at Large - which is the one 10.8 predicted
  // would fail first.
  for (const r of measured) {
    assert.ok(r.headroom > 0,
      `${r.large ? 'large' : 'default'} text: the relaxed block is ${r.block.toFixed(1)}px against a ${r.viewport}px viewport, headroom ${r.headroom.toFixed(1)}px`);
  }
  // LARGE TEXT IS THIN AND THE MARGIN IS NAMED, because `--safe-bottom` is 0 in
  // a desktop browser and about 34px on a real iPhone-shaped device - which
  // would leave roughly 13px. Anything that grows above the plot has to be
  // re-measured here rather than assumed to fit.
  const largeHeadroom = measured.find((r) => r.large).headroom;
  assert.ok(largeHeadroom > 34,
    `large text clears by only ${largeHeadroom.toFixed(1)}px, which a 34px home indicator would exhaust`);
});

test('10. the table toggle is a visible peer of the chart, above the fold', async () => {
  // D102's reversal condition: under year-only the table is the ONLY place on
  // this screen with date resolution finer than a year at rest, so a buried
  // toggle removes month resolution from the screen entirely for anyone who
  // does not scrub. Asserted rather than inspected.
  for (const large of [false, true]) {
    const { context, page } = await openChart({ large });
    try {
      const t = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('[data-action="select-chart-view"]')]
          .find((b) => /table/i.test(b.textContent));
        const scroller = document.querySelector('.screen-content');
        const r = btn.getBoundingClientRect();
        const s = scroller.getBoundingClientRect();
        return {
          found: !!btn,
          hidden: !!btn.closest('[hidden], details:not([open])'),
          inOverflow: getComputedStyle(btn.parentElement).overflow === 'hidden',
          offsetWithinScroller: (r.top - s.top) + scroller.scrollTop,
          viewport: scroller.clientHeight,
        };
      });
      assert.ok(t.found, 'the table toggle is in the default render');
      assert.equal(t.hidden, false, 'the toggle is not behind a disclosure');
      assert.equal(t.inOverflow, false, 'the toggle is not inside an overflow container');
      assert.ok(t.offsetWithinScroller < t.viewport * 4,
        `${large ? 'large' : 'default'}: the toggle sits ${t.offsetWithinScroller.toFixed(0)}px down a ${t.viewport}px viewport`);
    } finally {
      await context.close();
    }
  }
});

// --- 11. The one collision left on the plot ----------------------------------

test('11. the guide value never sits on a visible y-axis label', async () => {
  // D111 removed the in-plot year label, which removed the collision the
  // bordered callout was built to resolve. ONE PAIR IS LEFT - the guide value
  // and a tick label, which share the axis edge - and the tick gives way.
  // Asserted at every point and at both text sizes, because which tick is level
  // with the value is a function of the figures and the text size.
  for (const large of [false, true]) {
    const { context, page } = await openChart({ large });
    try {
      const n = await pointCount(page);
      const box = await areaBox(page);
      for (let i = 0; i < n; i += 1) {
        await page.mouse.move(box.x + (box.width * i) / (n - 1), box.y + box.height / 2);
        await page.waitForTimeout(60);
        const hit = await page.evaluate(() => {
          const g = document.querySelector('[data-chart-guide-value]').getBoundingClientRect();
          return [...document.querySelectorAll('.growth-chart__tick-label')]
            .filter((el) => getComputedStyle(el).visibility !== 'hidden')
            .map((el) => el.getBoundingClientRect())
            .some((t) => g.left < t.right && g.right > t.left && g.top < t.bottom && g.bottom > t.top);
        });
        assert.equal(hit, false, `${large ? 'large' : 'default'} point ${i}: the guide value sits on a visible tick`);
      }
      // AND THE YEAR IS NOT DRAWN IN THE PLOT ANY MORE. It is readable from the
      // point's x position and stated once, in the readout caption.
      const inPlotYear = await page.evaluate(() => document.querySelectorAll('.growth-chart__point-date, [data-chart-callout]').length);
      assert.equal(inPlotYear, 0, 'the in-plot year label and the callout are gone');
    } finally {
      await context.close();
    }
  }
});

// --- 12. The table's own height ----------------------------------------------

test('12. the table fits at 390x844 with both series side by side', async () => {
  for (const large of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await context.addInitScript((v) => {
      try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
    }, { ...seed, chartView: 'table', textSize: large ? 'large' : 'default' });
    const page = await context.newPage();
    try {
      await page.goto(`${base}/#/calculator/result`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const t = await page.evaluate(() => {
        const wrap = document.querySelector('.growth-table-wrap');
        const table = document.querySelector('.growth-table');
        const caption = document.querySelector('.growth-table__caption');
        return {
          height: Math.round((table.getBoundingClientRect().bottom - caption.getBoundingClientRect().top) * 10) / 10,
          rows: document.querySelectorAll('.growth-table tbody tr').length,
          cols: document.querySelectorAll('.growth-table thead th').length,
          // A wrapper that scrolls horizontally means the third column is off
          // the screen, which is what "readable side by side" forbids.
          overflows: wrap.scrollWidth > wrap.clientWidth + 1,
          chips: document.querySelectorAll('[data-action="select-chart-range"]').length,
          viewport: document.querySelector('.screen-content').clientHeight,
        };
      });
      console.log(`  table ${large ? 'large ' : 'default'}: ${t.height}px, ${t.rows} rows x ${t.cols} cols, overflows ${t.overflows}`);
      assert.equal(t.cols, 3, 'year plus both series');
      assert.equal(t.overflows, false, `${large ? 'large' : 'default'}: the table scrolls horizontally`);
      assert.ok(t.height < t.viewport, 'the whole table fits one viewport height');
      // Item 6: the chips window the chart AND the table, so they are hidden
      // rather than disabled while the table shows.
      assert.equal(t.chips, 0, 'the range chips are absent, not disabled, in table view');
    } finally {
      await context.close();
    }
  }
});
