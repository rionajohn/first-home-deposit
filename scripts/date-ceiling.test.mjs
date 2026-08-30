/**
 * FRAME 10b'S CEILING, AND THE FIGURE IT IS ABOUT. DECISIONS.md D80, closing
 * GAPS.md G64 and G65.
 *
 * WHY IT IS ITS OWN FILE. The defect it guards was open for two weeks with the
 * whole suite green, because nothing in the suite looks at what frame 10b
 * COMMITS. `smoke.test.mjs` asserts the screen mounts - it did, perfectly, while
 * accepting an impossible figure. `overlap.test.mjs` asserts nothing crosses
 * text - true of a screen showing £1,861 against a £640 ceiling. D77's finding
 * exactly: an assertion that passes for a reason unrelated to what it claims to
 * test is worse than none, because it is counted.
 *
 * WHAT IT ASSERTS, AND IN WHAT FORM. Shape, not figures, so it survives a
 * re-scale of the seeded session the way `chart-range.test.mjs` does (D73's
 * third amendment). Every expected value below is derived from `model.js` at
 * run time and compared against what the SCREEN did; none is written here as a
 * constant. If `session-seed.mjs` changes its property value, its left-over or
 * its saved total, these tests follow it instead of breaking.
 *
 * THE BOUNDARY IS THE CENTRAL ASSERTION. `monthsToReachAmount` at the ceiling
 * gives the earliest month the goal is reachable; `monthlyAmountFromDate` at
 * that month must therefore solve to at or under the ceiling, and at the month
 * before it must solve to over. The screen must draw the banner on exactly the
 * second and not the first. That ties the screen's refusal, the figure it
 * shows, and the earliest date it names to one function each rather than to a
 * number typed here.
 *
 * THE COPY HAS LANDED (D81), so the slots are assertable and are asserted. The
 * banner interpolates `{max}` and `{earliest}`; `{amount}` is deliberately
 * unused, and the test below checks that too - an unused slot must leave no
 * literal `{amount}` and no doubled space behind it, which is the one way
 * `fill()` can go wrong quietly.
 *
 * The `{earliest}` assertion is the one that was deferred while the string read
 * `[AWAITING COPY]`. It now closes the loop the boundary test opened: the month
 * the banner NAMES is the same month at which the screen stops drawing the
 * banner at all, both derived from `monthsToReachAmount`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { FULL } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';
import { monthlyAmountFromDate, monthsToReachAmount, combinedGoal } from '../src/model/model.js';

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

const CEILING = FULL['left-over'].value;

/**
 * The earliest whole month at which the goal is reachable at the ceiling -
 * the same figure `earliestWorkableDateLabel` in the screen builds its label
 * from, through the same function and the same rounding (D2: a month figure
 * shown to a participant rounds UP, because a date earlier than the maths
 * gives is a date that does not work).
 */
const EARLIEST_MONTHS = Math.ceil(monthsToReachAmount({
  startingBalance: FULL['saved-toward-deposit'].value,
  targetAmount: combinedGoal(FULL).value,
  monthlyAmount: CEILING,
}));

/** The month/year a date `n` months from today lands on - `monthsFromNow`'s inverse. */
function dateAtMonths(n) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
  return { targetMonth: d.getMonth() + 1, targetYear: d.getFullYear() };
}

const [server, base] = await startServer();
const browser = await chromium.launch();

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

/**
 * A FRESH TAB EVERY TIME, never a reload: a reload can restore a stale session
 * (D59), and every seed here carries `buildVersion` for the same reason.
 */
async function openAt(months, extra = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, { ...FULL, solveFor: 'amount', ...dateAtMonths(months), ...extra, buildVersion: BUILD_VERSION });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/#/calculator/saving`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  assert.deepEqual(errors, [], `frame 10b raised: ${errors.join(' | ')}`);
  return { context, page };
}

