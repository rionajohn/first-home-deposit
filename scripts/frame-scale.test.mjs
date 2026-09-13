/**
 * D92: THE LOGICAL VIEWPORT IS FIXED AND THE RENDERED FRAME IS SCALED.
 *
 * The pilot session on 31 August 2026 was run entirely at 150% browser zoom
 * because the participant could not read the prototype at 100%, and said so at
 * 32:32. Every judgement they made about type size, colour weight and axis
 * legibility was therefore made at a magnification the next participant has no
 * reason to reproduce. The fix magnifies the frame without touching the
 * viewport it lays out against - and the whole value of that fix is a property
 * a screenshot cannot show: that the layout INSIDE the frame is byte-identical
 * between one window size and another, so findings stay comparable.
 *
 * So this file asserts the contract rather than the appearance:
 *
 *   1. `.screen` measures exactly `--frame-width` x `--frame-height` in LAYOUT
 *      pixels at every window size. That is the instrument.
 *   2. The layout fingerprint of every element inside it - `offsetTop`,
 *      `offsetHeight`, `offsetLeft`, `offsetWidth`, in layout pixels - is
 *      IDENTICAL at 1280x720 and at 2560x1440. A single differing row means
 *      an internal breakpoint has resolved differently and the two sessions
 *      are no longer measuring the same thing.
 *   3. The RENDERED size differs by exactly the scale, so the magnification is
 *      real rather than a no-op.
 *   4. The scale is never below 1 and never above the cap.
 *   5. Neither window size produces a horizontal scrollbar.
 *   6. A window shorter than the frame scrolls rather than shrinking it.
 *   7. The overlay listbox on frame 10b stays anchored to its trigger, and its
 *      clamped height stays clear of the action bar, at both window sizes.
 *      It is the one control positioned from measured geometry rather than
 *      from CSS alone, so it is the one most likely to break under a
 *      transform.
 *   8. Keyboard focus rings stay 2 logical pixels and stay around the control
 *      they belong to, at both window sizes.
 *   9. The scale is recomputed when the window is resized.
 *
 * Every expected figure is read from the stylesheet at run time - the frame
 * dimensions from `--frame-width` / `--frame-height`, the scale from
 * `--frame-scale` - so a re-dimensioned frame moves this file with it instead
 * of breaking it.
 *
 * ~20s. Drives Chromium.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { FULL } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';
import { monthsToGoalUnaided } from '../src/model/model.js';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
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

/**
 * The two windows the fix has to hold at once: a laptop too SHORT to hold the
 * frame at its natural size, and a desktop tall enough to want more
 * magnification than the cap allows. Both bounds are exercised, in one pass.
 */
const SHORT = { width: 1280, height: 720 };
const TALL = { width: 2560, height: 1440 };

const [server, base] = await startServer();
const browser = await chromium.launch();

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

/** A FRESH TAB EVERY TIME, never a reload - a reload can restore a stale session (D59). */
async function open(route, viewport, extra = {}) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, { ...FULL, ...extra, buildVersion: BUILD_VERSION });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/#${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(260);
  assert.deepEqual(errors, [], `${route} raised: ${errors.join(' | ')}`);
  return { context, page };
}

/**
 * The frame's own numbers, read off the page. `offset*` is the LAYOUT box and
 * `getBoundingClientRect()` is what is DRAWN; under a scale transform the two
 * differ by exactly the scale, and telling them apart is the whole subject of
 * this file.
 */
const geometry = (page) => page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const num = (name) => Number.parseFloat(cs.getPropertyValue(name));
  const screen = document.querySelector('.screen');
  const frame = document.querySelector('#app-frame');
  const drawn = screen.getBoundingClientRect();
  const frameBox = frame.getBoundingClientRect();
  return {
    scale: num('--frame-scale'),
    declaredWidth: num('--frame-width'),
    declaredHeight: num('--frame-height'),
    logical: { width: screen.offsetWidth, height: screen.offsetHeight },
    drawn: { width: drawn.width, height: drawn.height, left: drawn.left, right: drawn.right },
    frameBox: { width: frameBox.width, height: frameBox.height, left: frameBox.left, right: frameBox.right },
    viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    pageScroll: document.body.scrollHeight - document.body.clientHeight,
  };
});

/**
 * Every laid-out box inside the phone, in layout pixels. This is the
 * fingerprint the two window sizes have to agree on exactly.
 */
const fingerprint = (page) => page.evaluate(() => [...document.querySelectorAll('.screen *')]
  .map((el) => [
    el.tagName,
    el.className.toString(),
    el.offsetTop, el.offsetLeft, el.offsetWidth, el.offsetHeight,
    getComputedStyle(el).fontSize,
  ].join('|')));

