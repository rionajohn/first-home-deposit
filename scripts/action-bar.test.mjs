/**
 * The pinned action bar (DECISIONS.md D39).
 *
 * WHY THIS IS A TEST AND NOT A LOOK AT SOME SCREENSHOTS
 * Every claim D39 makes is a claim about RENDERED GEOMETRY across a matrix of
 * screens and viewport sizes, and each one fails silently: a bar overlapping
 * the tab bar by 3px, a last element that cannot quite clear the bar, a screen
 * that picks the wrong layout mode at one height and the right one at another.
 * None of those show up in a stylesheet and most do not show up in a
 * screenshot either. So the assertions below measure boxes in a real browser,
 * on every screen that has an action bar, at every viewport the brief names.
 *
 * The four things asserted, per screen per viewport:
 *   PINNED       the bar is inside the screen, and its bottom edge is at the
 *                tab bar's top edge (or at the screen's own bottom where there
 *                is no tab bar). No gap, no overlap.
 *   VISIBLE      the buttons are on screen and hittable at first paint,
 *                without scrolling. This is the whole of the brief.
 *   CLEARS       scrolled to the end, the last real content element sits fully
 *                above the bar's top edge. Nothing is ever stuck behind it.
 *   MODE         a screen whose content fits puts the bar directly after that
 *                content; a screen that overflows pins it to the bottom.
 *
 * Run: node --test scripts/action-bar.test.mjs
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
// The seed is shared with the other browser-driven scripts. See
// `scripts/session-seed.mjs` for what it holds, and for the rule about adding
// to it: a key that selects the variant THIS script looks at belongs in this
// file's own override list, not in the shared one.
import { FULL, f } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';
// Every seed below carries `buildVersion` (DECISIONS.md D59). `state.js` now
// DISCARDS a stored session whose stamp is not the running build's, so an
// unstamped seed would be thrown away and the harness would silently measure
// a default session instead of the one it set up.

const ROOT = path.resolve('.');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
let server;
let browser;
let base;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const f = path.join(ROOT, p === '/' ? 'index.html' : p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${server.address().port}`; resolve(); });
  });
}

/**
 * Every route that renders an action bar, by the flow the brief names.
 * Frames 01, 08, 12, 19b, 20, 21 and 33 are absent because they have no action
 * bar at all; that absence is asserted separately at the end.
 */
const SCREENS = [
  ['02  journey', '/journey', {}],
  ['03  accounts', '/consent', {}],
  ['05  position', '/position', {}],
  ['06  summary', '/position/summary', {}],
  // --- deposit calculator ---
  ['09  property', '/calculator/property', {}],
  ['09a property empty', '/calculator/property', { 'property-value': f(null, null), 'deposit-pct': f(null, null) }],
  ['09b LISA cap', '/calculator/property', { 'property-value': f(480000, 'entered'), lisaCapBreached: true }],
  ['10  saving date', '/calculator/saving', { solveFor: 'date' }],
  ['10b saving amount', '/calculator/saving', { solveFor: 'amount', targetMonth: 6, targetYear: 2028 }],
  ['11  review', '/calculator/review', {}],
  // --- tracker and explainer ---
  ['13  ltv', '/learn/ltv', {}],
  ['15  tracker below', '/tracker', { 'saved-toward-deposit': f(12000), 'checkpoint-amount': f(21000, 'derived') }],
  ['16  tracker reached', '/tracker', { 'saved-toward-deposit': f(22000), 'checkpoint-amount': f(21000, 'derived') }],
  // --- Mortgage in Principle ---
  ['17  mip', '/mip', {}],
  ['18  mip about', '/mip/about', {}],
  ['19  mip pre-check', '/mip/pre-check', {}],
  ['22  mip adviser', '/mip/adviser', {}],
];

/** The sheets. Their dock is absolute against a content-sized card. */
const SHEETS = [
  ['03b move account', '/consent/move-account', {}],
  ['10c leave', '/calculator/exit', {}],
  ['13b ltv video', '/learn/ltv/video', {}],
  ['29  saving', '/assumptions/saving', {}],
  ['30  deposit', '/assumptions/deposit', {}],
  ['31  borrowing', '/assumptions/borrowing', {}],
  ['32  sources', '/assumptions/sources', {}],
];

