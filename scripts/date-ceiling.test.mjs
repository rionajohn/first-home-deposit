/**
 * FRAME 10b'S BOUND, AND THE FIGURE IT IS ABOUT. DECISIONS.md D82 (superseding
 * D80's option C), closing GAPS.md G64 and G65.
 *
 * WHY IT IS ITS OWN FILE. The defect it guards was open for two weeks with the
 * whole suite green, because nothing in the suite looks at what frame 10b
 * COMMITS. `smoke.test.mjs` asserts the screen mounts - it did, perfectly, while
 * accepting an impossible figure. `overlap.test.mjs` asserts nothing crosses
 * text - true of a screen showing £1,861 against a £640 ceiling. D77's finding
 * exactly: an assertion that passes for a reason unrelated to what it claims to
 * test is worse than none, because it is counted.
 *
 * WHAT CHANGED UNDER D82, AND WHAT THIS FILE NOW ASSERTS. D80 let the date be
 * set and refused it with a banner; D82 bounds the stepper so it cannot be set.
 * The invariant is the same either way - **no impossible figure is committed** -
 * so the tests asserting the invariant are unchanged, and only the ones that
 * asserted the BANNER had to move. What replaced them is bound coverage: the
 * down controls are disabled at the bound, no sequence of presses gets under it
 * in either order, and a date already under it - a bound that moved while the
 * participant was on another screen - disables Continue without rewriting
 * anything.
 *
 * WHAT ASSERTS IN WHAT FORM. Shape, not figures, so it survives a re-scale of
 * the seeded session the way `chart-range.test.mjs` does (D73's third
 * amendment). Every expected value below is derived from `model.js` at run time
 * and compared against what the SCREEN did; none is written here as a constant.
 * If `session-seed.mjs` changes its property value, its left-over or its saved
 * total, these tests follow it instead of breaking.
 *
 * THE BOUNDARY IS THE CENTRAL ASSERTION. `monthsToReachAmount` at the ceiling
 * gives the earliest month the goal is reachable; `monthlyAmountFromDate` at
 * that month must therefore solve to at or under the ceiling, and at the month
 * before it must solve to over. That one number is what the stepper's disable
 * flags, the Continue guard and these tests all read, so none of the three can
 * drift from the other two.
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
 * THE BOUND, computed here the way the screen computes it - same function, same
 * inputs, same rounding (D2: a month figure shown to a participant rounds UP,
 * because a date earlier than the maths gives is a date that does not work).
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

/** Months from today to a month/year pair - the screen's own `monthsFromNow`. */
function monthsFromNow(targetMonth, targetYear) {
  const now = new Date();
  return (targetYear - now.getFullYear()) * 12 + (targetMonth - 1 - now.getMonth());
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
 *
 * `months` may be BELOW the bound, and that is not cheating - it is the one
 * state the stepper cannot produce and the app can still be in (D82): a
 * participant sets a date here, edits a figure on frame 11 that moves the
 * bound, and comes back. Seeding it is how that path is reached without driving
 * four screens.
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
  const btn = (a) => document.querySelector(`[data-action="${a}"]`);
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
    monthDownDisabled: btn('step-month-down')?.disabled ?? null,
    yearDownDisabled: btn('step-year-down')?.disabled ?? null,
    monthUpDisabled: btn('step-month-up')?.disabled ?? null,
    yearUpDisabled: btn('step-year-up')?.disabled ?? null,
    month: stored.targetMonth,
    year: stored.targetYear,
    committed: {
      rate: stored['savings-rate'], low: stored['monthly-low'], high: stored['monthly-high'],
    },
  };
});

/** Press through the DOM, past Playwright's actionability check, so a disabled control is still pressed. */
const press = async (page, action) => {
  await page.evaluate((a) => document.querySelector(`[data-action="${a}"]`).click(), action);
  await page.waitForTimeout(110);
};

// ---------------------------------------------------------------------------
// The boundary itself. G64, and the number the bound is built on.
// ---------------------------------------------------------------------------

test('the earliest workable month solves to at or under the ceiling, and the month before it does not', () => {
  // The precondition every test below rests on. Asserted separately so that a
  // seed whose goal is reachable immediately fails HERE, naming the fixture,
  // rather than failing as a mysteriously enabled control.
  assert.ok(EARLIEST_MONTHS >= 2, `the seed reaches its goal in ${EARLIEST_MONTHS} months at the ceiling, which leaves no month below the bound to test`);
  const at = monthlyAmountFromDate(FULL, EARLIEST_MONTHS).value;
  const before = monthlyAmountFromDate(FULL, EARLIEST_MONTHS - 1).value;
  assert.ok(at <= CEILING, `at the earliest month the solve is ${at}, above the ${CEILING} ceiling`);
  assert.ok(before > CEILING, `one month earlier the solve is ${before}, not above the ${CEILING} ceiling`);
});