const probe = (page) => page.evaluate(() => {
  const banner = document.querySelector('.warning-banner');
  const figure = document.querySelector('.figure-input[role="status"]');
  const primary = document.querySelector('.button--primary');
  const stored = JSON.parse(sessionStorage.getItem('yfh-state') || '{}');
  return {
    hasBanner: !!banner,
    bannerRole: banner?.getAttribute('role') ?? null,
    bannerId: banner?.id ?? null,
    bannerText: banner?.querySelector('p')?.textContent ?? null,
    hasReadout: !!figure,
    readoutText: figure?.querySelector('.figure-display')?.textContent ?? null,
    readoutLive: figure?.getAttribute('aria-live') ?? null,
    disabled: primary?.disabled ?? null,
    describedBy: primary?.getAttribute('aria-describedby') ?? null,
    committed: {
      rate: stored['savings-rate'], low: stored['monthly-low'], high: stored['monthly-high'],
    },
  };
});

// ---------------------------------------------------------------------------
// The boundary. G64.
// ---------------------------------------------------------------------------

test('the earliest workable month solves to at or under the ceiling, and the month before it does not', () => {
  // The precondition the two screen tests below rest on. Asserted separately so
  // that a seed whose goal is reachable immediately fails HERE, naming the
  // fixture, rather than failing as a mysterious missing banner.
  assert.ok(EARLIEST_MONTHS >= 2, `the seed reaches its goal in ${EARLIEST_MONTHS} months at the ceiling, which leaves no month before the boundary to test`);
  const at = monthlyAmountFromDate(FULL, EARLIEST_MONTHS).value;
  const before = monthlyAmountFromDate(FULL, EARLIEST_MONTHS - 1).value;
  assert.ok(at <= CEILING, `at the earliest month the solve is ${at}, above the ${CEILING} ceiling`);
  assert.ok(before > CEILING, `one month earlier the solve is ${before}, not above the ${CEILING} ceiling`);
});

test('a date needing more than what is left over raises the banner and disables Continue', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    assert.ok(seen.hasBanner, 'no banner on a date the ceiling cannot meet');
    assert.equal(seen.disabled, true, 'Continue was left enabled over an impossible figure');
  } finally {
    await context.close();
  }
});

test('the earliest workable date raises nothing and leaves Continue enabled', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS);
  try {
    const seen = await probe(page);
    assert.equal(seen.hasBanner, false, `banner drawn at the earliest workable date: "${seen.bannerText}"`);
    assert.equal(seen.disabled, false, 'Continue disabled at a date the ceiling can meet');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// Option C's invariant: nothing the participant set is discarded. D80, D46.
// ---------------------------------------------------------------------------

test('pressing Continue over the ceiling commits nothing and goes nowhere', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const before = await probe(page);
    // CLICKED THROUGH THE DOM, not through Playwright's actionability check,
    // which refuses a disabled button. Both guards are being tested: the
    // attribute AND the handler's own early return. A future change that drops
    // `disabled` would still have to leave the handler refusing.
    await page.evaluate(() => document.querySelector('[data-action="continue"]').click());
    await page.waitForTimeout(300);
    const after = await probe(page);
    assert.equal(await page.evaluate(() => window.location.hash), '#/calculator/saving', 'Continue navigated away from an error state');
    assert.deepEqual(after.committed, before.committed, 'Continue wrote a figure while the ceiling error stood');
    // And specifically that the seed's own committed range is untouched: this
    // path may not clamp, reset or replace anything (option C).
    assert.deepEqual(after.committed.low, FULL['monthly-low'], 'monthly-low was rewritten on the date path');
    assert.deepEqual(after.committed.high, FULL['monthly-high'], 'monthly-high was rewritten on the date path');
    assert.deepEqual(after.committed.rate, FULL['savings-rate'], 'savings-rate was rewritten on the date path');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The readout. G65.
// ---------------------------------------------------------------------------

test('the date path renders the monthly amount it solves, and it matches the model', async () => {
  const months = EARLIEST_MONTHS + 6;
  const { context, page } = await openAt(months);
  try {
    const seen = await probe(page);
    assert.ok(seen.hasReadout, 'the date path solved a monthly amount and rendered nothing');
    const expected = monthlyAmountFromDate(FULL, months).value;
    // Compared as the RENDERED string against the model put through the same
    // formatter, rather than by parsing digits back out - so a change to
    // `format.js` cannot make this pass while the screen shows something else.
    const { formatCurrency } = await import('../src/format.js');
    assert.equal(seen.readoutText, formatCurrency(expected));
  } finally {
    await context.close();
  }
});

test('the readout is a live region, so stepping the date announces the new amount', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 6);
  try {
    assert.equal((await probe(page)).readoutLive, 'polite');
  } finally {
    await context.close();
  }
});