test('the logical viewport is fixed, and the frame is drawn at the scale', async () => {
  for (const viewport of [SHORT, TALL]) {
    const { context, page } = await open('/calculator/saving', viewport, { solveFor: 'amount' });
    const g = await geometry(page);

    assert.equal(g.logical.width, g.declaredWidth,
      `at ${viewport.width}x${viewport.height} the screen lays out at ${g.logical.width}px, not --frame-width`);
    assert.equal(g.logical.height, g.declaredHeight,
      `at ${viewport.width}x${viewport.height} the screen lays out at ${g.logical.height}px, not --frame-height`);

    // The magnification is real: what is drawn is the logical box times the scale.
    assert.ok(Math.abs(g.drawn.width - g.logical.width * g.scale) < 1,
      `drawn width ${g.drawn.width} is not ${g.logical.width} x ${g.scale}`);
    assert.ok(Math.abs(g.drawn.height - g.logical.height * g.scale) < 1,
      `drawn height ${g.drawn.height} is not ${g.logical.height} x ${g.scale}`);

    // NEVER BELOW 1. A frame rendered smaller than its natural size is the
    // defect this decision exists to remove, not a graceful degradation.
    assert.ok(g.scale >= 1, `scale ${g.scale} is below 1 at ${viewport.width}x${viewport.height}`);
    assert.ok(g.scale <= 1.5, `scale ${g.scale} is above the cap at ${viewport.width}x${viewport.height}`);

    // The layout box the page reserves is the size the frame is DRAWN at, so
    // nothing is painted outside a box the page never accounted for.
    assert.ok(Math.abs(g.frameBox.height - g.drawn.height) < 2 * 14 * g.scale + 1,
      `#app-frame reserves ${g.frameBox.height}px for a frame drawn ${g.drawn.height}px tall`);

    // Centred, and no horizontal scrollbar at either size.
    const centreOffset = Math.abs((g.frameBox.left + g.frameBox.right) / 2 - g.viewport.width / 2);
    assert.ok(centreOffset < 2, `frame is ${centreOffset}px off centre at ${viewport.width}x${viewport.height}`);
    assert.equal(g.horizontalOverflow, 0,
      `a horizontal scrollbar appeared at ${viewport.width}x${viewport.height}`);

    await context.close();
  }
});

test('a window too short scrolls the page rather than shrinking the frame', async () => {
  const { context, page } = await open('/tracker', SHORT);
  const g = await geometry(page);
  assert.equal(g.scale, 1, 'the short window shrank the frame instead of scrolling');
  assert.ok(g.pageScroll > 0, 'the short window clipped the frame with nothing to scroll to');
  // The whole frame is reachable: what scrolls is exactly what does not fit.
  assert.ok(g.pageScroll >= g.frameBox.height - g.viewport.height - 1,
    `${g.pageScroll}px of scroll for ${g.frameBox.height - g.viewport.height}px of overflow`);
  await context.close();
});

test('a window tall enough holds the whole frame with no page scroll', async () => {
  const { context, page } = await open('/tracker', TALL);
  const g = await geometry(page);
  assert.ok(g.scale > 1, `the tall window left the frame at ${g.scale}`);
  assert.equal(g.pageScroll, 0, 'the tall window scrolled a frame that fits');
  await context.close();
});

test('the layout inside the frame is identical at both window sizes', async () => {
  const shot = async (viewport, route, extra) => {
    const { context, page } = await open(route, viewport, extra);
    const rows = await fingerprint(page);
    await context.close();
    return rows;
  };

  // Three screens rather than one: the calculator's date step (the most
  // measured screen in the build), the tracker (the longest), and frame 33.
  for (const [route, extra] of [
    ['/calculator/saving', { solveFor: 'amount' }],
    ['/tracker', {}],
    ['/settings', {}],
  ]) {
    const short = await shot(SHORT, route, extra);
    const tall = await shot(TALL, route, extra);
    assert.equal(short.length, tall.length, `${route} rendered a different number of boxes`);
    for (let i = 0; i < short.length; i += 1) {
      assert.equal(tall[i], short[i],
        `${route} laid out differently between window sizes:\n  1280x720:  ${short[i]}\n  2560x1440: ${tall[i]}`);
    }
  }
});