/** The brief's viewport matrix. The tightest common case first. */
const VIEWPORTS = [
  ['375x667', 375, 667],
  ['375x812', 375, 812],
  ['430x932', 430, 932],
  ['1280x900 framed', 1280, 900],
];

/**
 * Runs in the page. Measures the action bar against the screen, the tab bar
 * and the content, and reports the numbers the assertions need.
 */
const MEASURE = () => {
  const screen = document.querySelector('.screen');
  const bar = document.querySelector('.action-bar');
  const dock = document.querySelector('.action-bar-dock');
  const nav = document.querySelector('.bottom-nav');
  const scroller = document.querySelector('.screen-content, .bottom-sheet__content');
  if (!bar || !scroller) return null;

  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height };
  };

  // The last element that carries real content, i.e. the last in-flow child of
  // the scroller that actually renders something. Not the scroller's padding.
  const children = [...scroller.children].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    return el.getBoundingClientRect().height > 0;
  });
  const last = children[children.length - 1] || null;

  // Is the bar's primary button actually the thing at that point on screen, or
  // is something painted over it? This is what "visible and hittable" means.
  const primary = bar.querySelector('button, a');
  let hit = null;
  if (primary) {
    const b = primary.getBoundingClientRect();
    const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    hit = el ? primary.contains(el) || el.contains(primary) : false;
  }

  const cs = getComputedStyle(bar);

  return {
    screen: r(screen),
    bar: r(bar),
    dock: r(dock),
    nav: r(nav),
    scroller: r(scroller),
    last: r(last),
    lastTag: last ? `${last.tagName}.${last.className}`.slice(0, 60) : null,
    hit,
    opacity: parseFloat(cs.opacity),
    pointerEvents: cs.pointerEvents,
    borderTop: cs.borderTopWidth,
    inline: !!document.querySelector('.screen.actions-inline'),
    barCount: document.querySelectorAll('.action-bar').length,
    scrollTop: scroller.scrollTop,
    scrollHeight: scroller.scrollHeight,
    clientHeight: scroller.clientHeight,
  };
};

const SCROLL_TO_END = () => {
  const s = document.querySelector('.screen-content, .bottom-sheet__content');
  if (s) s.scrollTop = s.scrollHeight;
};

async function open(route, overrides, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
  await ctx.addInitScript((v) => { try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch {} }, { ...FULL, ...overrides, buildVersion: BUILD_VERSION });
  const page = await ctx.newPage();
  await page.goto(`${base}/#${route}`);
  await page.waitForTimeout(260);
  return { ctx, page };
}