// ---------------------------------------------------------------------------
// The bound, as a control. D82.
// ---------------------------------------------------------------------------

test('at the earliest workable date both down controls are disabled and Continue is enabled', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS);
  try {
    const seen = await probe(page);
    assert.equal(seen.monthDownDisabled, true, 'the month can still be stepped below the bound');
    assert.equal(seen.yearDownDisabled, true, 'the year can still be stepped below the bound');
    assert.equal(seen.disabled, false, 'Continue is disabled at a date the ceiling can meet');
  } finally {
    await context.close();
  }
});

test('the up controls are never disabled - the bound is a floor, not a window', async () => {
  for (const months of [EARLIEST_MONTHS, EARLIEST_MONTHS + 1, EARLIEST_MONTHS + 24]) {
    const { context, page } = await openAt(months);
    try {
      const seen = await probe(page);
      assert.equal(seen.monthUpDisabled, false, `month up disabled at bound+${months - EARLIEST_MONTHS}`);
      assert.equal(seen.yearUpDisabled, false, `year up disabled at bound+${months - EARLIEST_MONTHS}`);
    } finally {
      await context.close();
    }
  }
});

test('one month above the bound the month may step down and the year may not', async () => {
  // The two controls take DIFFERENT bounds, because they move by different
  // amounts. One month above the bound a month press lands on it; a year press
  // would land eleven months under it.
  const { context, page } = await openAt(EARLIEST_MONTHS + 1);
  try {
    const seen = await probe(page);
    assert.equal(seen.monthDownDisabled, false, 'the month cannot reach the bound it is one step from');
    assert.equal(seen.yearDownDisabled, true, 'a year press would drop eleven months under the bound');
  } finally {
    await context.close();
  }
});

test('no sequence of presses reaches a date below the bound - month first, then year', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 14);
  try {
    // Hammered rather than walked: every press is delivered through the DOM, so
    // a disabled attribute alone does not carry the test - the handler's own
    // guard has to hold too.
    for (let i = 0; i < 20; i += 1) await press(page, 'step-month-down');
    for (let i = 0; i < 5; i += 1) await press(page, 'step-year-down');
    for (let i = 0; i < 20; i += 1) await press(page, 'step-month-down');
    const seen = await probe(page);
    const landed = monthsFromNow(seen.month, seen.year);
    assert.ok(landed >= EARLIEST_MONTHS, `pressed down to ${seen.month}/${seen.year}, ${EARLIEST_MONTHS - landed} months below the bound`);
  } finally {
    await context.close();
  }
});

test('no sequence of presses reaches a date below the bound - year first, then month', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 14);
  try {
    for (let i = 0; i < 5; i += 1) await press(page, 'step-year-down');
    for (let i = 0; i < 20; i += 1) await press(page, 'step-month-down');
    for (let i = 0; i < 5; i += 1) await press(page, 'step-year-down');
    const seen = await probe(page);
    const landed = monthsFromNow(seen.month, seen.year);
    assert.ok(landed >= EARLIEST_MONTHS, `pressed down to ${seen.month}/${seen.year}, ${EARLIEST_MONTHS - landed} months below the bound`);
  } finally {
    await context.close();
  }
});