/**
 * THE LIST HANGS BELOW THE TRIGGER, IN EVERY STATE (DECISIONS.md D84 as
 * revised; D96 pinned the ordinary visit and this pins the rest).
 *
 * THERE IS NO UPWARD VARIANT LEFT TO ASSERT. Earlier revisions of this file
 * asserted direction on whichever visit the test happened to run, which is how
 * a ONE layout pixel margin passed for two builds while already failing,
 * unasserted, at Large text. Then D96 asserted below on the ordinary visit and
 * above on the disclosure visit - correct at the time, and exactly the
 * session-to-session interaction variance D92 exists to remove.
 *
 * The disclosure now renders BELOW the date controls, so the space beneath the
 * trigger no longer depends on whether it is showing, and every state opens the
 * same way. All three states are asserted at both viewports and both text
 * sizes, over one geometry check, so no state is the tested one.
 */
const DISCLOSURE_STATES = (() => {
  const now = new Date();
  const at = (n) => {
    const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
    return { targetMonth: d.getMonth() + 1, targetYear: d.getFullYear() };
  };
  // THE CAP STATE CARRIES ITS OWN BALANCE, AND ITS DATE COMES FROM THE MODEL
  // (DECISIONS.md D158). It was a hand-written 120 months, "far past the cap"
  // only while the shared seed held 21,000; against the accounts' own 8,950 the
  // cap is past the list's span and 120 months is inside it, so nothing moved
  // and no disclosure was drawn. A balance whose crossing is inside the span,
  // and a date forty months past that crossing, keep this state what it is named.
  const capBalance = { 'saved-toward-deposit': { value: 21000, provenance: 'read' } };
  const capMonths = Math.floor(monthsToGoalUnaided({ ...FULL, ...capBalance }).value);
  return [
    ['ordinary', {}, false],
    // Past the cap, and far below the floor: the two moves that disclose.
    ['moved-to-cap', { ...capBalance, ...at(capMonths + 40) }, true],
    ['moved-to-floor', at(1), true],
  ];
})();

async function openList(viewport, extra) {
  const { context, page } = await open('/calculator/saving', viewport, { solveFor: 'amount', ...extra });
  await page.click('[data-list="year"]');
  await page.waitForTimeout(120);
  const m = await page.evaluate(() => {
    const box = (el) => { const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, height: b.height }; };
    const trigger = document.querySelector('[data-list="year"]');
    const popover = document.querySelector('[data-popover="year"]');
    const list = popover.querySelector('[role="listbox"]');
    const dock = document.querySelector('.action-bar-dock');
    const banner = document.querySelector('#date-moved');
    return {
      hidden: popover.hidden,
      expanded: trigger.getAttribute('aria-expanded'),
      disclosure: !!banner,
      field: box(trigger.closest('.date-select__field')),
      popover: box(popover), list: box(list), screen: box(document.querySelector('.screen')),
      dock: dock ? box(dock) : null,
      options: list.querySelectorAll('[role="option"]').length,
      // The clamped height is a CSS length, so it is in LAYOUT pixels
      // whatever the frame is drawn at.
      maxHeight: Number.parseFloat(getComputedStyle(list).maxHeight),
      rowHeight: list.querySelector('[role="option"]').getBoundingClientRect().height,
      drawnHeight: box(list).height,
      scale: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-scale')),
    };
  });
  return { context, page, m };
}