test('the figure stays on screen while it is being refused', async () => {
  // G65's own argument for why the ceiling check needs the readout beside it:
  // an error saying "not this date" is not actionable if the participant cannot
  // see the figure it is about.
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    assert.ok(seen.hasBanner && seen.hasReadout, 'the banner is drawn without the figure it refers to');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// D78 consistency: this banner behaves like the other seven.
// ---------------------------------------------------------------------------

test('the banner is an alert and the disabled Continue points at it', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    assert.equal(seen.bannerRole, 'alert');
    assert.ok(seen.bannerId, 'the banner carries no id for Continue to reference');
    assert.equal(seen.describedBy, seen.bannerId, 'Continue does not describe itself with the error explaining it');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The two paths keep their own copy. D80, D34 (Category B).
// ---------------------------------------------------------------------------

test('the date path does not reuse the slider path error string', async () => {
  const { default: content } = await import('../src/content.js');
  const c = content['/calculator/saving'];
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    assert.notEqual(seen.bannerText, c.errorExceedsLeftOver, 'the date path is showing "Choose a smaller range" on a screen with no range control');
    // NOT compared against the template, which is what this line did while the
    // string was `[AWAITING COPY]` and had no slots to fill. The template now
    // carries slots, so an equality check against it would only pass if the
    // screen had stopped interpolating - the opposite of what this asserts.
    assert.notEqual(seen.bannerText, c.errorDateNeedsMoreThanLeftOver, 'the banner rendered its own template, so no slot was filled');
    assert.match(seen.bannerText, /^That date needs more than /, 'the banner is not the date path string at all');
  } finally {
    await context.close();
  }
});

test('the banner fills {max} and {earliest}, and leaves no trace of the unused {amount}', async () => {
  const { formatCurrency } = await import('../src/format.js');
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const text = (await probe(page)).bannerText;
    // {max} is the ceiling, formatted the way every other figure on this screen
    // is - read through `format.js` rather than written here, so a change to the
    // formatter cannot leave this passing while the banner shows something else.
    assert.ok(text.includes(formatCurrency(CEILING)), `the banner does not name the ceiling: "${text}"`);
    // {earliest} is the same month the boundary test pins, so the date the
    // participant is TOLD is the earliest one is the date at which the screen
    // actually stops refusing. D81.
    const now = new Date();
    const reached = new Date(now.getFullYear(), now.getMonth() + EARLIEST_MONTHS, 1);
    const label = `${reached.toLocaleString('en-GB', { month: 'long' })} ${reached.getFullYear()}`;
    assert.ok(text.includes(label), `the banner names a different earliest date than the boundary: expected "${label}" in "${text}"`);
    // AND NOTHING IS LEFT OF THE SLOT THE COPY DOES NOT USE. `fill()` is a
    // `String.replace` per key, so an unused slot is silently harmless - but a
    // slot the copy DOES name and the screen stops passing would render as a
    // literal, and a slot removed from the copy without its surrounding
    // whitespace would double a space. Both are invisible in a screenshot.
    assert.doesNotMatch(text, /\{[a-z]+\}/, `an unfilled slot reached the screen: "${text}"`);
    assert.doesNotMatch(text, /\s{2,}/, `the banner carries doubled whitespace: "${text}"`);
    assert.equal(text, text.trim(), 'the banner carries leading or trailing whitespace');
  } finally {
    await context.close();
  }
});

test('the slider path still shows its own ceiling error, unchanged', async () => {
  const { default: content } = await import('../src/content.js');
  const c = content['/calculator/saving'];
  const { context, page } = await openAt(EARLIEST_MONTHS, {
    solveFor: 'date',
    'monthly-low': { value: CEILING + 100, provenance: 'entered' },
    'monthly-high': { value: CEILING + 400, provenance: 'entered' },
  });
  try {
    const seen = await probe(page);
    assert.equal(seen.bannerText, c.errorExceedsLeftOver);
    assert.equal(seen.disabled, true);
  } finally {
    await context.close();
  }
});