test('pressing down at the bound moves nothing at all', async () => {
  // Not the same assertion as the two above. They say the date never goes
  // under; this says a refused press does not move the date SIDEWAYS either -
  // the year does not drop while the month is dragged up to compensate, which
  // would change a value the participant set on a control they did not touch
  // (G92's pattern, and D82's first open question).
  const { context, page } = await openAt(EARLIEST_MONTHS);
  try {
    const before = await probe(page);
    await press(page, 'step-year-down');
    await press(page, 'step-month-down');
    const after = await probe(page);
    assert.equal(after.month, before.month, 'a refused press moved the month');
    assert.equal(after.year, before.year, 'a refused press moved the year');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// A bound that moved while the participant was elsewhere. D82, D46.
// ---------------------------------------------------------------------------

test('a date already below the bound is left standing, and Continue is disabled', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    const seeded = dateAtMonths(EARLIEST_MONTHS - 1);
    // NOTHING IS REWRITTEN. This is the whole of D46 in one assertion: the
    // participant's date is the date they set, not the nearest one that works.
    assert.equal(seen.month, seeded.targetMonth, 'the stored month was moved to the bound');
    assert.equal(seen.year, seeded.targetYear, 'the stored year was moved to the bound');
    assert.equal(seen.disabled, true, 'Continue is live over a date the ceiling cannot meet');
    // And the way out is open: down is refused, up is not.
    assert.equal(seen.monthDownDisabled, true, 'the date can be pushed further out of range');
    assert.equal(seen.monthUpDisabled, false, 'there is no way back toward the bound');
  } finally {
    await context.close();
  }
});

test('pressing Continue below the bound commits nothing and goes nowhere', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const before = await probe(page);
    // CLICKED THROUGH THE DOM, not through Playwright's actionability check,
    // which refuses a disabled button. Both guards are being tested: the
    // attribute AND the handler's own early return. A future change that drops
    // `disabled` would still have to leave the handler refusing.
    await press(page, 'continue');
    await page.waitForTimeout(200);
    const after = await probe(page);
    assert.equal(await page.evaluate(() => window.location.hash), '#/calculator/saving', 'Continue navigated away from a date below the bound');
    assert.deepEqual(after.committed, before.committed, 'Continue wrote a figure from a date below the bound');
    assert.deepEqual(after.committed.low, FULL['monthly-low'], 'monthly-low was rewritten on the date path');
    assert.deepEqual(after.committed.high, FULL['monthly-high'], 'monthly-high was rewritten on the date path');
    assert.deepEqual(after.committed.rate, FULL['savings-rate'], 'savings-rate was rewritten on the date path');
  } finally {
    await context.close();
  }
});

test('stepping the date does not commit anything either', async () => {
  // The other half of the same invariant: only Continue writes on this path, so
  // a participant who walks the stepper and leaves has changed no figure.
  const { context, page } = await openAt(EARLIEST_MONTHS + 6);
  try {
    const before = await probe(page);
    await press(page, 'step-month-down');
    await press(page, 'step-year-up');
    await press(page, 'step-month-up');
    const after = await probe(page);
    assert.deepEqual(after.committed, before.committed, 'a stepper press wrote a section 6 figure');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The banner D82 superseded. GAPS.md G96's frame 10b case.
// ---------------------------------------------------------------------------

test('no ceiling banner is raised anywhere on the date path, at or below the bound', async () => {
  // This is what closes G96's frame 10b case, and it replaces three tests that
  // asserted the banner's presence, its interpolated slots and its role. A
  // banner that cannot be raised cannot be asserted about - and cannot fall
  // below the fold, which is the point.
  const { default: content } = await import('../src/content.js');
  const c = content['/calculator/saving'];
  for (const months of [EARLIEST_MONTHS - 1, EARLIEST_MONTHS, EARLIEST_MONTHS + 6]) {
    const { context, page } = await openAt(months);
    try {
      const seen = await probe(page);
      assert.equal(seen.hasBanner, false, `a banner was drawn ${months - EARLIEST_MONTHS} months from the bound: "${seen.bannerText}"`);
    } finally {
      await context.close();
    }
  }
  // The string itself is KEPT, unrendered, per D82 - so that if the bound is
  // ever removed the case has its copy already written and copy-checked.
  assert.ok(c.errorDateNeedsMoreThanLeftOver, 'the superseded string was deleted rather than kept');
});

test('the past-date banner still behaves the way D78 wired it', async () => {
  // D78's treatment is asserted on the one error this screen can still raise,
  // so the wiring stays covered on this route even though the ceiling banner is
  // gone. `errorPastDate` is now reachable only from a stored date, not from a
  // press - the bound stops the steppers well before today.
  const now = new Date();
  const { context, page } = await openAt(0, { targetMonth: 1, targetYear: now.getFullYear() - 1 });
  try {
    const seen = await probe(page);
    assert.ok(seen.hasBanner, 'a date in the past raised nothing');
    assert.equal(seen.bannerRole, 'alert');
    assert.ok(seen.bannerId, 'the banner carries no id for Continue to reference');
    assert.equal(seen.describedBy, seen.bannerId, 'Continue does not describe itself with the error explaining it');
    assert.equal(seen.disabled, true);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The readout. G65 - unaffected by D82, and asserted so it stays that way.
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

test('the figure stays on screen when the date is below the bound', async () => {
  // G65's argument, applied to D82's one remaining refusal: a Continue that will
  // not move is not actionable if the participant cannot see the figure it is
  // refusing. The readout is the only thing on screen saying so until D82's
  // second open question is filled.
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    assert.ok(seen.hasReadout, 'the figure vanished on the one state that still refuses');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The slider path is untouched by any of this.
// ---------------------------------------------------------------------------

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