before(async () => {
  await startServer();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

// 1px of slack. The framed view scales the frame by a non-integer factor, so
// two edges that coincide in layout can differ by a fraction on screen.
const EPS = 1.5;

for (const [label, width, height] of VIEWPORTS) {
  for (const [name, route, overrides] of SCREENS) {
    test(`${label} — ${name}: pinned above the tab bar, visible without scrolling, and clearable`, async () => {
      const { ctx, page } = await open(route, overrides, width, height);
      try {
        assert.equal(await page.evaluate(() => window.location.hash), `#${route}`, `${name} did not stay on ${route}`);

        const m = await page.evaluate(MEASURE);
        assert.ok(m, `${name}: no action bar found`);

        // --- VISIBLE, at first paint, without any scrolling -----------------
        assert.equal(m.scrollTop, 0, `${name}: expected to measure at the top of the screen`);
        assert.equal(m.opacity, 1, `${name}: bar is not fully opaque`);
        assert.notEqual(m.pointerEvents, 'none', `${name}: bar cannot be tapped`);
        assert.equal(m.hit, true, `${name}: the primary button is covered by something else`);
        assert.ok(
          m.bar.top >= m.screen.top - EPS && m.bar.bottom <= m.screen.bottom + EPS,
          `${name}: bar is outside the phone screen (bar ${m.bar.top}-${m.bar.bottom}, screen ${m.screen.top}-${m.screen.bottom})`
        );

        // --- NO OVERLAP WITH THE TAB BAR ------------------------------------
        if (m.nav) {
          assert.ok(
            m.bar.bottom <= m.nav.top + EPS,
            `${name}: bar overlaps the tab bar by ${(m.bar.bottom - m.nav.top).toFixed(2)}px`
          );
          // AND THE TAB BAR IS STILL AT THE BOTTOM OF THE PHONE SCREEN.
          // Caught a real defect: inline mode stops `.screen-content` growing,
          // and without `margin-top: auto` on the bar the whole flex column
          // collapsed upward — the tab bar rose to sit under the action bar
          // with a band of page background beneath it. The bank's own
          // navigation must not move because a screen's copy got shorter.
          assert.ok(
            Math.abs(m.nav.bottom - m.screen.bottom) <= EPS,
            `${name}: tab bar is ${(m.screen.bottom - m.nav.bottom).toFixed(2)}px above the bottom of the phone screen`
          );
        }

        // --- THE TOP EDGE TREATMENT is present ------------------------------
        assert.ok(parseFloat(m.borderTop) > 0, `${name}: bar has no hairline`);

        // --- MODE ------------------------------------------------------------
        const overflows = m.scrollHeight - m.clientHeight > 2;
        if (overflows) {
          assert.equal(m.inline, false, `${name}: overflowing screen should be pinned`);
          // Pinned means flush with whatever is below it.
          const floor = m.nav ? m.nav.top : m.screen.bottom;
          assert.ok(
            Math.abs(m.bar.bottom - floor) <= EPS,
            `${name}: pinned bar is ${(floor - m.bar.bottom).toFixed(2)}px off the bottom`
          );
        } else {
          assert.equal(m.inline, true, `${name}: fitting screen should be inline`);
          // Inline means it follows the content rather than floating below it.
          // The gap is the scroller's own bottom inset, nothing more.
          assert.ok(
            m.dock.top - m.scroller.bottom <= EPS,
            `${name}: inline bar floats ${(m.dock.top - m.scroller.bottom).toFixed(2)}px below the content`
          );
        }

        // --- CLEARS: scrolled to the end, the last content is above the bar --
        await page.evaluate(SCROLL_TO_END);
        await page.waitForTimeout(160);
        const end = await page.evaluate(MEASURE);
        assert.ok(
          end.last.bottom <= end.bar.top + EPS,
          `${name}: last element (${end.lastTag}) is ${(end.last.bottom - end.bar.top).toFixed(2)}px behind the bar`
        );
        if (end.nav) {
          assert.ok(
            end.last.bottom <= end.nav.top + EPS,
            `${name}: last element (${end.lastTag}) reaches under the tab bar`
          );
        }
      } finally {
        await ctx.close();
      }
    });
  }
}

// --- Sheets ------------------------------------------------------------------
// One action layer at a time (requirement 8) and the sheet's own bar visible
// and clearable, at the tightest viewport only: a sheet card is content-sized,
// so its geometry does not vary with screen height the way a full screen's does.
for (const [name, route, overrides] of SHEETS) {
  test(`375x667 — sheet ${name}: its own bar, and only its own`, async () => {
    const { ctx, page } = await open(route, overrides, 375, 667);
    try {
      const m = await page.evaluate(MEASURE);
      assert.ok(m, `${name}: no action bar found`);

      // REQUIREMENT 8. A sheet route replaces the whole of #app (router.js), so
      // the screen behind it is not in the DOM and cannot contribute a second
      // action layer. Asserted rather than assumed, because "the two never both
      // appear" is a claim about the DOM and this is where it is cheap to check.
      assert.equal(m.barCount, 1, `${name}: ${m.barCount} action bars on screen at once`);
      assert.equal(await page.evaluate(() => document.querySelectorAll('.bottom-nav').length), 0,
        `${name}: a tab bar rendered under a sheet`);

      assert.equal(m.opacity, 1, `${name}: sheet bar is not fully opaque`);
      assert.equal(m.hit, true, `${name}: the sheet's primary button is covered`);
      assert.ok(parseFloat(m.borderTop) > 0, `${name}: sheet bar has no hairline`);
      assert.equal(m.inline, false, `${name}: a sheet must never take the inline mode`);

      await page.evaluate(SCROLL_TO_END);
      await page.waitForTimeout(160);
      const end = await page.evaluate(MEASURE);
      assert.ok(
        end.last.bottom <= end.bar.top + EPS,
        `${name}: last element (${end.lastTag}) is ${(end.last.bottom - end.bar.top).toFixed(2)}px behind the sheet's bar`
      );
    } finally {
      await ctx.close();
    }
  });
}

// --- The framed view pins within the phone, not the browser -------------------
test('1280x900 — the bar pins inside the bezel, not to the browser window', async () => {
  const { ctx, page } = await open('/mip/pre-check', {}, 1280, 900);
  try {
    const m = await page.evaluate(MEASURE);
    // The phone screen is a 393px column somewhere in the middle of a 1280px
    // window. If the bar were pinned to the viewport it would span the window.
    assert.ok(m.screen.width < 420, `expected the framed 393px screen, got ${m.screen.width}px`);
    assert.ok(
      Math.abs(m.bar.width - m.screen.width) <= EPS,
      `bar is ${m.bar.width}px wide against a ${m.screen.width}px screen`
    );
    assert.ok(m.screen.left > 100, `expected the frame centred in the window, screen.left = ${m.screen.left}`);
    assert.ok(m.bar.left >= m.screen.left - EPS, 'bar starts left of the phone screen');
    assert.ok(m.bar.right <= m.screen.right + EPS, 'bar runs past the right of the phone screen');
    assert.ok(m.bar.bottom <= m.screen.bottom + EPS, 'bar runs past the bottom of the phone screen');
    assert.ok(m.bar.bottom < 900 - 20, 'bar is sitting at the browser window bottom, not the phone screen bottom');
  } finally {
    await ctx.close();
  }
});

// --- The screens that deliberately have no action bar ------------------------
test('375x667 — frames 01, 08, 12, 19b, 20, 21 and 33 have no action bar, and no stale reserved height', async () => {
  for (const [route, overrides] of [
    ['/home', {}],
    // Frame 08 lost its bar with D53: the deposit calculator is the only
    // forward route from it now, and that route is the card's own button
    // inside the content, not a pinned one. Reached from frame 06, which
    // draws a bar, so the stale-height assertions apply here too.
    ['/goal-check', {}],
    ['/calculator/result', {}],
    ['/mip/running', {}],
    ['/settings', {}],
    // Frame 17's locked variant: an empty-state card carrying its own CTA, so
    // there is deliberately no bar to pin.
    ['/mip', { mipUnlocked: false }],
    // Frame 20 is the end of the MIP flow and carries no onward action
    // (DECISIONS.md D50). It is the one screen in this list that HAD a bar and
    // lost it, which is why the stale-height assertions below matter here more
    // than anywhere: it is reached from 19b, and 19 before that draws one.
    ['/mip/result/likely', {}],
    // Frame 21 is the other end of the MIP flow and lost its bar the same way
    // (DECISIONS.md D52, applying D50 here). Same reasoning as frame 20 above:
    // reached from 19b, with 19 drawing a bar two screens back, so the
    // stale-height assertions matter here too. `resultOutcome` is set because
    // 19b routes on it, and this screen is only reached with it at 'not-yet'.
    ['/mip/result/not-yet', { resultOutcome: 'not-yet' }],
  ]) {
    const { ctx, page } = await open(route, overrides, 375, 667);
    try {
      const state = await page.evaluate(() => ({
        bars: document.querySelectorAll('.action-bar').length,
        reserved: document.querySelector('.screen').style.getPropertyValue('--action-bar-height'),
        inline: document.querySelector('.screen').classList.contains('actions-inline'),
      }));
      assert.equal(state.bars, 0, `${route} rendered an action bar`);
      assert.equal(state.reserved, '', `${route} left a reserved bar height behind`);
      assert.equal(state.inline, false, `${route} left the inline mode class behind`);
    } finally {
      await ctx.close();
    }
  }
});