test('the overlay listbox hangs below the trigger in every state, at both scales', async () => {
  for (const viewport of [SHORT, TALL]) {
    for (const textSize of ['default', 'large']) {
      for (const [name, date, expectDisclosure] of DISCLOSURE_STATES) {
        const at = `at ${viewport.width}x${viewport.height}, ${textSize} text, ${name}`;
        const { context, m } = await openList(viewport, { textSize, ...date });
        try {
          assert.equal(m.disclosure, expectDisclosure, `the disclosure was ${m.disclosure ? 'drawn' : 'absent'} unexpectedly ${at}`);
          assert.equal(m.hidden, false, `the list did not open ${at}`);
          assert.equal(m.expanded, 'true', `aria-expanded was not set ${at}`);

          // DOWNWARD. The whole point of the revision: one direction, whatever
          // the state, so the interaction cannot vary between two sessions.
          assert.ok(m.popover.top >= m.field.bottom - 1, `the list did not hang below its trigger ${at}`);
          assert.ok(m.popover.top - m.field.bottom < 20 * m.scale,
            `the list floated ${m.popover.top - m.field.bottom}px from its trigger ${at}`);

          // ANCHORED: the popover spans exactly its own field. Both are
          // CSS-positioned, so this proves the transform did not move the
          // overlay away from the control it belongs to.
          assert.ok(Math.abs(m.popover.left - m.field.left) < 1, `list left edge is ${m.popover.left - m.field.left}px from its field ${at}`);
          assert.ok(Math.abs(m.popover.right - m.field.right) < 1, `list right edge is ${m.popover.right - m.field.right}px from its field ${at}`);

          // Never across the trigger it belongs to.
          assert.ok(m.popover.top >= m.field.bottom - 1, `the open list overlaps its own trigger ${at}`);

          // INSIDE THE FRAME. `.screen` is the fixed logical viewport (D92); a
          // list reaching past it is drawn outside the phone.
          assert.ok(m.popover.top >= m.screen.top - 2, `the list reaches ${m.screen.top - m.popover.top}px above the frame ${at}`);
          assert.ok(m.popover.bottom <= m.screen.bottom + 2, `the list reaches ${m.popover.bottom - m.screen.bottom}px below the frame ${at}`);

          // CLEAR OF THE DOCK, MEASURED IN LAYOUT PIXELS. The height is measured
          // from drawn geometry and applied as a layout length, and getting that
          // conversion wrong is what a scale transform breaks: the list would be
          // set half again too tall and reach past the bar it was measured
          // against. The 1px allowance is the popover's own border - the same
          // 1px at both scales, a constant rather than something that grows with
          // the magnification.
          if (m.dock) {
            const over = (m.list.bottom - m.dock.top) / m.scale;
            assert.ok(over <= 1, `the open list reaches ${over} layout px past the action bar ${at}`);
          }
          assert.ok(Math.abs(m.drawnHeight - m.maxHeight * m.scale) < 2,
            `the list is drawn ${m.drawnHeight}px for a ${m.maxHeight}px clamp at scale ${m.scale} ${at}`);

          // NEVER SHORTER THAN THE MINIMUM USABLE LENGTH (D96): three rows.
          // Asserted here rather than enforced in the component, because a
          // screen that cannot seat three rows below its own control is a layout
          // defect to fix, not something to paper over at run time.
          const rows = m.maxHeight / (m.rowHeight / m.scale);
          assert.ok(rows >= 3, `the list was clamped to ${rows.toFixed(2)} rows, below the 3-row minimum ${at}`);
        } finally { await context.close(); }
      }
    }
  }
});

test('keyboard focus rings stay 2 logical pixels, around the control they belong to', async () => {
  for (const viewport of [SHORT, TALL]) {
    const { context, page } = await open('/calculator/saving', viewport, { solveFor: 'amount' });
    // A REAL KEYBOARD FOCUS, not `.focus()`: the ring is on `:focus-visible`,
    // which a scripted focus does not necessarily satisfy.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);

    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      const screen = document.querySelector('.screen').getBoundingClientRect();
      return {
        tag: el.tagName,
        width: Number.parseFloat(cs.outlineWidth),
        offset: Number.parseFloat(cs.outlineOffset),
        style: cs.outlineStyle,
        colour: cs.outlineColor,
        box: { top: b.top, bottom: b.bottom, left: b.left, right: b.right },
        screen,
        scale: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-scale')),
      };
    });

    const at = `at ${viewport.width}x${viewport.height}`;
    assert.ok(f, `nothing took keyboard focus ${at}`);
    // The ring is declared in layout pixels and stays declared in them; the
    // transform magnifies it along with everything else, which is the point -
    // a ring that stayed 2 device pixels would be thinner, relative to the
    // control, on the larger window.
    assert.equal(f.width, 2, `focus ring is ${f.width}px ${at}`);
    assert.equal(f.offset, 2, `focus ring offset is ${f.offset}px ${at}`);
    assert.notEqual(f.style, 'none', `focus ring is suppressed ${at}`);

    // AND IT IS AROUND THE CONTROL, not adrift from it: the outline is drawn
    // on the focused element's own box, so the box has to be inside the phone
    // rather than at some pre-transform position on the page.
    assert.ok(f.box.left >= f.screen.left - 1 && f.box.right <= f.screen.right + 1,
      `the focused control is outside the phone horizontally ${at}`);
    assert.ok(f.box.top >= f.screen.top - 1 && f.box.bottom <= f.screen.bottom + 1,
      `the focused control is outside the phone vertically ${at}`);

    await context.close();
  }
});

test('the scale is recomputed when the window is resized', async () => {
  const { context, page } = await open('/tracker', SHORT);
  const before = (await geometry(page)).scale;
  await page.setViewportSize(TALL);
  // Past the debounce, which is what makes a drag cheap and this assertion
  // meaningful: the value is stale until the window stops moving.
  await page.waitForTimeout(400);
  const after = (await geometry(page)).scale;
  assert.ok(after > before, `the scale stayed at ${before} after the window grew`);

  await page.setViewportSize(SHORT);
  await page.waitForTimeout(400);
  assert.equal((await geometry(page)).scale, before, 'the scale did not come back down');
  await context.close();
});
